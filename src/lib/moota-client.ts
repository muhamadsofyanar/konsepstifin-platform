import { createHmac, timingSafeEqual } from 'node:crypto';

export type MootaInvoiceInput = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  amount: number;
  description: string;
};
export type MootaInvoiceResult = {
  invoiceId: string;
  paymentUrl: string;
  paymentAmount: number;
  expiresAt: string | null;
  response: unknown;
};

const baseUrl = () => (process.env.MOOTA_API_BASE_URL || 'https://app.moota.co').replace(/\/+$/, '');
const token = () => (process.env.MOOTA_API_TOKEN || '').trim();
const timeoutMs = () => Math.max(1000, Math.min(30000, Number(process.env.MOOTA_API_TIMEOUT_MS || 12000)));

function parseJson(text: string): unknown {
  try { return JSON.parse(text) as unknown; } catch { return { message: text.slice(0, 300) }; }
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function nestedData(value: unknown): Record<string, unknown> {
  const root = object(value);
  return object(root.data ?? root.result ?? root.invoice ?? root.payment ?? root);
}
function firstString(value: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
  }
  return '';
}
async function request(path: string, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  if (!token()) throw new Error('MOOTA_API_TOKEN belum dikonfigurasi di environment server.');
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Path API Moota tidak valid.');
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(timeoutMs()),
    cache: 'no-store',
  });
  const raw = await response.text();
  const data = parseJson(raw);
  if (!response.ok) {
    const detail = firstString(object(data), ['message', 'error', 'detail']);
    throw new Error(`Moota API merespons HTTP ${response.status}${detail ? `: ${detail}` : ''}.`);
  }
  return data;
}

export function mootaStatus() {
  return {
    apiConfigured: Boolean(token()),
    webhookConfigured: Boolean((process.env.MOOTA_WEBHOOK_SECRET || '').trim()),
    receiveMoneyPathConfigured: Boolean((process.env.MOOTA_RECEIVE_MONEY_CREATE_PATH || '').trim()),
    bankAccountConfigured: Boolean((process.env.MOOTA_BANK_ACCOUNT_ID || '').trim()),
  };
}

export async function testMootaConnection() {
  const data = await request('/api/v2/bank', 'GET');
  const root = object(data);
  const rows = Array.isArray(root.data) ? root.data : [];
  return { connected: true, bankAccounts: rows.length };
}

/**
 * Create a Moota Terima Uang invoice. The route is configurable because Moota marks
 * the legacy Terima Uang operation as deprecated in its public API explorer.
 * Set MOOTA_RECEIVE_MONEY_CREATE_PATH to the current create operation from the account docs.
 */
export async function createMootaInvoice(input: MootaInvoiceInput): Promise<MootaInvoiceResult> {
  const path = (process.env.MOOTA_RECEIVE_MONEY_CREATE_PATH || '').trim();
  const bankId = (process.env.MOOTA_BANK_ACCOUNT_ID || '').trim();
  if (!path) throw new Error('MOOTA_RECEIVE_MONEY_CREATE_PATH belum diatur. Isi path operasi create Terima Uang dari dokumentasi API Moota yang aktif.');
  if (!bankId) throw new Error('MOOTA_BANK_ACCOUNT_ID belum dikonfigurasi.');
  if (!Number.isSafeInteger(input.amount) || input.amount < 1) throw new Error('Nominal tagihan Moota tidak valid.');
  const bankField = (process.env.MOOTA_BANK_ACCOUNT_FIELD || 'bank_id').trim();
  const payload: Record<string, unknown> = {
    [bankField]: bankId,
    name: input.customerName,
    phone: input.customerPhone,
    email: input.customerEmail,
    description: `${input.description} | ${input.orderNumber}`.slice(0, 500),
    amount: input.amount,
    expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    note: `KonsepSTIFIn order ${input.orderNumber}`,
    unique_code: false,
  };
  const response = await request(path, 'POST', payload);
  const data = nestedData(response);
  const invoiceId = firstString(data, ['invoice_id', 'invoiceId', 'id', 'reference', 'payment_id', 'uuid']);
  const paymentUrl = firstString(data, ['payment_url', 'paymentUrl', 'url', 'link', 'payment_link', 'checkout_url']);
  if (!invoiceId || !paymentUrl || !/^https:\/\//i.test(paymentUrl)) {
    throw new Error('Respons Moota tidak memuat ID tagihan dan URL pembayaran HTTPS yang dikenali. Periksa kontrak endpoint Terima Uang yang dikonfigurasi.');
  }
  const amountRaw = data.payment_amount ?? data.total_amount ?? data.amount ?? input.amount;
  const paymentAmount = Number(amountRaw);
  const expiryRaw = firstString(data, ['expired_at', 'expires_at', 'due_date', 'expiredAt']);
  return {
    invoiceId,
    paymentUrl,
    paymentAmount: Number.isSafeInteger(paymentAmount) && paymentAmount > 0 ? paymentAmount : input.amount,
    expiresAt: expiryRaw && !Number.isNaN(Date.parse(expiryRaw)) ? new Date(expiryRaw).toISOString() : null,
    response,
  };
}

export function verifyMootaSignature(rawBody: string, signature: string): boolean {
  const secret = (process.env.MOOTA_WEBHOOK_SECRET || '').trim();
  const provided = signature.trim().replace(/^sha256=/i, '');
  if (!secret || !provided || !/^[a-f0-9]{64}$/i.test(provided)) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const actual = Buffer.from(provided, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

import { createHmac, timingSafeEqual } from 'node:crypto';
import { getIntegrationConfig } from '@/lib/integration-settings';

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


function parseJson(text: string): unknown {
  try { return JSON.parse(text) as unknown; } catch { return { message: text.slice(0, 300) }; }
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function nestedData(value: unknown): Record<string, unknown> {
  let current = object(value);
  for (let i = 0; i < 4; i++) {
    const next = current.data ?? current.result ?? current.invoice ?? current.payment ?? current.transaction;
    if (!next || typeof next !== 'object' || Array.isArray(next)) break;
    current = object(next);
  }
  return current;
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
  const config = (await getIntegrationConfig()).moota;
  if (!config.apiToken) throw new Error('Token Moota belum dikonfigurasi. Buka Admin → Pengaturan → Integrasi eksternal.');
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Path API Moota tidak valid.');
  const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.apiToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(config.timeoutMs),
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

export async function mootaStatus() {
  const config = (await getIntegrationConfig()).moota;
  return { apiConfigured: Boolean(config.apiToken), webhookConfigured: Boolean(config.webhookSecret), receiveMoneyPathConfigured: Boolean(config.receiveMoneyCreatePath), bankAccountConfigured: Boolean(config.bankAccountId) };
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
  const config = (await getIntegrationConfig()).moota;
  const path = config.receiveMoneyCreatePath.trim();
  const bankId = config.bankAccountId.trim();
  if (!path) throw new Error('MOOTA_RECEIVE_MONEY_CREATE_PATH belum diatur. Isi path operasi create Terima Uang dari dokumentasi API Moota yang aktif.');
  if (!bankId) throw new Error('MOOTA_BANK_ACCOUNT_ID belum dikonfigurasi.');
  if (!Number.isSafeInteger(input.amount) || input.amount < 1) throw new Error('Nominal tagihan Moota tidak valid.');
  const bankField = config.bankAccountField.trim() || 'bank_id';
  const requestedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const payload: Record<string, unknown> = {
    [bankField]: bankId,
    name: input.customerName,
    phone: input.customerPhone,
    email: input.customerEmail,
    description: `${input.description} | ${input.orderNumber}`.slice(0, 500),
    amount: input.amount,
    expired_at: requestedExpiry,
    note: `KonsepSTIFIn order ${input.orderNumber}`,
    unique_code: false,
  };
  const response = await request(path, 'POST', payload);
  const data = nestedData(response);
  const invoiceId = firstString(data, ['invoice_id', 'invoiceId', 'transaction_id', 'transactionId', 'id', 'reference', 'payment_id', 'paymentId', 'uuid']);
  const paymentUrl = firstString(data, ['payment_url', 'paymentUrl', 'payment_link_url', 'paymentLinkUrl', 'url', 'link', 'payment_link', 'checkout_url', 'checkoutUrl', 'redirect_url', 'short_url']);
  if (!invoiceId || !paymentUrl || !/^https:\/\//i.test(paymentUrl)) {
    throw new Error('Respons Moota tidak memuat ID tagihan dan URL pembayaran HTTPS yang dikenali. Periksa kontrak endpoint Terima Uang yang dikonfigurasi.');
  }
  const amountRaw = data.payment_amount ?? data.paymentAmount ?? data.total_amount ?? data.amount_to_pay ?? data.amount ?? input.amount;
  const paymentAmount = Number(amountRaw);
  const expiryRaw = firstString(data, ['expired_at', 'expires_at', 'due_date', 'expiredAt']);
  return {
    invoiceId,
    paymentUrl,
    paymentAmount: Number.isSafeInteger(paymentAmount) && paymentAmount > 0 ? paymentAmount : input.amount,
    expiresAt: expiryRaw && !Number.isNaN(Date.parse(expiryRaw)) ? new Date(expiryRaw).toISOString() : requestedExpiry,
    response,
  };
}

export async function verifyMootaSignature(rawBody: string, signature: string): Promise<boolean> {
  const secret = (await getIntegrationConfig()).moota.webhookSecret.trim();
  const provided = signature.trim().replace(/^sha256=/i, '');
  if (!secret || !provided || !/^[a-f0-9]{64}$/i.test(provided)) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const actual = Buffer.from(provided, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

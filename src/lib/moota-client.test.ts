import { createHmac } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { createMootaInvoice, verifyMootaSignature } from './moota-client';

afterEach(() => { delete process.env.MOOTA_WEBHOOK_SECRET; delete process.env.MOOTA_API_BASE_URL; delete process.env.MOOTA_API_TOKEN; delete process.env.MOOTA_BANK_ACCOUNT_ID; delete process.env.MOOTA_RECEIVE_MONEY_CREATE_PATH; vi.unstubAllGlobals(); });

it('verifies Moota HMAC against the exact raw request body', () => {
  process.env.MOOTA_WEBHOOK_SECRET = 'secret-test';
  const raw = '[{"mutation_id":"abc","amount":50000,"type":"CR"}]';
  const signature = createHmac('sha256', 'secret-test').update(raw, 'utf8').digest('hex');
  expect(verifyMootaSignature(raw, signature)).toBe(true);
  expect(verifyMootaSignature(`${raw} `, signature)).toBe(false);
  expect(verifyMootaSignature(raw, '')).toBe(false);
});

it('rejects missing secrets and malformed signatures', () => {
  expect(verifyMootaSignature('{}', 'abc')).toBe(false);
  process.env.MOOTA_WEBHOOK_SECRET = 'secret-test';
  expect(verifyMootaSignature('{}', 'not-hex')).toBe(false);
});

it('creates a Terima Uang invoice only through the configured documented path', async () => {
  process.env.MOOTA_API_BASE_URL = 'https://app.moota.co';
  process.env.MOOTA_API_TOKEN = 'api-test';
  process.env.MOOTA_BANK_ACCOUNT_ID = 'bank-1';
  process.env.MOOTA_RECEIVE_MONEY_CREATE_PATH = '/api/v2/test-receive-money';
  const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    expect(String(_url)).toBe('https://app.moota.co/api/v2/test-receive-money');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer api-test');
    const body = JSON.parse(String(init?.body));
    expect(body.amount).toBe(125000);
    expect(body.description).toContain('KS-TEST-001');
    return new Response(JSON.stringify({ data: { invoice_id: 'inv-1', payment_url: 'https://pay.example.test/inv-1', amount: 125000 } }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  const result = await createMootaInvoice({ orderNumber: 'KS-TEST-001', customerName: 'Test', customerPhone: '081234567890', customerEmail: 'test@example.test', amount: 125000, description: 'Konsultasi' });
  expect(result).toMatchObject({ invoiceId: 'inv-1', paymentUrl: 'https://pay.example.test/inv-1', paymentAmount: 125000 });
});

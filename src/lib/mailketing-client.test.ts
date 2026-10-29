import { afterEach, expect, it, vi } from 'vitest';
import { sendMailketingEmail, testMailketingConnection } from './mailketing-client';

afterEach(() => {
  delete process.env.MAILKETING_API_TOKEN;
  delete process.env.MAILKETING_API_URL;
  delete process.env.MAILKETING_FROM_NAME;
  delete process.env.MAILKETING_FROM_EMAIL;
  vi.unstubAllGlobals();
});

it('tests the configured Mailketing v2 credits endpoint without exposing the token', async () => {
  process.env.MAILKETING_API_TOKEN = 'mail-test-token';
  process.env.MAILKETING_API_URL = 'https://api.mailketing.co.id/api/v2/send';
  const mock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    expect(String(url)).toBe('https://api.mailketing.co.id/api/v2/credits');
    expect(new Headers(init?.headers).get('x-api-token')).toBe('mail-test-token');
    return new Response(JSON.stringify({ success: true, data: { credits: 100 }, message: 'OK' }), { status: 200 });
  });
  vi.stubGlobal('fetch', mock);
  await expect(testMailketingConnection()).resolves.toMatchObject({ connected: true, credits: 100 });
});

it('sends transactional email using the Mailketing v2 contract', async () => {
  process.env.MAILKETING_API_TOKEN = 'mail-test-token';
  process.env.MAILKETING_FROM_NAME = 'KonsepSTIFIn';
  process.env.MAILKETING_FROM_EMAIL = 'notifikasi@example.test';
  const mock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    expect(String(url)).toBe('https://api.mailketing.co.id/api/v2/send');
    expect(new Headers(init?.headers).get('x-api-token')).toBe('mail-test-token');
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ from_name: 'KonsepSTIFIn', from_email: 'notifikasi@example.test', recipient: 'customer@example.test', subject: 'Instruksi', content: '<p>Bayar</p>' });
    return new Response(JSON.stringify({ success: true, data: { message_id: 'mail-1' }, message: 'Email queued successfully' }), { status: 200 });
  });
  vi.stubGlobal('fetch', mock);
  await expect(sendMailketingEmail({ recipient: 'Customer@example.test', subject: 'Instruksi', content: '<p>Bayar</p>' })).resolves.toMatchObject({ success: true, messageId: 'mail-1' });
});

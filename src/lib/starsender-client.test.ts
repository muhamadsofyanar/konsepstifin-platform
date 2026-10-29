import { afterEach, expect, it, vi } from 'vitest';
import { normalizeWhatsAppNumber, sendStarSenderText } from './starsender-client';

afterEach(() => {
  delete process.env.STARSENDER_API_KEY;
  delete process.env.STARSENDER_API_URL;
  vi.unstubAllGlobals();
});

it('normalizes Indonesian numbers to international country code format', () => {
  expect(normalizeWhatsAppNumber('0812-3456-7890')).toBe('6281234567890');
  expect(normalizeWhatsAppNumber('+62 812 3456 7890')).toBe('6281234567890');
  expect(normalizeWhatsAppNumber('6281234567890')).toBe('6281234567890');
});

it('preserves a supported Malaysian international prefix and rejects invalid numbers', () => {
  expect(normalizeWhatsAppNumber('+60 12-345 6789')).toBe('60123456789');
  expect(() => normalizeWhatsAppNumber('123')).toThrow(/tidak valid/i);
});

it('sends StarSender V3 text with the device key directly in Authorization', async () => {
  process.env.STARSENDER_API_KEY = 'device-test-key';
  const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    expect(String(_url)).toBe('https://api.starsender.online/api/send');
    expect(new Headers(init?.headers).get('authorization')).toBe('device-test-key');
    expect(new Headers(init?.headers).get('authorization')).not.toContain('Bearer ');
    expect(JSON.parse(String(init?.body))).toMatchObject({ messageType: 'text', to: '6281234567890', body: 'Tes' });
    return new Response(JSON.stringify({ success: true, message: 'Success sent message' }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  await expect(sendStarSenderText('081234567890', 'Tes')).resolves.toMatchObject({ success: true, status: 200 });
});

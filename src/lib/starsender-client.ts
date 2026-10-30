import { getIntegrationConfig } from './integration-settings.ts';
export type StarSenderResult = { success: boolean; status: number; message: string; response: unknown; messageId: string };
export async function starsenderStatus() {
  const config = (await getIntegrationConfig()).starsender;
  return { configured: Boolean(config.apiKey), endpoint: config.apiUrl };
}
export function normalizeWhatsAppNumber(value: string): string {
  let number = value.replace(/[^\d]/g, '');
  if (number.startsWith('00')) number = number.slice(2);
  if (number.startsWith('0')) number = `62${number.slice(1)}`;
  else if (number.startsWith('8')) number = `62${number}`;
  if (number.length < 9 || number.length > 15) throw new Error('Nomor WhatsApp tidak valid. Gunakan nomor dengan kode negara.');
  return number;
}
export async function sendStarSenderText(to: string, body: string): Promise<StarSenderResult> {
  const config = (await getIntegrationConfig()).starsender;
  if (!config.apiKey) throw new Error('API key StarSender belum dikonfigurasi. Buka Admin → Pengaturan → Integrasi eksternal.');
  const message = body.trim();
  if (!message || message.length > 4000) throw new Error('Pesan WhatsApp wajib diisi dan maksimal 4.000 karakter.');
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: config.apiKey, Accept: 'application/json' },
    body: JSON.stringify({ messageType: 'text', to: normalizeWhatsAppNumber(to), body: message, delay: 0 }),
    signal: AbortSignal.timeout(15000), cache: 'no-store',
  });
  let data: unknown;
  const raw = await response.text();
  try { data = JSON.parse(raw) as unknown; } catch { data = { message: raw.slice(0, 300) }; }
  const result = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const success = response.ok && result.success === true;
  const responseData = result.data && typeof result.data === 'object' ? result.data as Record<string, unknown> : {};
  const messageId = String(responseData.message_id ?? responseData.messageId ?? result.message_id ?? result.id ?? '').trim();
  return { success, status: response.status, message: typeof result.message === 'string' ? result.message : success ? 'Pesan diterima StarSender.' : `StarSender gagal (HTTP ${response.status}).`, response: data, messageId };
}

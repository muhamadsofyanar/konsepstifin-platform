import { getIntegrationConfig } from './integration-settings.ts';

export type MailketingSendResult = { success: boolean; status: number; messageId: string; message: string; response: unknown };
function obj(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function parse(raw: string): unknown { try { return JSON.parse(raw) as unknown; } catch { return { message: raw.slice(0, 300) }; } }

export async function mailketingStatus() {
  const c = (await getIntegrationConfig()).mailketing;
  return { configured: Boolean(c.apiToken && c.fromName && c.fromEmail), endpoint: c.apiUrl, senderConfigured: Boolean(c.fromEmail) };
}

export async function testMailketingConnection() {
  const c = (await getIntegrationConfig()).mailketing;
  if (!c.apiToken) throw new Error('API token Mailketing belum dikonfigurasi.');
  const creditsUrl = c.apiUrl.replace(/\/send\/?$/i, '/credits');
  const response = await fetch(creditsUrl, { headers: { Accept: 'application/json', 'X-Api-Token': c.apiToken }, signal: AbortSignal.timeout(12000), cache: 'no-store' });
  const data = obj(parse(await response.text()));
  if (!response.ok || data.success === false) {
    const msg = typeof data.message === 'string' ? data.message : `HTTP ${response.status}`;
    throw new Error(`Tes koneksi Mailketing gagal: ${msg}`);
  }
  return { connected: true, credits: obj(data.data).credits ?? obj(data.data).remaining_credits ?? null };
}

export async function sendMailketingEmail(input: { recipient: string; subject: string; content: string }): Promise<MailketingSendResult> {
  const c = (await getIntegrationConfig()).mailketing;
  if (!c.apiToken || !c.fromName || !c.fromEmail) throw new Error('Mailketing belum dikonfigurasi lengkap di Pengaturan Admin.');
  const recipient = input.recipient.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Alamat email penerima tidak valid.');
  if (!input.subject.trim() || input.subject.length > 998) throw new Error('Subjek email tidak valid.');
  if (!input.content.trim() || Buffer.byteLength(input.content, 'utf8') > 300 * 1024) throw new Error('Konten email kosong atau melebihi batas.');
  const response = await fetch(c.apiUrl, {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Api-Token': c.apiToken },
    body: JSON.stringify({ from_name: c.fromName, from_email: c.fromEmail, recipient, subject: input.subject, content: input.content }),
    signal: AbortSignal.timeout(20000), cache: 'no-store',
  });
  const data = obj(parse(await response.text()));
  const success = response.ok && data.success === true;
  return { success, status: response.status, messageId: String(obj(data.data).message_id ?? ''), message: typeof data.message === 'string' ? data.message : success ? 'Email masuk antrean Mailketing.' : `Mailketing gagal (HTTP ${response.status}).`, response: data };
}

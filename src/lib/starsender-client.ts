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

export type StarSenderGroup = {
  groupJid: string;
  groupName: string;
  deviceName: string;
  raw: Record<string, unknown>;
};

function starsenderApiUrl(path: string, configuredUrl: string) {
  const origin = new URL(configuredUrl).origin;
  return new URL(path, origin).toString();
}

function groupRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function groupString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

export async function listStarSenderGroups(): Promise<StarSenderGroup[]> {
  const config = (await getIntegrationConfig()).starsender;
  if (!config.apiKey) throw new Error('Device API key StarSender belum dikonfigurasi.');
  const response = await fetch(starsenderApiUrl('/api/whatsapp/groups', config.apiUrl), {
    method: 'GET',
    headers: { Authorization: config.apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  });
  const raw = await response.text();
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; } catch { parsed = { message: raw.slice(0, 300) }; }
  const root = groupRecord(parsed);
  if (!response.ok || root.success !== true) {
    throw new Error(groupString(root.message) || `StarSender gagal mengambil daftar grup (HTTP ${response.status}).`);
  }
  const data = root.data;
  const dataObject = groupRecord(data);
  const groupContainer = dataObject.groups ?? dataObject.data ?? root.groups;
  const candidates = Array.isArray(data)
    ? data
    : Array.isArray(groupContainer) ? groupContainer
    : groupContainer && typeof groupContainer === 'object' ? Object.values(groupRecord(groupContainer))
    : Object.values(dataObject).filter(value => value && typeof value === 'object' && !Array.isArray(value));
  const groups = candidates.map((item): StarSenderGroup | null => {
    const row = groupRecord(item);
    const groupJid = groupString(row.jid ?? row.group_jid ?? row.groupId ?? row.group_id ?? row.id ?? row.to);
    const groupName = groupString(row.group_name ?? row.groupName ?? row.subject ?? row.name ?? row.title) || groupJid;
    if (!groupJid) return null;
    return { groupJid, groupName, deviceName: groupString(row.device_name ?? row.deviceName ?? row.device), raw: row };
  }).filter((item): item is StarSenderGroup => Boolean(item));
  if (!groups.length) throw new Error('StarSender merespons sukses, tetapi format daftar grup tidak dikenali atau belum ada grup. Periksa daftar grup pada perangkat StarSender.');
  return groups;
}

export async function sendStarSenderGroupText(to: string, body: string): Promise<StarSenderResult> {
  const config = (await getIntegrationConfig()).starsender;
  if (!config.apiKey) throw new Error('Device API key StarSender belum dikonfigurasi.');
  const target = String(to ?? '').trim();
  const message = String(body ?? '').trim();
  if (!target || target.length > 255) throw new Error('ID grup WhatsApp tidak valid.');
  if (!message || message.length > 4000) throw new Error('Pesan grup wajib diisi dan maksimal 4.000 karakter.');
  const response = await fetch(starsenderApiUrl('/api/send/grup', config.apiUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: config.apiKey, Accept: 'application/json' },
    body: JSON.stringify({ messageType: 'text', to: target, body: message, delay: 0 }),
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  });
  const raw = await response.text();
  let data: unknown;
  try { data = JSON.parse(raw) as unknown; } catch { data = { message: raw.slice(0, 300) }; }
  const result = groupRecord(data);
  const responseData = groupRecord(result.data);
  const success = response.ok && result.success === true;
  const messageId = groupString(responseData.message_id ?? responseData.messageId ?? result.message_id ?? result.id);
  return {
    success,
    status: response.status,
    message: groupString(result.message) || (success ? 'Pesan grup diterima StarSender.' : `StarSender gagal mengirim ke grup (HTTP ${response.status}).`),
    response: data,
    messageId,
  };
}

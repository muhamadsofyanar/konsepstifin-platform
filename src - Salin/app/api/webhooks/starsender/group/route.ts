import { createHash, timingSafeEqual } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { getIntegrationConfig } from '@/lib/integration-settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type Obj = Record<string, unknown>;
function obj(value: unknown): Obj { return value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : {}; }
function str(value: unknown) { return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''; }
function flag(value: unknown): boolean | null { if (value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true') return true; if (value === false || value === 0 || value === '0' || String(value).toLowerCase() === 'false') return false; return null; }
function equalSecret(a: string, b: string) { const x=Buffer.from(a); const y=Buffer.from(b); return x.length===y.length && x.length>0 && timingSafeEqual(x,y); }
function providerTime(value: unknown): Date | null {
  if (typeof value === 'number' || (typeof value === 'string' && /^\d{10,13}$/.test(value))) { const n=Number(value); const d=new Date(n<10_000_000_000?n*1000:n); return Number.isNaN(d.getTime())?null:d; }
  if (typeof value === 'string' && value) { const d=new Date(value); return Number.isNaN(d.getTime())?null:d; }
  return null;
}
export async function POST(request: Request) {
  const config = await getIntegrationConfig();
  const expected = config.starsender.webhookSecret;
  const provided = new URL(request.url).searchParams.get('token') || request.headers.get('x-webhook-token') || '';
  if (!expected) return Response.json({ message: 'Secret webhook StarSender belum dikonfigurasi.' }, { status: 503 });
  if (!equalSecret(expected, provided)) return Response.json({ message: 'Token webhook tidak valid.' }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 256_000) return Response.json({ message: 'Payload terlalu besar.' }, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(raw) as unknown; } catch { return Response.json({ message: 'JSON tidak valid.' }, { status: 400 }); }
  const root = obj(payload);
  const data = obj(root.data ?? root.payload ?? root);
  const groupJid = str(data.from ?? data.group_jid ?? data.groupId ?? data.chat_id);
  const groupName = [data.group_name,data.groupName,data.subject,data.push_name,data.name].map(str).find(Boolean) || '';
  if (!groupJid || (!groupJid.includes('@g.us') && str(data.chat_type).toLowerCase() !== 'group' && flag(data.is_group) !== true)) {
    return Response.json({ message: 'Payload bukan pesan grup WhatsApp atau ID grup tidak tersedia.' }, { status: 200 });
  }
  const isMe = flag(data.is_me ?? data.isMe ?? data.from_me) === true;
  const senderJid = str(data.participant ?? data.author ?? data.sender_jid ?? data.sender ?? obj(data.key).participant);
  const senderName = str(data.participant_name ?? data.sender_name ?? data.author_name);
  const senderIsAdmin = flag(data.sender_is_admin ?? data.is_admin ?? data.isAdmin ?? data.admin);
  const messageText = str(data.message ?? data.body ?? data.text);
  const mediaUrl = str(data.file ?? data.media_url ?? data.url);
  const content = messageText || (mediaUrl ? '[Pesan media grup]' : '[Pesan grup]');
  const timestamp = providerTime(data.timestamp);
  const providerId = str(data.message_id ?? data.id ?? obj(data.key).id);
  const messageId = providerId || createHash('sha256').update(`${groupJid}|${senderJid}|${str(data.timestamp)}|${content}|${mediaUrl}|${isMe}`).digest('hex');
  const safePayload = { device: str(data.device), device_name: str(data.device_name), chat_type: str(data.chat_type), is_me: isMe, timestamp: str(data.timestamp), sender_is_admin: senderIsAdmin };
  try {
    const sql = getDatabaseClient();
    const result = await sql.begin(async tx => {
      await tx`INSERT INTO whatsapp_groups(group_jid,group_name,device_name,last_synced_at,updated_at)
        VALUES (${groupJid},${groupName || groupJid},${str(data.device ?? data.device_name)},now(),now())
        ON CONFLICT(group_jid) DO UPDATE SET group_name=CASE WHEN EXCLUDED.group_name<>'' AND EXCLUDED.group_name<>EXCLUDED.group_jid THEN EXCLUDED.group_name ELSE whatsapp_groups.group_name END,
          device_name=CASE WHEN EXCLUDED.device_name<>'' THEN EXCLUDED.device_name ELSE whatsapp_groups.device_name END,
          last_synced_at=now(),updated_at=now()`;
      const [row] = await tx`INSERT INTO whatsapp_group_messages(provider_message_id,group_jid,group_name,direction,sender_jid,sender_name,sender_is_admin,content,media_url,device_name,provider_timestamp,raw_payload)
        VALUES (${messageId},${groupJid},${groupName},${isMe?'outgoing':'incoming'},${senderJid},${senderName},${senderIsAdmin},${content.slice(0,4000)},${mediaUrl.slice(0,2000)},${str(data.device ?? data.device_name)},${timestamp?.toISOString() ?? null}::timestamptz,${JSON.stringify(safePayload)}::jsonb)
        ON CONFLICT(provider_message_id) DO NOTHING RETURNING id`;
      return { duplicate: !row, id: row ? Number(row.id) : null };
    });
    return Response.json({ message: result.duplicate ? 'Event grup duplikat diabaikan.' : 'Pesan grup tersimpan.', ...result }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Pesan grup belum dapat disimpan. Pastikan migrasi 016 sudah diterapkan.' }, { status: 503 });
  }
}

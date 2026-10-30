import { createHash, timingSafeEqual } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { getIntegrationConfig } from '@/lib/integration-settings';
import { normalizeWhatsAppNumber } from '@/lib/starsender-client';
import { POST as receiveGroup } from './group/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type Obj = Record<string, unknown>;
function obj(value: unknown): Obj { return value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : {}; }
function str(value: unknown): string { return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''; }
function flag(value: unknown): boolean { return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'; }
function equalSecret(a: string, b: string) { const x=Buffer.from(a); const y=Buffer.from(b); return x.length===y.length && x.length>0 && timingSafeEqual(x,y); }
function providerTime(value: unknown): Date | null {
  if (typeof value === 'number' || (typeof value === 'string' && /^\d{10,13}$/.test(value))) {
    const n=Number(value); const date=new Date(n < 10_000_000_000 ? n*1000 : n); return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string' && value) { const date=new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
  return null;
}

export async function POST(request: Request) {
  const config = await getIntegrationConfig();
  const expected = config.starsender.webhookSecret;
  const provided = new URL(request.url).searchParams.get('token') || request.headers.get('x-webhook-token') || '';
  if (!expected) return Response.json({ message: 'Webhook StarSender belum dikonfigurasi.' }, { status: 503 });
  if (!equalSecret(expected, provided)) return Response.json({ message: 'Token webhook tidak valid.' }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 256_000) return Response.json({ message: 'Payload terlalu besar.' }, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(raw) as unknown; } catch { return Response.json({ message: 'JSON tidak valid.' }, { status: 400 }); }
  const root = obj(payload);
  const data = obj(root.data ?? root.payload ?? root);
  if (flag(data.is_group) || str(data.chat_type).toLowerCase() === 'group' || [data.from,data.group_jid,data.groupId,data.chat_id].some(value => str(value).endsWith('@g.us'))) {
    return receiveGroup(new Request(request.url, { method: 'POST', headers: request.headers, body: raw }));
  }
  const isMe = flag(data.is_me);
  const remoteCandidates = isMe
    ? [data.to, data.chat_id, data.remote_jid, data.from, data.participant]
    : [data.from, data.chat_id, data.remote_jid, data.participant];
  const remote = remoteCandidates.map(str).find(value => value && !value.includes('@g.us') && !value.includes('@broadcast')) || '';
  let phone: string;
  try { phone = normalizeWhatsAppNumber(remote.replace(/@s\.whatsapp\.net$/i, '').replace(/@c\.us$/i, '')); }
  catch { return Response.json({ message: 'Nomor kontak tidak valid atau tidak tersedia pada payload webhook.', direction: isMe ? 'outgoing' : 'incoming' }, { status: 200 }); }
  const textMessage = str(data.message ?? data.body ?? data.text);
  const mediaUrl = str(data.file ?? data.media_url ?? data.url);
  const message = textMessage || (mediaUrl ? '[Pelanggan mengirim media]' : '[Pesan WhatsApp]');
  const providerMessageId = str(data.message_id ?? data.id ?? data.key);
  const timestamp = providerTime(data.timestamp);
  const fallbackId = createHash('sha256').update(`${phone}|${isMe ? 'out' : 'in'}|${str(data.timestamp)}|${message}|${mediaUrl}`).digest('hex');
  const messageId = providerMessageId || fallbackId;
  const safePayload = { device_id: str(data.device_id), device_name: str(data.device_name), chat_type: str(data.chat_type), is_me: isMe, message_id: providerMessageId, timestamp: str(data.timestamp), quoted_message: str(data.quoted_message).slice(0, 1000) };
  const text = textMessage.trim().toUpperCase();
  const optsOut = !isMe && /^(STOP|BERHENTI|UNSUBSCRIBE|STOP PROMO|JANGAN KIRIM)(\s|$)/.test(text);
  const optsIn = !isMe && /^(MULAI|START|AKTIFKAN KEMBALI)(\s|$)/.test(text);
  const sql = getDatabaseClient();
  try {
    const result = await sql.begin(async tx => {
      const direction = isMe ? 'outgoing' : 'incoming';
      const [event] = await tx`INSERT INTO starsender_message_events(message_id,phone_e164,direction) VALUES (${messageId},${phone},${direction}) ON CONFLICT(message_id) DO NOTHING RETURNING message_id`;
      if (!event) return { duplicate: true, conversationId: '', botQueued: false, optedOut: false };
      const phoneDigits = [phone, phone.slice(2), `0${phone.slice(2)}`];
      const [lead] = await tx`
        SELECT id,name,assigned_promoter_code,consent_to_share,lead_type,whatsapp_marketing_consent
        FROM public_interest_leads
        WHERE regexp_replace(phone,'[^0-9]','','g')=ANY(${phoneDigits}::text[])
        ORDER BY created_at DESC,id DESC LIMIT 1`;
      const displayName = str(data.push_name ?? data.name) || String(lead?.name ?? phone);
      const [conversation] = await tx`
        INSERT INTO whatsapp_conversations(phone_e164,display_name,lead_id,assigned_promoter_code,status,last_message_text,last_message_at,unread_count)
        VALUES (${phone},${displayName.slice(0,160)},${lead?.id ?? null},${String(lead?.assigned_promoter_code ?? '')},'open',${message.slice(0,1000)},COALESCE(${timestamp?.toISOString() ?? null}::timestamptz,now()),${isMe ? 0 : 1})
        ON CONFLICT(phone_e164) DO UPDATE SET
          display_name=CASE WHEN EXCLUDED.display_name<>EXCLUDED.phone_e164 THEN EXCLUDED.display_name ELSE whatsapp_conversations.display_name END,
          lead_id=COALESCE(whatsapp_conversations.lead_id,EXCLUDED.lead_id),
          assigned_promoter_code=CASE WHEN whatsapp_conversations.assigned_promoter_code='' THEN EXCLUDED.assigned_promoter_code ELSE whatsapp_conversations.assigned_promoter_code END,
          last_message_text=EXCLUDED.last_message_text,last_message_at=GREATEST(whatsapp_conversations.last_message_at,EXCLUDED.last_message_at),
          status=CASE WHEN ${!isMe} THEN 'open' ELSE whatsapp_conversations.status END,
          unread_count=whatsapp_conversations.unread_count+EXCLUDED.unread_count,updated_at=now()
        RETURNING id,bot_mode`;
      const senderType = isMe ? 'agent' : 'customer';
      let stored;
      if (isMe) {
        [stored] = await tx`
          WITH candidate AS (
            SELECT id FROM whatsapp_messages
            WHERE conversation_id=${conversation.id}::uuid AND direction='outgoing' AND delivery_status='queued'
              AND content=${message.slice(0,4000)} AND created_at>now()-interval '15 minutes'
            ORDER BY created_at DESC,id DESC LIMIT 1 FOR UPDATE
          )
          UPDATE whatsapp_messages m SET provider_message_id=${messageId},delivery_status='sent',
            media_url=${mediaUrl.slice(0,2000)},media_type=${str(data.mimetype ?? data.mime_type).slice(0,120)},
            raw_payload=${JSON.stringify(safePayload)}::jsonb,provider_timestamp=${timestamp?.toISOString() ?? null}
          FROM candidate WHERE m.id=candidate.id RETURNING m.id`;
      }
      if (!stored) [stored] = await tx`
        INSERT INTO whatsapp_messages(conversation_id,provider_message_id,direction,sender_type,content,media_url,media_type,quoted_message,delivery_status,raw_payload,provider_timestamp)
        VALUES (${conversation.id}::uuid,${messageId},${direction},${senderType},${message.slice(0,4000)},${mediaUrl.slice(0,2000)},${str(data.mimetype ?? data.mime_type).slice(0,120)},${str(data.quoted_message).slice(0,1000)},${isMe ? 'sent' : 'received'},${JSON.stringify(safePayload)}::jsonb,${timestamp?.toISOString() ?? null})
        ON CONFLICT DO NOTHING RETURNING id`;
      if (!stored) return { duplicate: true, conversationId: String(conversation.id), botQueued: false, optedOut: false };
      if (!isMe) {
        await tx`INSERT INTO starsender_inbound_events(message_id,phone_e164) VALUES (${messageId},${phone}) ON CONFLICT(message_id) DO NOTHING`;
        await tx`INSERT INTO whatsapp_inbound_sessions(phone_e164,last_inbound_at,last_message_id,opted_out_at,updated_at)
          VALUES (${phone},COALESCE(${timestamp?.toISOString() ?? null}::timestamptz,now()),${messageId},CASE WHEN ${optsOut} THEN now() ELSE NULL END,now())
          ON CONFLICT(phone_e164) DO UPDATE SET last_inbound_at=GREATEST(whatsapp_inbound_sessions.last_inbound_at,EXCLUDED.last_inbound_at),last_message_id=EXCLUDED.last_message_id,
          opted_out_at=CASE WHEN ${optsOut} THEN now() WHEN ${optsIn} THEN NULL ELSE whatsapp_inbound_sessions.opted_out_at END,updated_at=now()`;
      }
      const [session] = await tx`SELECT opted_out_at FROM whatsapp_inbound_sessions WHERE phone_e164=${phone}`;
      if (!isMe && optsOut) {
        await tx`UPDATE notification_outbox SET status='failed',last_error='Kontak meminta berhenti menerima pesan WhatsApp.',updated_at=now()
          WHERE status IN ('pending','awaiting_inbound') AND regexp_replace(recipient_phone,'[^0-9]','','g')=ANY(${phoneDigits}::text[])`;
        await tx`UPDATE whatsapp_messages m SET delivery_status='failed' FROM notification_outbox o WHERE m.outbox_id=o.id AND o.status='failed' AND regexp_replace(o.recipient_phone,'[^0-9]','','g')=ANY(${phoneDigits}::text[])`;
        await tx`UPDATE whatsapp_bot_jobs SET status='skipped',last_error='Pelanggan mengirim perintah STOP.',updated_at=now() WHERE conversation_id=${conversation.id}::uuid AND status IN ('pending','processing','queued')`;
        if (lead?.id) await tx`UPDATE whatsapp_drip_enrollments SET status='cancelled',last_error='Pelanggan mengirim perintah STOP.' WHERE lead_id=${lead.id} AND status IN ('active','paused')`;
      } else if (!isMe && optsIn) {
        await tx`UPDATE notification_outbox SET status='pending',available_at=GREATEST(available_at,now()),last_error='',updated_at=now()
          WHERE status='awaiting_inbound' AND (expires_at IS NULL OR expires_at>now()) AND regexp_replace(recipient_phone,'[^0-9]','','g')=ANY(${phoneDigits}::text[])`;
      }
      let botQueued = false;
      if (!isMe && !optsOut && !session?.opted_out_at) {
        if (lead?.id) await tx`UPDATE whatsapp_drip_enrollments SET status='active',next_send_at=now(),last_error='' WHERE lead_id=${lead.id} AND status='paused' AND last_error LIKE 'Menunggu pelanggan%'`;
        await tx`UPDATE notification_outbox SET status='failed',last_error='Balasan bot lama digantikan oleh pesan pelanggan yang lebih baru.',updated_at=now()
          WHERE conversation_id=${conversation.id}::uuid AND event_type='whatsapp_bot_reply' AND status IN ('pending','awaiting_inbound')`;
        await tx`UPDATE whatsapp_messages SET delivery_status='failed' WHERE outbox_id IN (SELECT id FROM notification_outbox WHERE conversation_id=${conversation.id}::uuid AND event_type='whatsapp_bot_reply' AND status='failed') AND delivery_status='queued'`;
        await tx`UPDATE whatsapp_bot_jobs SET status='skipped',last_error='Pesan pelanggan terbaru menggantikan balasan bot yang belum terkirim.',updated_at=now() WHERE conversation_id=${conversation.id}::uuid AND status IN ('processing','queued')`;
        const [bot] = await tx`SELECT enabled FROM whatsapp_bot_settings WHERE id=1`;
        if (bot?.enabled && conversation.bot_mode === 'bot') {
          const [pendingBot] = await tx`SELECT id FROM whatsapp_bot_jobs WHERE conversation_id=${conversation.id}::uuid AND status='pending' AND created_at>now()-interval '15 seconds' ORDER BY id DESC LIMIT 1 FOR UPDATE`;
          if (pendingBot) await tx`UPDATE whatsapp_bot_jobs SET inbound_message_id=${stored.id},available_at=now()+interval '3 seconds',updated_at=now() WHERE id=${pendingBot.id}`;
          else await tx`INSERT INTO whatsapp_bot_jobs(conversation_id,inbound_message_id,status,available_at)
            VALUES (${conversation.id}::uuid,${stored.id},'pending',now()+interval '3 seconds') ON CONFLICT(inbound_message_id) DO NOTHING`;
          botQueued = true;
        }
        await tx`UPDATE notification_outbox SET status='pending',available_at=GREATEST(available_at,now()),last_error='',updated_at=now()
          WHERE status='awaiting_inbound' AND (expires_at IS NULL OR expires_at>now()) AND regexp_replace(recipient_phone,'[^0-9]','','g')=ANY(${phoneDigits}::text[])`;
      }
      return { duplicate: false, conversationId: String(conversation.id), botQueued, optedOut: Boolean(session?.opted_out_at) };
    });
    return Response.json({ message: result.duplicate ? 'Event pesan duplikat diabaikan.' : 'Pesan WhatsApp tersinkronisasi.', ...result, direction: isMe ? 'outgoing' : 'incoming' }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Pesan WhatsApp belum dapat diproses. Periksa migrasi 015 dan koneksi database.' }, { status: 503 });
  }
}

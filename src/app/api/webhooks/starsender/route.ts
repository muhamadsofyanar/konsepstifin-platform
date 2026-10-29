import { createHash, timingSafeEqual } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { getIntegrationConfig } from '@/lib/integration-settings';
import { normalizeWhatsAppNumber } from '@/lib/starsender-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Obj = Record<string, unknown>;
function obj(v: unknown): Obj { return v && typeof v === 'object' && !Array.isArray(v) ? v as Obj : {}; }
function str(v: unknown): string { return typeof v === 'string' || typeof v === 'number' ? String(v).trim() : ''; }
function flag(v: unknown): boolean { return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true'; }
function equalSecret(a: string, b: string) { const x=Buffer.from(a); const y=Buffer.from(b); return x.length===y.length && x.length>0 && timingSafeEqual(x,y); }

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
  if (flag(data.is_me) || flag(data.is_group) || str(data.chat_type).toLowerCase() === 'group' || str(data.from).includes('@g.us')) {
    return Response.json({ message: 'Pesan keluar/grup diabaikan.' }, { status: 200 });
  }
  let phone: string;
  try { phone = normalizeWhatsAppNumber(str(data.from).replace(/@s\.whatsapp\.net$/i, '')); }
  catch { return Response.json({ message: 'Nomor pengirim tidak valid.' }, { status: 400 }); }
  const message = str(data.message ?? data.body ?? data.text);
  const messageId = str(data.message_id ?? data.id) || createHash('sha256').update(`${phone}|${str(data.timestamp)}|${message}`).digest('hex');
  const text = message.trim().toUpperCase();
  const optsOut = /^(STOP|BERHENTI|UNSUBSCRIBE|STOP PROMO|JANGAN KIRIM)(\s|$)/.test(text);
  const optsIn = /^(MULAI|START|AKTIFKAN KEMBALI)(\s|$)/.test(text);
  const sql = getDatabaseClient();
  try {
    const [inserted] = await sql`INSERT INTO starsender_inbound_events(message_id,phone_e164) VALUES (${messageId},${phone}) ON CONFLICT(message_id) DO NOTHING RETURNING message_id`;
    if (!inserted) return Response.json({ message: 'Pesan duplikat diabaikan.' }, { status: 200 });
    await sql`INSERT INTO whatsapp_inbound_sessions(phone_e164,last_inbound_at,last_message_id,opted_out_at,updated_at)
      VALUES (${phone},now(),${messageId},CASE WHEN ${optsOut} THEN now() ELSE NULL END,now())
      ON CONFLICT(phone_e164) DO UPDATE SET last_inbound_at=now(),last_message_id=EXCLUDED.last_message_id,
      opted_out_at=CASE WHEN ${optsOut} THEN now() WHEN ${optsIn} THEN NULL ELSE whatsapp_inbound_sessions.opted_out_at END,updated_at=now()`;
    const [session] = await sql`SELECT opted_out_at FROM whatsapp_inbound_sessions WHERE phone_e164=${phone}`;
    // If an existing promoter lead predates the queue fix, create its onboarding
    // reply only after this person has actually initiated a WhatsApp conversation.
    // Limit this automatic response to an open lead with explicit contact consent.
    if (!optsOut && !session?.opted_out_at) {
      const [candidate] = await sql`SELECT id,name,service,phone FROM public_interest_leads
        WHERE lead_type='promoter_candidate' AND consent_to_contact=true AND status NOT IN ('selesai','ditutup')
          AND regexp_replace(phone,'[^0-9]','','g') IN (${phone},${phone.slice(2)},${`0${phone.slice(2)}`})
        ORDER BY created_at DESC,id DESC LIMIT 1`;
      if (candidate) {
        const candidateName = String(candidate.name || 'Bapak/Ibu').trim().slice(0, 100) || 'Bapak/Ibu';
        const candidateService = String(candidate.service || 'Paket Promotor').trim().slice(0, 120);
        const reference = `KSF-${candidate.id}`;
        const reply = `Assalamu'alaikum ${candidateName}. Terima kasih telah mengajukan ${candidateService} melalui KonsepSTIFIn. Referensi: ${reference}. Tim akan membantu menjelaskan tahapan, persyaratan, biaya, dan langkah berikutnya. Pengajuan ini belum berarti pendaftaran promotor telah disetujui.`;
        await sql`INSERT INTO notification_outbox(event_type,lead_id,recipient_phone,recipient_name,message,dedupe_key,created_by)
          VALUES ('promoter_candidate_instructions',${candidate.id},${phone},${candidateName},${reply},${`promoter-candidate-instructions:${candidate.id}:${phone}`},'starsender-inbound-webhook')
          ON CONFLICT (dedupe_key) DO NOTHING`;
      }
    }
    if (optsOut || session?.opted_out_at) {
      await sql`UPDATE notification_outbox SET status='failed',last_error='Pesan dihentikan karena kontak memilih berhenti menerima pesan WhatsApp.',updated_at=now()
        WHERE status IN ('pending','awaiting_inbound') AND regexp_replace(recipient_phone,'[^0-9]','','g') IN (${phone},${phone.slice(2)},${`0${phone.slice(2)}`})`;
    } else {
      await sql`UPDATE notification_outbox SET status='pending',available_at=now(),last_error='',updated_at=now()
        WHERE status='awaiting_inbound' AND (expires_at IS NULL OR expires_at>now()) AND regexp_replace(recipient_phone,'[^0-9]','','g') IN (${phone},${phone.slice(2)},${`0${phone.slice(2)}`})`;
    }
    return Response.json({ message: 'Pesan masuk tercatat.', duplicate: false, optedOut: Boolean(session?.opted_out_at) }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Pesan masuk belum dapat diproses.' }, { status: 503 });
  }
}

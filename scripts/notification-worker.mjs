/** Processes queued WhatsApp notifications without blocking payment webhooks. */
import postgres from 'postgres';
import { sendStarSenderText, starsenderStatus, normalizeWhatsAppNumber } from '../src/lib/starsender-client.ts';

let stopping = false;
let timer;
const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 2, connect_timeout: 10, idle_timeout: 20 }) : null;

async function tick() {
  if (stopping) return;
  if (sql && (await starsenderStatus()).configured) {
    try {
      const [schema] = await sql`SELECT to_regclass('public.whatsapp_inbound_sessions') AS session_table`;
      if (!schema?.session_table) throw new Error('Migration 013 belum diterapkan.');
      // Expire stale payment instructions before checking inbound sessions.
      await sql`UPDATE notification_outbox SET status='expired',last_error='Link pembayaran kedaluwarsa sebelum pesan dikirim.',updated_at=now() WHERE status IN ('pending','awaiting_inbound') AND expires_at IS NOT NULL AND expires_at<=now()`;
      // A worker crash after claiming a message is treated as an unknown outcome, not auto-resend.
      await sql`UPDATE notification_outbox SET status='unknown',last_error='Worker berhenti saat pesan sedang diproses; status kirim perlu diperiksa manual.',updated_at=now() WHERE status='sending' AND updated_at < now() - interval '5 minutes'`;
      const [job] = await sql.begin(async tx => {
        const [claimed] = await tx`
          UPDATE notification_outbox
          SET status='sending',attempts=attempts+1,updated_at=now()
          WHERE id=(SELECT id FROM notification_outbox WHERE status='pending' AND available_at<=now() AND (expires_at IS NULL OR expires_at>now()) ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
          RETURNING *`;
        return claimed ? [claimed] : [];
      });
      if (job) {
        try {
          let phone = '';
          let blocked = false;
          try { phone = normalizeWhatsAppNumber(String(job.recipient_phone)); }
          catch {
            await sql`UPDATE notification_outbox SET status='failed',last_error='Nomor WhatsApp tidak valid.',updated_at=now() WHERE id=${job.id}`;
            blocked = true;
          }
          if (!blocked) {
            const [session] = await sql`SELECT last_inbound_at,opted_out_at FROM whatsapp_inbound_sessions WHERE phone_e164=${phone}`;
            if (session?.opted_out_at) {
              await sql`UPDATE notification_outbox SET status='failed',last_error='Kontak memilih berhenti menerima pesan WhatsApp.',updated_at=now() WHERE id=${job.id}`;
              blocked = true;
            } else if (!session || new Date(String(session.last_inbound_at)).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
              await sql`UPDATE notification_outbox SET status='awaiting_inbound',last_error='Menunggu pelanggan memulai chat WhatsApp. Pesan hanya dikirim dalam 24 jam sejak pesan masuk terakhir.',updated_at=now() WHERE id=${job.id}`;
              blocked = true;
            }
          }
          if (!blocked && String(job.event_type) === 'marketing_campaign') {
            const [consent] = await sql`SELECT whatsapp_marketing_consent FROM public_interest_leads WHERE id=${job.lead_id}`;
            if (!consent?.whatsapp_marketing_consent) {
              await sql`UPDATE notification_outbox SET status='failed',last_error='Persetujuan promosi tidak aktif saat pengiriman.',updated_at=now() WHERE id=${job.id}`;
              blocked = true;
            }
          }
          if (!blocked) {
            const result = await sendStarSenderText(String(job.recipient_phone), String(job.message));
            if (result.success) {
              await sql`UPDATE notification_outbox SET status='sent',provider_response=${JSON.stringify(result.response)}::jsonb,last_error='',sent_at=now(),updated_at=now() WHERE id=${job.id}`;
            } else {
              const retryable = result.status === 429 || result.status >= 500;
              const retry = retryable && Number(job.attempts) < 4;
              await sql`
                UPDATE notification_outbox SET status=${retry ? 'pending' : 'failed'},
                  available_at=CASE WHEN ${retry} THEN now() + interval '1 minute' * ${Math.max(1, Number(job.attempts))} ELSE available_at END,
                  provider_response=${JSON.stringify(result.response)}::jsonb,last_error=${String(result.message).slice(0, 500)},updated_at=now()
                WHERE id=${job.id}`;
            }
          }
        } catch (error) {
          // Network timeout can happen after provider acceptance, so do not resend automatically.
          await sql`UPDATE notification_outbox SET status='unknown',last_error=${(error instanceof Error ? error.message : 'Kegagalan jaringan').slice(0, 500)},updated_at=now() WHERE id=${job.id}`;
        }
      }
    } catch {
      console.error('Notification queue paused. Check migration 011/013 and database connectivity.');
    }
  }
  if (!stopping) timer = setTimeout(tick, 3000);
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  stopping = true;
  clearTimeout(timer);
  try { if (sql) await sql.end({ timeout: 5 }); } finally { process.exit(0); }
});
if (!sql) console.info('Notification worker waiting for DATABASE_URL configuration.');
await tick();

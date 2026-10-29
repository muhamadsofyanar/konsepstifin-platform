/** Processes queued WhatsApp notifications without blocking payment webhooks. */
import postgres from 'postgres';
import { sendStarSenderText, starsenderStatus } from '../src/lib/starsender-client.ts';

let stopping = false;
let timer;
const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 2, connect_timeout: 10, idle_timeout: 20 }) : null;

async function tick() {
  if (stopping) return;
  if (sql && (await starsenderStatus()).configured) {
    try {
      // A worker crash after claiming a message is treated as an unknown outcome, not auto-resend.
      await sql`UPDATE notification_outbox SET status='unknown',last_error='Worker berhenti saat pesan sedang diproses; status kirim perlu diperiksa manual.',updated_at=now() WHERE status='sending' AND updated_at < now() - interval '5 minutes'`;
      const [job] = await sql.begin(async tx => {
        const [claimed] = await tx`
          UPDATE notification_outbox
          SET status='sending',attempts=attempts+1,updated_at=now()
          WHERE id=(SELECT id FROM notification_outbox WHERE status='pending' AND available_at<=now() ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
          RETURNING *`;
        return claimed ? [claimed] : [];
      });
      if (job) {
        try {
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
        } catch (error) {
          // Network timeout can happen after provider acceptance, so do not resend automatically.
          await sql`UPDATE notification_outbox SET status='unknown',last_error=${(error instanceof Error ? error.message : 'Kegagalan jaringan').slice(0, 500)},updated_at=now() WHERE id=${job.id}`;
        }
      }
    } catch {
      console.error('Notification queue unavailable. Check migration 011 and database connectivity.');
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

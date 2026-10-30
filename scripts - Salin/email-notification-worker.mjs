/** Transactional email outbox worker. Marketing consent and campaigns use separate rules. */
import postgres from 'postgres';
import { sendMailketingEmail, mailketingStatus } from '../src/lib/mailketing-client.ts';

let stopping = false;
let timer;
const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 2, connect_timeout: 10, idle_timeout: 20 }) : null;

async function tick() {
  if (stopping) return;
  try {
    if (sql && (await mailketingStatus()).configured) {
      const [schema] = await sql`SELECT to_regclass('public.email_notification_outbox') AS email_table`;
      if (!schema?.email_table) throw new Error('Migration 014 belum diterapkan.');
      await sql`UPDATE email_notification_outbox SET status='expired',last_error='Link pembayaran kedaluwarsa sebelum email dikirim.',updated_at=now() WHERE status='pending' AND expires_at IS NOT NULL AND expires_at<=now()`;
      await sql`UPDATE email_notification_outbox SET status='unknown',last_error='Worker berhenti saat email sedang diproses; status pengiriman perlu diperiksa.',updated_at=now() WHERE status='sending' AND updated_at<now()-interval '5 minutes'`;
      const [job] = await sql.begin(async tx => {
        const [claimed] = await tx`UPDATE email_notification_outbox SET status='sending',attempts=attempts+1,updated_at=now() WHERE id=(SELECT id FROM email_notification_outbox WHERE status='pending' AND available_at<=now() AND (expires_at IS NULL OR expires_at>now()) ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
        return claimed ? [claimed] : [];
      });
      if (job) {
        try {
          const result = await sendMailketingEmail({ recipient: String(job.recipient_email), subject: String(job.subject), content: String(job.content) });
          if (result.success) {
            await sql`UPDATE email_notification_outbox SET status='sent',provider_response=${JSON.stringify({messageId:result.messageId,response:result.response})}::jsonb,last_error='',sent_at=now(),updated_at=now() WHERE id=${job.id}`;
          } else {
            const retryable = result.status === 429 || result.status >= 500;
            const retry = retryable && Number(job.attempts) < 4 && (!job.expires_at || new Date(String(job.expires_at)).getTime() > Date.now());
            await sql`UPDATE email_notification_outbox SET status=${retry?'pending':'failed'},available_at=CASE WHEN ${retry} THEN now()+interval '1 minute'*${Math.max(1,Number(job.attempts))} ELSE available_at END,provider_response=${JSON.stringify(result.response)}::jsonb,last_error=${String(result.message).slice(0,500)},updated_at=now() WHERE id=${job.id}`;
          }
        } catch (error) {
          // A network timeout may occur after the provider accepted the email. Do not auto-send twice.
          await sql`UPDATE email_notification_outbox SET status='unknown',last_error=${(error instanceof Error?error.message:'Network error').slice(0,500)},updated_at=now() WHERE id=${job.id}`;
        }
      }
    }
  } catch { console.error('Email notification worker paused. Check Mailketing settings and migration 014.'); }
  if (!stopping) timer = setTimeout(tick, 4000);
}
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, async()=>{stopping=true;clearTimeout(timer);try{if(sql)await sql.end({timeout:5});}finally{process.exit(0);}});
if (!sql) console.info('Email notification worker waiting for DATABASE_URL configuration.');
await tick();

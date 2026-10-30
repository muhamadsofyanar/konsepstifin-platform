import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import postgres from 'postgres';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import type { Principal } from '@/lib/identity/access-policy';
vi.mock('@/lib/article-store', () => ({ getDatabaseClient: () => sql }));
vi.mock('@/lib/integration-settings', () => ({ getIntegrationConfig: async () => ({ starsender: { apiKey: 'test-key', apiUrl: 'https://example.test/api/send', webhookSecret: 'test-secret' } }) }));
import { createMarketingCampaign, listMarketingCampaigns } from './marketing-store';
import { listWhatsappGroupsDashboard, renameWhatsappGroup } from './whatsapp-groups';
import { POST as webhook } from '@/app/api/webhooks/starsender/route';
let db: PGlite, socket: PGLiteSocketServer, sql: ReturnType<typeof postgres>, provider: Server, worker: ChildProcess;
const actor = '10000000-0000-4000-8000-000000000001';
const principal: Principal = { userId: actor, roles: ['admin'], active: true, sessionValid: true, promoterCode: null };
const sent: string[] = [];
beforeAll(async () => {
  db = new PGlite();
  // Small fixture for surrounding modules; run the actual release migrations below.
  await db.exec(`CREATE TABLE platform_users(id uuid PRIMARY KEY);
    INSERT INTO platform_users VALUES('${actor}');
    CREATE TABLE platform_admin_audit(actor_id uuid,action text,target text,details jsonb);
    CREATE TABLE commerce_orders(id bigint PRIMARY KEY,moota_invoice_id text,moota_payment_url text,moota_payment_amount bigint,moota_expires_at timestamptz,state text,updated_at timestamptz DEFAULT now());
    CREATE TABLE public_interest_leads(id bigint PRIMARY KEY,name text,phone text,whatsapp_marketing_consent boolean DEFAULT false,created_at timestamptz DEFAULT now());
    INSERT INTO public_interest_leads(id,name,phone,whatsapp_marketing_consent) VALUES (1,'Ayu','081234567890',true),(2,'Budi','081234567891',false);`);
  for (const name of ['011-integrations.sql','013-whatsapp-inbound-first.sql','014-checkout-moota-mailketing.sql','015-whatsapp-command-center.sql','016-whatsapp-groups-broadcast.sql','017-whatsapp-personal-schedule.sql']) {
    await db.exec(readFileSync(`scripts/migrations/${name}`, 'utf8'));
  }
  // Migration must be safe on a repeated deployment.
  await db.exec(readFileSync('scripts/migrations/017-whatsapp-personal-schedule.sql', 'utf8'));
  socket = new PGLiteSocketServer({ db, port: 0, host: '127.0.0.1', maxConnections: 20 });
  await socket.start();
  sql = postgres(`postgresql://postgres:postgres@${socket.getServerConn()}/postgres`, { max: 1, prepare: false });
}, 20000);
afterAll(async () => {
  if (worker && worker.exitCode === null) { worker.kill(); await new Promise(resolve => worker.once('exit', resolve)); }
  if (provider) await new Promise<void>(resolve => provider.close(() => resolve()));
  if (sql) await sql.end();
  if (socket) await socket.stop();
  if (db) await db.close();
});
it('persists future personal schedule, mode and personalization and excludes unconsented contacts', async () => {
  const scheduledAt = '2099-01-01T09:30:00+07:00';
  const result = await createMarketingCampaign({ title: 'Personal', message: 'Halo {{nama}}', leadIds: [1,2], actor, scheduledAt, sendMode: 'consented_outbound' });
  expect(result.queued).toBe(1);
  const [job] = await sql`SELECT message,available_at,send_mode FROM notification_outbox WHERE campaign_id=${result.campaignId}`;
  expect(job.message).toBe('Halo Ayu');
  expect(new Date(job.available_at).toISOString()).toBe('2099-01-01T02:30:00.000Z');
  expect(job.send_mode).toBe('consented_outbound');
  expect((await listMarketingCampaigns())[0].send_mode).toBe('consented_outbound');
  await expect(createMarketingCampaign({ title: 'X', message: 'X', leadIds: [1], actor, scheduledAt: 'invalid' })).rejects.toThrow('Jadwal');
  await expect(createMarketingCampaign({ title: 'X', message: 'X', leadIds: [1], actor, scheduledAt: '2020-01-01' })).rejects.toThrow('Jadwal');
  await expect(createMarketingCampaign({ title: 'X', message: 'X', leadIds: [1], actor, sendMode: 'bypass' })).rejects.toThrow('Mode');
});
it('accepts premium group events on the main URL, deduplicates, preserves group names and separates sender identity', async () => {
  const post = (data: object, token = 'test-secret') => webhook(new Request(`https://example.test/api/webhooks/starsender?token=${token}`, { method: 'POST', body: JSON.stringify(data) }));
  const data = { from: '120363@g.us', push_name: 'TARGET STIFIN MULIA', message: 'Halo grup', message_id: 'group-1', chat_type: 'group', is_me: 'true' };
  expect((await post(data,'wrong')).status).toBe(403);
  expect((await post(data)).status).toBe(200);
  expect((await (await post(data)).json()).duplicate).toBe(true);
  await post({ from: data.from, message: 'Tanpa nama', message_id: 'group-2' });
  const rows = await sql`SELECT * FROM whatsapp_group_messages ORDER BY id`;
  expect(rows).toHaveLength(2);
  expect(rows[0].direction).toBe('outgoing');
  expect(rows[0].sender_name).toBe('');
  expect((await sql`SELECT group_name FROM whatsapp_groups`)[0].group_name).toBe(data.push_name);
  await renameWhatsappGroup(principal, data.from, 'Nama pilihan');
  expect((await listWhatsappGroupsDashboard(data.from)).groupMessages.every(row => row.group_name === 'Nama pilihan')).toBe(true);
  expect((await listWhatsappGroupsDashboard('999@g.us')).groupMessages).toHaveLength(0);
});
it('runs the actual delivery worker: outbound without prior chat, inbound waiting, STOP, revoked consent and future schedule', async () => {
  provider = createServer((request, response) => {
    let raw = ''; request.on('data', chunk => raw += chunk); request.on('end', () => {
      sent.push(JSON.parse(raw).body); response.setHeader('Content-Type','application/json'); response.end(JSON.stringify({ success: true, data: { message_id: 'sent-1' } }));
    });
  });
  await new Promise<void>(resolve => provider.listen(0, '127.0.0.1', resolve));
  const address = provider.address() as { port: number };
  await sql`INSERT INTO whatsapp_inbound_sessions(phone_e164,last_inbound_at,opted_out_at) VALUES ('6281234567892',now(),now())`;
  for (const [key, mode, lead, phone] of [
    ['outbound','consented_outbound',1,'081234567890'],
    ['inbound','inbound_first',1,'081234567890'],
    ['stop','consented_outbound',1,'081234567892'],
    ['revoked','consented_outbound',2,'081234567891'],
  ]) await sql`INSERT INTO notification_outbox(event_type,lead_id,recipient_phone,message,dedupe_key,send_mode) VALUES ('marketing_campaign',${lead},${phone},${key},${key},${mode})`;
  worker = spawn(process.execPath, ['scripts/notification-worker.mjs'], { env: { ...process.env, DATABASE_URL: `postgresql://postgres:postgres@${socket.getServerConn()}/postgres`, STARSENDER_API_KEY: 'test-key', STARSENDER_API_URL: `http://127.0.0.1:${address.port}/api/send` }, stdio: ['ignore','pipe','pipe'] });
  worker.stdout?.on('data', chunk => process.stdout.write(chunk));
  worker.stderr?.on('data', chunk => process.stderr.write(chunk));
  const deadline = Date.now() + 18000;
  let rows;
  do {
    rows = await sql`SELECT dedupe_key,status FROM notification_outbox WHERE dedupe_key IN ('outbound','inbound','stop','revoked')`;
    if (rows.every(row => !['pending','sending'].includes(row.status))) break;
    await new Promise(resolve => setTimeout(resolve, 150));
  } while (Date.now() < deadline);
  expect(Object.fromEntries(rows!.map(row => [row.dedupe_key,row.status]))).toEqual({ outbound: 'sent', inbound: 'awaiting_inbound', stop: 'failed', revoked: 'failed' });
  expect(sent).toEqual(['outbound']);
  expect((await sql`SELECT status FROM notification_outbox WHERE message='Halo Ayu'`)[0].status).toBe('pending');
}, 20000);

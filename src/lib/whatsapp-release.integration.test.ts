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
import { listWhatsappGroupsDashboard, renameWhatsappGroup, bulkWhatsappGroupPermission, createWhatsappGroupBroadcast } from './whatsapp-groups';
import { saveWhatsappTemplate, listWhatsappTemplates, queueWhatsappReply } from './whatsapp-store';
import { POST as uploadAttachment } from '@/app/api/admin/whatsapp/attachments/route';
import { GET as getAttachment } from '@/app/api/whatsapp/attachments/[id]/route';
vi.mock('@/lib/identity/server',()=>({getAccountPrincipal:async()=>uploadAuthorized ? principal : null}));
let uploadAuthorized = true;
import { POST as webhook } from '@/app/api/webhooks/starsender/route';
let db: PGlite, socket: PGLiteSocketServer, sql: ReturnType<typeof postgres>, provider: Server, worker: ChildProcess;
const actor = '10000000-0000-4000-8000-000000000001';
const principal: Principal = { userId: actor, roles: ['admin'], active: true, sessionValid: true, promoterCode: null };
const sent: string[] = [];
const mediaRequests: Record<string,unknown>[] = [];
beforeAll(async () => {
  process.env.PLATFORM_ORIGIN = 'https://example.test';
  db = new PGlite();
  // Small fixture for surrounding modules; run the actual release migrations below.
  await db.exec(`CREATE TABLE platform_users(id uuid PRIMARY KEY);
    INSERT INTO platform_users VALUES('${actor}');
    CREATE TABLE platform_admin_audit(actor_id uuid,action text,target text,details jsonb);
    CREATE TABLE commerce_orders(id bigint PRIMARY KEY,moota_invoice_id text,moota_payment_url text,moota_payment_amount bigint,moota_expires_at timestamptz,state text,updated_at timestamptz DEFAULT now());
    CREATE TABLE public_interest_leads(id bigint PRIMARY KEY,name text,phone text,city text DEFAULT '',lead_type text DEFAULT 'test_service',assigned_promoter_code text DEFAULT '',consent_to_share boolean DEFAULT true,whatsapp_marketing_consent boolean DEFAULT false,created_at timestamptz DEFAULT now());
    INSERT INTO public_interest_leads(id,name,phone,whatsapp_marketing_consent) VALUES (1,'Ayu','081234567890',true),(2,'Budi','081234567891',false);`);
  for (const name of ['011-integrations.sql','013-whatsapp-inbound-first.sql','014-checkout-moota-mailketing.sql','015-whatsapp-command-center.sql','016-whatsapp-groups-broadcast.sql','017-whatsapp-personal-schedule.sql','018-whatsapp-content-media.sql']) {
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
  delete process.env.PLATFORM_ORIGIN;
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
      sent.push(JSON.parse(raw).body);if(JSON.parse(raw).file)mediaRequests.push(JSON.parse(raw)); response.setHeader('Content-Type','application/json'); response.end(JSON.stringify({ success: true, data: { message_id: 'sent-1' } }));
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
  await sql`INSERT INTO notification_outbox(event_type,lead_id,recipient_phone,message,dedupe_key,send_mode,media_url) VALUES ('marketing_campaign',1,'081234567890','media','media','consented_outbound','https://example.test/brosur.pdf')`;
  worker = spawn(process.execPath, ['scripts/notification-worker.mjs'], { env: { ...process.env, DATABASE_URL: `postgresql://postgres:postgres@${socket.getServerConn()}/postgres`, STARSENDER_API_KEY: 'test-key', STARSENDER_API_URL: `http://127.0.0.1:${address.port}/api/send` }, stdio: ['ignore','pipe','pipe'] });
  worker.stdout?.on('data', chunk => process.stdout.write(chunk));
  worker.stderr?.on('data', chunk => process.stderr.write(chunk));
  const deadline = Date.now() + 18000;
  let rows;
  do {
    rows = await sql`SELECT dedupe_key,status FROM notification_outbox WHERE dedupe_key IN ('outbound','inbound','stop','revoked','media')`;
    if (rows.every(row => !['pending','sending'].includes(row.status))) break;
    await new Promise(resolve => setTimeout(resolve, 150));
  } while (Date.now() < deadline);
  expect(Object.fromEntries(rows!.map(row => [row.dedupe_key,row.status]))).toEqual({ outbound: 'sent', inbound: 'awaiting_inbound', stop: 'failed', revoked: 'failed', media: 'sent' });
  expect(sent).toEqual(['outbound','media']);
  expect(mediaRequests[0]).toMatchObject({messageType:'media',file:'https://example.test/brosur.pdf'});
  expect((await sql`SELECT status FROM notification_outbox WHERE message='Halo Ayu'`)[0].status).toBe('pending');
}, 20000);

it('stores reusable media content, deduplicates normalized recipients and preserves attachment schedules',async()=>{
  await sql`INSERT INTO public_interest_leads(id,name,phone,whatsapp_marketing_consent) VALUES (3,'Ayu duplikat','6281234567890',true)`;
  const mediaUrl='https://example.test/brosur.pdf';
  await saveWhatsappTemplate(principal,{title:'Brosur uji',category:'attract',body:'Halo {{nama}}',mediaUrl});
  expect((await listWhatsappTemplates(principal)).find(t=>t.title==='Brosur uji')?.media_url).toBe(mediaUrl);
  const result=await createMarketingCampaign({title:'Lampiran',message:'',mediaUrl,leadIds:[1,3],actor,sendMode:'consented_outbound',scheduledAt:'2099-01-01T09:30:00+07:00'});
  expect(result.queued).toBe(1);
  expect((await sql`SELECT media_url FROM notification_outbox WHERE campaign_id=${result.campaignId}`)[0].media_url).toBe(mediaUrl);
  await expect(createMarketingCampaign({title:'X',message:'',mediaUrl:'http://localhost/x',leadIds:[1],actor})).rejects.toThrow('HTTPS');
});
it('updates only explicitly selected group permissions and persists a media-only group broadcast',async()=>{
  const id='120363@g.us';
  expect((await bulkWhatsappGroupPermission(principal,[id],true)).updated).toBe(1);
  const broadcast=await createWhatsappGroupBroadcast(principal,{name:'Brosur grup',message:'',mediaUrl:'https://example.test/brosur.pdf',groupJids:[id],scheduledAt:'2099-01-01T09:30:00+07:00',confirmGroupPermission:true});
  expect((await sql`SELECT media_url FROM whatsapp_group_broadcasts WHERE id=${broadcast.id}`)[0].media_url).toBe('https://example.test/brosur.pdf');
  await bulkWhatsappGroupPermission(principal,[id],false);
  await expect(createWhatsappGroupBroadcast(principal,{name:'X',message:'X',groupJids:[id],scheduledAt:'2099-01-01T09:30:00+07:00',confirmGroupPermission:true})).rejects.toThrow('belum diizinkan');
  await expect(bulkWhatsappGroupPermission({...principal,roles:['promoter']},[id],true)).rejects.toThrow('admin');
});
it('uploads a validated PDF and serves identical bytes at its opaque link without an admin cookie',async()=>{
  const form=new FormData();form.append('file',new File(['%PDF-1.7\nsynthetic test'], 'brosur.pdf',{type:'application/pdf'}));
  const request=()=>new Request('https://example.test/api/admin/whatsapp/attachments',{method:'POST',headers:{origin:'https://example.test'},body:form});
  uploadAuthorized=false;
  expect((await uploadAttachment(request())).status).toBe(401);
  uploadAuthorized=true;
  const response=await uploadAttachment(request());
  expect(response.status).toBe(201);
  const data=await response.json(); const id=data.url.split('/').pop();
  const file=await getAttachment(new Request(data.url),{params:Promise.resolve({id})});
  expect(file.headers.get('content-type')).toBe('application/pdf');
  expect(await file.text()).toBe('%PDF-1.7\nsynthetic test');
  expect((await getAttachment(new Request(data.url),{params:Promise.resolve({id:'not-an-id'})})).status).toBe(404);
  const invalid=new FormData();invalid.append('file',new File(['<html>oops</html>'],'fake.pdf'));
  expect((await uploadAttachment(new Request('https://example.test/api/admin/whatsapp/attachments',{method:'POST',headers:{origin:'https://example.test'},body:invalid}))).status).toBe(400);
});
it('reapplies migration 018 without duplicating starter templates',async()=>{
  const [before]=await sql`SELECT count(*)::int AS n FROM whatsapp_templates`;
  await db.exec(readFileSync('scripts/migrations/018-whatsapp-content-media.sql','utf8'));
  const [after]=await sql`SELECT count(*)::int AS n FROM whatsapp_templates`;
  expect(after.n).toBe(before.n);
});

it('queues media-only inbox replies while preserving the inbound window and scope checks',async()=>{
  const id='20000000-0000-4000-8000-000000000001';
  await sql`INSERT INTO whatsapp_conversations(id,phone_e164,display_name,lead_id) VALUES (${id},'6281234567890','Ayu',1)`;
  await sql`DELETE FROM whatsapp_inbound_sessions WHERE phone_e164='6281234567890'`;
  await expect(queueWhatsappReply(principal,id,'','https://example.test/file.pdf')).rejects.toThrow('24 jam');
  await sql`INSERT INTO whatsapp_inbound_sessions(phone_e164,last_inbound_at) VALUES ('6281234567890',now())`;
  const result=await queueWhatsappReply(principal,id,'','https://example.test/file.pdf');
  expect((await sql`SELECT media_url FROM whatsapp_messages WHERE outbox_id=${result.outboxId}`)[0].media_url).toBe('https://example.test/file.pdf');
  const event=await webhook(new Request('https://example.test/api/webhooks/starsender?token=test-secret',{method:'POST',body:JSON.stringify({from:'6281234567890',is_me:true,message:'',file:'https://example.test/file.pdf',message_id:'media-reply-1'})}));
  expect(event.status).toBe(200);
  expect((await sql`SELECT count(*)::int AS n FROM whatsapp_messages WHERE conversation_id=${id}`)[0].n).toBe(1);
  await expect(queueWhatsappReply({...principal,roles:[],active:false},id,'X')).rejects.toThrow();
});

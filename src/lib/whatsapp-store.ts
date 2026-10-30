import { randomUUID } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { accessScope, type Principal } from '@/lib/identity/access-policy';
import { normalizeWhatsAppNumber } from '@/lib/starsender-client';
import { getIntegrationConfig } from '@/lib/integration-settings';

export type WhatsappActorScope = ReturnType<typeof accessScope>;

function assertScope(principal: Principal | null) {
  const scope = accessScope(principal);
  if (scope.kind === 'none') throw new Error('Akses WhatsApp tidak tersedia untuk akun ini.');
  return scope;
}

export async function listWhatsappConversations(principal: Principal, search = '', status = 'all') {
  const scope = assertScope(principal);
  const sql = getDatabaseClient();
  const q = search.trim().slice(0, 120);
  const safeStatus = ['all', 'open', 'waiting', 'closed'].includes(status) ? status : 'all';
  const promoterCode = scope.kind === 'assigned' ? scope.promoterCode : '';
  return await sql`
    SELECT c.id,c.phone_e164,c.display_name,c.status,c.bot_mode,c.last_message_text,c.last_message_at,c.unread_count,
      COALESCE(NULLIF(l.assigned_promoter_code,''),c.assigned_promoter_code) AS assigned_promoter_code,c.lead_id,l.name AS lead_name,l.city AS lead_city,l.service AS lead_service,
      l.status AS lead_status,l.consent_to_share
    FROM whatsapp_conversations c
    LEFT JOIN public_interest_leads l ON l.id=c.lead_id
    WHERE (${scope.kind}='all' OR (l.assigned_promoter_code=${promoterCode} AND l.consent_to_share=TRUE))
      AND (${safeStatus}='all' OR c.status=${safeStatus})
      AND (${q}='' OR c.phone_e164 ILIKE ${`%${q}%`} OR c.display_name ILIKE ${`%${q}%`} OR l.name ILIKE ${`%${q}%`} OR l.city ILIKE ${`%${q}%`})
    ORDER BY c.last_message_at DESC,c.id DESC LIMIT 150`;
}

export async function getWhatsappConversation(principal: Principal, conversationId: string) {
  const scope = assertScope(principal);
  const sql = getDatabaseClient();
  const promoterCode = scope.kind === 'assigned' ? scope.promoterCode : '';
  const [conversation] = await sql`
    SELECT c.id,c.phone_e164,c.display_name,c.status,c.bot_mode,c.last_message_text,c.last_message_at,c.unread_count,
      COALESCE(NULLIF(l.assigned_promoter_code,''),c.assigned_promoter_code) AS assigned_promoter_code,c.lead_id,l.name AS lead_name,l.city AS lead_city,l.service AS lead_service,
      l.status AS lead_status,l.consent_to_share,l.whatsapp_marketing_consent,l.email AS lead_email
    FROM whatsapp_conversations c
    LEFT JOIN public_interest_leads l ON l.id=c.lead_id
    WHERE c.id=${conversationId}::uuid
      AND (${scope.kind}='all' OR (l.assigned_promoter_code=${promoterCode} AND l.consent_to_share=TRUE))`;
  if (!conversation) return null;
  const messages = await sql`
    SELECT id,provider_message_id,direction,sender_type,content,media_url,media_type,quoted_message,delivery_status,provider_timestamp,created_at
    FROM whatsapp_messages WHERE conversation_id=${conversationId}::uuid
    ORDER BY created_at DESC,id DESC LIMIT 100`;
  await sql`UPDATE whatsapp_conversations SET unread_count=0,updated_at=now() WHERE id=${conversationId}::uuid`;
  return { conversation: { ...conversation, unread_count: 0 }, messages: messages.reverse() };
}

export async function queueWhatsappReply(principal: Principal, conversationId: string, rawMessage: string) {
  const scope = assertScope(principal);
  const message = rawMessage.trim();
  if (!message || message.length > 4000) throw new Error('Pesan wajib diisi dan maksimal 4.000 karakter.');
  const sql = getDatabaseClient();
  const promoterCode = scope.kind === 'assigned' ? scope.promoterCode : '';
  return await sql.begin(async tx => {
    const [conversation] = await tx`
      SELECT c.id,c.phone_e164,c.lead_id,l.assigned_promoter_code,l.consent_to_share,s.last_inbound_at,s.opted_out_at
      FROM whatsapp_conversations c
      LEFT JOIN public_interest_leads l ON l.id=c.lead_id
      LEFT JOIN whatsapp_inbound_sessions s ON s.phone_e164=c.phone_e164
      WHERE c.id=${conversationId}::uuid
        AND (${scope.kind}='all' OR (l.assigned_promoter_code=${promoterCode} AND l.consent_to_share=TRUE))
      FOR UPDATE OF c`;
    if (!conversation) throw new Error('Percakapan tidak ditemukan atau Anda tidak memiliki akses.');
    if (conversation.opted_out_at) throw new Error('Pelanggan meminta penghentian pesan. Tunggu pelanggan mengirim MULAI sebelum mengirim pesan baru.');
    if (!conversation.last_inbound_at || new Date(String(conversation.last_inbound_at)).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      throw new Error('Jendela percakapan 24 jam telah berakhir. Minta pelanggan mengirim pesan kembali sebelum membalas melalui WhatsApp.');
    }
    const dedupe = `whatsapp-agent:${conversationId}:${randomUUID()}`;
    const [job] = await tx`
      INSERT INTO notification_outbox(event_type,lead_id,conversation_id,recipient_phone,recipient_name,message,dedupe_key,created_by,sender_type,sender_user_id)
      VALUES ('whatsapp_agent_reply',${conversation.lead_id},${conversationId}::uuid,${conversation.phone_e164},'',${message},${dedupe},${principal.userId},'agent',${principal.userId}::uuid)
      RETURNING id,status`;
    await tx`INSERT INTO whatsapp_messages(conversation_id,outbox_id,direction,sender_type,sender_user_id,content,delivery_status)
      VALUES (${conversationId}::uuid,${job.id},'outgoing','agent',${principal.userId}::uuid,${message},'queued') ON CONFLICT DO NOTHING`;
    await tx`UPDATE whatsapp_conversations SET bot_mode='human',status='open',unread_count=0,last_message_text=${message.slice(0,1000)},last_message_at=now(),updated_at=now() WHERE id=${conversationId}::uuid`;
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES (${principal.userId}::uuid,'whatsapp.message.queued',${conversationId},${JSON.stringify({outboxId:Number(job.id)})}::jsonb)`;
    return { queued: true, outboxId: Number(job.id), message: 'Balasan masuk antrean pengiriman StarSender.' };
  });
}

export async function setWhatsappConversationMode(principal: Principal, conversationId: string, mode: 'bot' | 'human' | 'closed') {
  const scope = assertScope(principal);
  const sql = getDatabaseClient();
  const promoterCode = scope.kind === 'assigned' ? scope.promoterCode : '';
  const [row] = await sql`
    UPDATE whatsapp_conversations c SET
      bot_mode=CASE WHEN ${mode}='closed' THEN c.bot_mode ELSE ${mode} END,
      status=CASE WHEN ${mode}='closed' THEN 'closed' ELSE 'open' END,
      updated_at=now()
    WHERE c.id=${conversationId}::uuid
      AND (${scope.kind}='all' OR EXISTS(SELECT 1 FROM public_interest_leads l WHERE l.id=c.lead_id AND l.assigned_promoter_code=${promoterCode} AND l.consent_to_share=TRUE))
    RETURNING c.id,c.bot_mode,c.status`;
  if (!row) throw new Error('Percakapan tidak ditemukan atau Anda tidak memiliki akses.');
  if (mode !== 'bot') {
    await sql`UPDATE notification_outbox SET status='failed',last_error='Balasan bot dibatalkan karena percakapan diambil alih petugas.',updated_at=now()
      WHERE conversation_id=${conversationId}::uuid AND event_type='whatsapp_bot_reply' AND status IN ('pending','awaiting_inbound')`;
    await sql`UPDATE whatsapp_messages SET delivery_status='failed' WHERE outbox_id IN (SELECT id FROM notification_outbox WHERE conversation_id=${conversationId}::uuid AND event_type='whatsapp_bot_reply' AND status='failed') AND delivery_status='queued'`;
    await sql`UPDATE whatsapp_bot_jobs SET status='skipped',last_error='Percakapan diambil alih petugas.',updated_at=now() WHERE conversation_id=${conversationId}::uuid AND status IN ('pending','processing','queued')`;
  }
  await sql`INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES (${principal.userId}::uuid,'whatsapp.conversation.mode.updated',${conversationId},${JSON.stringify({mode})}::jsonb)`;
  return row;
}

export async function getWhatsappBotSettings() {
  const sql = getDatabaseClient();
  const [row] = await sql`SELECT enabled,ai_processing_acknowledged,system_instructions,updated_at FROM whatsapp_bot_settings WHERE id=1`;
  return row || { enabled: false, ai_processing_acknowledged: false, system_instructions: '', updated_at: null };
}

export async function saveWhatsappBotSettings(principal: Principal, input: { enabled: boolean; systemInstructions?: string; aiProcessingAcknowledged?: boolean }) {
  if (!principal.roles.includes('admin') && !principal.roles.includes('super_admin')) throw new Error('Hanya admin yang dapat mengubah chatbot.');
  if (typeof input.enabled !== 'boolean') throw new Error('Status chatbot tidak valid.');
  const instructions = String(input.systemInstructions ?? '').trim().slice(0, 6000);
  const integration = await getIntegrationConfig();
  const aiProcessingAcknowledged = input.aiProcessingAcknowledged === true;
  if (input.enabled && integration.openai.apiKey && !aiProcessingAcknowledged) throw new Error('Konfirmasi pemrosesan percakapan oleh OpenAI API wajib diberikan sebelum chatbot AI diaktifkan.');
  const sql = getDatabaseClient();
  const [row] = await sql`
    INSERT INTO whatsapp_bot_settings(id,enabled,ai_processing_acknowledged,system_instructions,updated_by,updated_at)
    VALUES (1,${input.enabled},${aiProcessingAcknowledged},${instructions},${principal.userId}::uuid,now())
    ON CONFLICT(id) DO UPDATE SET enabled=EXCLUDED.enabled,ai_processing_acknowledged=EXCLUDED.ai_processing_acknowledged,system_instructions=EXCLUDED.system_instructions,updated_by=EXCLUDED.updated_by,updated_at=now()
    RETURNING enabled,ai_processing_acknowledged,system_instructions,updated_at`;
  if (!input.enabled) {
    await sql`UPDATE notification_outbox SET status='failed',last_error='Chatbot dinonaktifkan oleh admin.',updated_at=now() WHERE event_type='whatsapp_bot_reply' AND status IN ('pending','awaiting_inbound')`;
    await sql`UPDATE whatsapp_messages SET delivery_status='failed' WHERE outbox_id IN (SELECT id FROM notification_outbox WHERE event_type='whatsapp_bot_reply' AND status='failed') AND delivery_status='queued'`;
    await sql`UPDATE whatsapp_bot_jobs SET status='skipped',last_error='Chatbot dinonaktifkan oleh admin.',updated_at=now() WHERE status IN ('pending','processing','queued')`;
  }
  await sql`INSERT INTO platform_admin_audit(actor_id,action,target,details)
    VALUES (${principal.userId}::uuid,'whatsapp.bot.settings.updated','whatsapp-bot',${JSON.stringify({ enabled: input.enabled })}::jsonb)`;
  return row;
}

export async function createWhatsappDripCampaign(principal: Principal, input: { name: string; description?: string; leadIds: number[]; steps: Array<{ delayMinutes: number; message: string }> }) {
  if (!principal.roles.includes('admin') && !principal.roles.includes('super_admin')) throw new Error('Hanya admin yang dapat membuat campaign.');
  const name = input.name.trim().slice(0, 120);
  const description = String(input.description ?? '').trim().slice(0, 500);
  const leadIds = [...new Set(input.leadIds)].filter(id => Number.isSafeInteger(id) && id > 0);
  const integration = await getIntegrationConfig();
  if (!integration.starsender.apiKey || !integration.starsender.webhookSecret) throw new Error('Konfigurasikan Device API key dan Webhook Premium StarSender sebelum membuat drip campaign.');
  if (!name) throw new Error('Nama campaign wajib diisi.');
  if (!leadIds.length || leadIds.length > 100) throw new Error('Pilih 1 sampai 100 kontak.');
  if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > 30) throw new Error('Campaign harus memiliki 1 sampai 30 tahapan pesan.');
  const steps = input.steps.map((step, index) => {
    const delayMinutes = Number(step.delayMinutes);
    const message = String(step.message ?? '').trim();
    if (!Number.isInteger(delayMinutes) || delayMinutes < 0 || delayMinutes > 525600) throw new Error(`Jeda tahap ${index + 1} tidak valid.`);
    if (!message || message.length > 2000) throw new Error(`Pesan tahap ${index + 1} wajib diisi dan maksimal 2.000 karakter.`);
    return { delayMinutes, message };
  });
  const sql = getDatabaseClient();
  const campaignId = randomUUID();
  const result = await sql.begin(async tx => {
    const contacts = await tx`SELECT id,name,phone FROM public_interest_leads WHERE id=ANY(${leadIds}::bigint[]) AND whatsapp_marketing_consent=TRUE ORDER BY id FOR UPDATE`;
    if (!contacts.length) throw new Error('Tidak ada kontak dengan persetujuan promosi aktif.');
    const [campaign] = await tx`INSERT INTO whatsapp_drip_campaigns(id,name,description,active,created_by) VALUES (${campaignId}::uuid,${name},${description},TRUE,${principal.userId}::uuid) RETURNING id`;
    for (const [index, step] of steps.entries()) {
      await tx`INSERT INTO whatsapp_drip_steps(campaign_id,step_order,delay_minutes,message) VALUES (${campaignId}::uuid,${index + 1},${step.delayMinutes},${step.message})`;
    }
    const firstDelay = steps[0]?.delayMinutes ?? 0;
    let enrolled = 0;
    for (const contact of contacts) {
      try { normalizeWhatsAppNumber(String(contact.phone)); } catch { continue; }
      const [conversation] = await tx`SELECT id FROM whatsapp_conversations WHERE phone_e164=${normalizeWhatsAppNumber(String(contact.phone))}`;
      await tx`INSERT INTO whatsapp_drip_enrollments(campaign_id,lead_id,status,current_step,next_send_at)
        VALUES (${campaignId}::uuid,${contact.id},'active',0,now()+interval '1 minute'*${firstDelay}) ON CONFLICT(campaign_id,lead_id) DO NOTHING`;
      if (conversation) await tx`UPDATE whatsapp_conversations SET lead_id=${contact.id},updated_at=now() WHERE id=${conversation.id}::uuid`;
      enrolled++;
    }
    if (!enrolled) throw new Error('Tidak ada nomor valid untuk diikutkan ke campaign.');
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details)
      VALUES (${principal.userId}::uuid,'whatsapp.drip.created',${campaignId},${JSON.stringify({name,recipients:enrolled,steps:steps.length})}::jsonb)`;
    return { id: String(campaign.id), enrolled, steps: steps.length };
  });
  return result;
}

export async function listWhatsappDripCampaigns() {
  const sql = getDatabaseClient();
  return await sql`
    SELECT c.id,c.name,c.description,c.active,c.created_at,
      COUNT(DISTINCT s.id)::int AS step_count,
      COUNT(DISTINCT e.id)::int AS enrolled_count,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status='active')::int AS active_count,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status='completed')::int AS completed_count,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status='cancelled')::int AS cancelled_count,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status='paused')::int AS paused_count
    FROM whatsapp_drip_campaigns c
    LEFT JOIN whatsapp_drip_steps s ON s.campaign_id=c.id
    LEFT JOIN whatsapp_drip_enrollments e ON e.campaign_id=c.id
    GROUP BY c.id ORDER BY c.created_at DESC LIMIT 50`;
}


export async function setWhatsappDripCampaignActive(principal: Principal, campaignId: string, active: boolean) {
  if (!principal.roles.includes('admin') && !principal.roles.includes('super_admin')) throw new Error('Hanya admin yang dapat mengubah campaign.');
  if (typeof active !== 'boolean') throw new Error('Status campaign tidak valid.');
  const sql = getDatabaseClient();
  const result = await sql.begin(async tx => {
    const [campaign] = await tx`UPDATE whatsapp_drip_campaigns SET active=${active},updated_at=now() WHERE id=${campaignId}::uuid RETURNING id,name,active`;
    if (!campaign) throw new Error('Campaign tidak ditemukan.');
    if (!active) {
      await tx`UPDATE whatsapp_drip_enrollments SET status='paused',last_error='Campaign dihentikan sementara oleh admin.' WHERE campaign_id=${campaignId}::uuid AND status IN ('active','paused')`;
      await tx`UPDATE notification_outbox o SET status='failed',last_error='Campaign dihentikan sementara oleh admin.',updated_at=now()
        FROM whatsapp_drip_enrollments e WHERE o.drip_enrollment_id=e.id AND e.campaign_id=${campaignId}::uuid AND o.status IN ('pending','awaiting_inbound')`;
      await tx`UPDATE whatsapp_messages SET delivery_status='failed' WHERE outbox_id IN (SELECT o.id FROM notification_outbox o JOIN whatsapp_drip_enrollments e ON e.id=o.drip_enrollment_id WHERE e.campaign_id=${campaignId}::uuid AND o.status='failed') AND delivery_status='queued'`;
    } else await tx`UPDATE whatsapp_drip_enrollments SET status='active',next_send_at=now(),last_error='' WHERE campaign_id=${campaignId}::uuid AND status='paused' AND last_error='Campaign dihentikan sementara oleh admin.'`;
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES (${principal.userId}::uuid,'whatsapp.drip.toggled',${campaignId},${JSON.stringify({active})}::jsonb)`;
    return campaign;
  });
  return result;
}

export async function getWhatsappInboxSummary(principal: Principal) {
  const scope = assertScope(principal);
  const sql = getDatabaseClient();
  const promoterCode = scope.kind === 'assigned' ? scope.promoterCode : '';
  const [summary] = await sql`
    SELECT COUNT(*)::int AS total,
      COALESCE(SUM(c.unread_count),0)::int AS unread,
      COUNT(*) FILTER (WHERE c.status='waiting')::int AS waiting,
      COUNT(*) FILTER (WHERE c.status='open')::int AS open,
      COUNT(*) FILTER (WHERE c.bot_mode='bot' AND c.status<>'closed')::int AS bot_active
    FROM whatsapp_conversations c LEFT JOIN public_interest_leads l ON l.id=c.lead_id
    WHERE (${scope.kind}='all' OR (l.assigned_promoter_code=${promoterCode} AND l.consent_to_share=TRUE))`;
  return summary || { total: 0, unread: 0, waiting: 0, open: 0, bot_active: 0 };
}

export async function listWhatsappTemplates(principal: Principal, includeInactive = false) {
  assertScope(principal);
  const sql = getDatabaseClient();
  return await sql`SELECT id,title,category,body,active,updated_at FROM whatsapp_templates WHERE (${includeInactive} OR active=TRUE) ORDER BY category,title LIMIT 200`;
}

export async function saveWhatsappTemplate(principal: Principal, input: { id?: number; title: string; category?: string; body: string; active?: boolean }) {
  if (!principal.roles.includes('admin') && !principal.roles.includes('super_admin')) throw new Error('Hanya admin yang dapat mengubah template.');
  const title = input.title.trim().slice(0, 100);
  const category = String(input.category ?? 'umum').trim().slice(0, 40) || 'umum';
  const body = input.body.trim().slice(0, 4000);
  if (!title || !body) throw new Error('Judul dan isi template wajib diisi.');
  const sql = getDatabaseClient();
  const [row] = input.id
    ? await sql`UPDATE whatsapp_templates SET title=${title},category=${category},body=${body},active=${input.active !== false},updated_at=now() WHERE id=${input.id} RETURNING id,title,category,body,active,updated_at`
    : await sql`INSERT INTO whatsapp_templates(title,category,body,active,created_by) VALUES (${title},${category},${body},${input.active !== false},${principal.userId}::uuid) RETURNING id,title,category,body,active,updated_at`;
  if (!row) throw new Error('Template tidak ditemukan.');
  await sql`INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES (${principal.userId}::uuid,'whatsapp.template.saved',${String(row.id)},${JSON.stringify({title,category,active:row.active})}::jsonb)`;
  return row;
}

export async function toggleWhatsappTemplate(principal: Principal, id: number, active: boolean) {
  if (!principal.roles.includes('admin') && !principal.roles.includes('super_admin')) throw new Error('Hanya admin yang dapat mengubah template.');
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('ID template tidak valid.');
  const sql = getDatabaseClient();
  const [row] = await sql`UPDATE whatsapp_templates SET active=${active},updated_at=now() WHERE id=${id} RETURNING id,title,category,body,active,updated_at`;
  if (!row) throw new Error('Template tidak ditemukan.');
  await sql`INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES (${principal.userId}::uuid,'whatsapp.template.toggled',${String(id)},${JSON.stringify({active})}::jsonb)`;
  return row;
}

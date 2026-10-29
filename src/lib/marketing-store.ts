import { randomUUID } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { normalizeWhatsAppNumber, starsenderStatus } from '@/lib/starsender-client';

export async function listMarketingContacts(search = '') {
  const sql = getDatabaseClient();
  const q = search.trim().slice(0, 120);
  return await sql`
    SELECT id,name,phone,service,status,whatsapp_marketing_consent,whatsapp_marketing_consent_at
    FROM public_interest_leads
    WHERE (${q} = '' OR name ILIKE ${`%${q}%`} OR phone ILIKE ${`%${q}%`} OR service ILIKE ${`%${q}%`})
    ORDER BY created_at DESC,id DESC LIMIT 200`;
}

export async function setMarketingConsent(leadId: number, enabled: boolean, actor: string, confirmation: boolean) {
  if (!Number.isSafeInteger(leadId) || leadId < 1) throw new Error('ID kontak tidak valid.');
  if (typeof enabled !== 'boolean') throw new Error('Status persetujuan tidak valid.');
  if (enabled && confirmation !== true) throw new Error('Konfirmasi bahwa persetujuan promosi telah diperoleh wajib dicentang.');
  const sql = getDatabaseClient();
  const [lead] = await sql`
    UPDATE public_interest_leads
    SET whatsapp_marketing_consent=${enabled},
        whatsapp_marketing_consent_at=CASE WHEN ${enabled} THEN now() ELSE NULL END,
        whatsapp_marketing_consent_by=${actor.slice(0, 200)}
    WHERE id=${leadId}
    RETURNING id,name,phone,whatsapp_marketing_consent,whatsapp_marketing_consent_at`;
  if (!lead) throw new Error('Kontak tidak ditemukan.');
  await sql`
    INSERT INTO platform_admin_audit(actor_id,action,target,details)
    VALUES (${actor}::uuid,'marketing.consent.updated',${String(leadId)},${JSON.stringify({enabled,consentAt:lead.whatsapp_marketing_consent_at})}::jsonb)`;
  return lead;
}

export async function createMarketingCampaign(input: { title: string; message: string; leadIds: number[]; actor: string }) {
  if (!starsenderStatus().configured) throw new Error('STARSENDER_API_KEY belum dikonfigurasi.');
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || title.length > 120) throw new Error('Judul kampanye wajib diisi dan maksimal 120 karakter.');
  if (!message || message.length > 2000) throw new Error('Pesan wajib diisi dan maksimal 2.000 karakter.');
  const ids = [...new Set(input.leadIds)].filter(id => Number.isSafeInteger(id) && id > 0);
  if (!ids.length || ids.length > 100) throw new Error('Pilih 1 sampai 100 kontak yang telah menyetujui pesan promosi.');
  const sql = getDatabaseClient();
  const campaignId = randomUUID();
  const queued = await sql.begin(async tx => {
    // Lock and re-check consent in the same transaction as queue insertion.
    const contacts = await tx`
      SELECT id,name,phone FROM public_interest_leads
      WHERE id=ANY(${ids}::bigint[]) AND whatsapp_marketing_consent=TRUE
      ORDER BY id FOR UPDATE`;
    const accepted: Array<{ id: number; name: string; phone: string; message: string }> = [];
    for (const contact of contacts) {
      try {
        normalizeWhatsAppNumber(String(contact.phone));
        const personalized = message.replace(/\{\{\s*(?:nama|name)\s*\}\}/gi, String(contact.name || 'Bapak/Ibu'));
        accepted.push({ id: Number(contact.id), name: String(contact.name || ''), phone: String(contact.phone), message: personalized });
      } catch { /* Invalid phone numbers are excluded and not queued. */ }
    }
    if (!accepted.length) throw new Error('Tidak ada kontak valid yang terpilih dengan persetujuan marketing aktif.');
    await tx`
      INSERT INTO marketing_campaigns(id,title,message,created_by,recipient_count)
      VALUES (${campaignId}::uuid,${title},${message},${input.actor},${accepted.length})`;
    for (const contact of accepted) {
      await tx`
        INSERT INTO notification_outbox(event_type,lead_id,campaign_id,recipient_phone,recipient_name,message,dedupe_key,created_by)
        VALUES ('marketing_campaign',${contact.id},${campaignId}::uuid,${contact.phone},${contact.name},${contact.message},${`campaign:${campaignId}:${contact.id}`},${input.actor})
        ON CONFLICT(dedupe_key) DO NOTHING`;
    }
    await tx`
      INSERT INTO platform_admin_audit(actor_id,action,target,details)
      VALUES (${input.actor}::uuid,'marketing.campaign.queued',${campaignId},${JSON.stringify({recipientCount:accepted.length,title})}::jsonb)`;
    return accepted.length;
  });
  return { campaignId, queued };
}
export async function listMarketingCampaigns(limit = 20) {
  const sql = getDatabaseClient();
  const boundedLimit = Math.max(1, Math.min(50, Math.trunc(limit)));
  return await sql`
    SELECT c.id,c.title,c.recipient_count,c.created_by,c.created_at,
      COUNT(o.id) FILTER (WHERE o.status='pending')::int AS pending_count,
      COUNT(o.id) FILTER (WHERE o.status='sending')::int AS sending_count,
      COUNT(o.id) FILTER (WHERE o.status='sent')::int AS sent_count,
      COUNT(o.id) FILTER (WHERE o.status='failed')::int AS failed_count,
      COUNT(o.id) FILTER (WHERE o.status='unknown')::int AS unknown_count
    FROM marketing_campaigns c
    LEFT JOIN notification_outbox o ON o.campaign_id=c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT ${boundedLimit}`;
}


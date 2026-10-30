import { whatsappMediaUrl } from './whatsapp-media.ts';
import { randomUUID } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { type Principal } from '@/lib/identity/access-policy';
import { listStarSenderGroups } from '@/lib/starsender-client';
import { getIntegrationConfig } from '@/lib/integration-settings';

function requireAdmin(principal: Principal) {
  if (!principal.roles.includes('admin') && !principal.roles.includes('super_admin')) throw new Error('Hanya admin yang dapat mengelola grup dan broadcast WhatsApp.');
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map(value => String(value ?? '').trim()).filter(Boolean))];
}

export async function syncWhatsappGroups(principal: Principal) {
  requireAdmin(principal);
  const config = await getIntegrationConfig();
  if (!config.starsender.apiKey) throw new Error('Device API key StarSender belum dikonfigurasi.');
  const groups = await listStarSenderGroups();
  const sql = getDatabaseClient();
  await sql.begin(async tx => {
    for (const group of groups) {
      await tx`INSERT INTO whatsapp_groups(group_jid,group_name,device_name,last_synced_at,raw_payload,updated_at)
        VALUES (${group.groupJid},${group.groupName},${group.deviceName},now(),${JSON.stringify(group.raw)}::jsonb,now())
        ON CONFLICT(group_jid) DO UPDATE SET group_name=CASE WHEN EXCLUDED.group_name<>'' AND EXCLUDED.group_name<>EXCLUDED.group_jid THEN EXCLUDED.group_name ELSE whatsapp_groups.group_name END,
          device_name=CASE WHEN EXCLUDED.device_name<>'' THEN EXCLUDED.device_name ELSE whatsapp_groups.device_name END,
          last_synced_at=now(),raw_payload=EXCLUDED.raw_payload,updated_at=now()`;
    }
  });
  return { synced: groups.length };
}

export async function listWhatsappGroupsDashboard(selectedGroup = '') {
  const sql = getDatabaseClient();
  const [groups, presets, broadcasts, groupMessages] = await Promise.all([
    sql`SELECT group_jid,COALESCE(NULLIF(display_name_override,''),group_name) AS group_name,device_name,allow_broadcast,last_synced_at,updated_at
      FROM whatsapp_groups ORDER BY allow_broadcast DESC,group_name ASC LIMIT 500`,
    sql`SELECT p.id,p.name,p.description,p.message,p.active,p.created_at,p.updated_at,
        COUNT(i.group_jid)::int AS group_count,
        COALESCE(array_agg(i.group_jid) FILTER (WHERE i.group_jid IS NOT NULL),'{}') AS group_jids
      FROM whatsapp_group_presets p LEFT JOIN whatsapp_group_preset_items i ON i.preset_id=p.id
      GROUP BY p.id ORDER BY p.updated_at DESC LIMIT 100`,
    sql`SELECT b.id,b.name,b.message,b.timezone,b.scheduled_at,b.status,b.created_at,b.started_at,b.completed_at,
        COUNT(j.id)::int AS group_count,
        COUNT(j.id) FILTER (WHERE j.status='pending')::int AS pending_count,
        COUNT(j.id) FILTER (WHERE j.status='processing')::int AS processing_count,
        COUNT(j.id) FILTER (WHERE j.status='sent')::int AS sent_count,
        COUNT(j.id) FILTER (WHERE j.status='failed')::int AS failed_count,
        COUNT(j.id) FILTER (WHERE j.status='unknown')::int AS unknown_count
      FROM whatsapp_group_broadcasts b LEFT JOIN whatsapp_group_broadcast_jobs j ON j.broadcast_id=b.id
      GROUP BY b.id ORDER BY b.created_at DESC LIMIT 50`,
    sql`SELECT m.id,m.provider_message_id,m.group_jid,
        COALESCE(NULLIF(g.display_name_override,''),NULLIF(g.group_name,g.group_jid),NULLIF(m.group_name,''),m.group_jid) AS group_name,
        m.direction,m.sender_jid,m.sender_name,m.sender_is_admin,m.content,m.media_url,m.device_name,m.provider_timestamp,m.created_at
      FROM whatsapp_group_messages m LEFT JOIN whatsapp_groups g ON g.group_jid=m.group_jid
      WHERE (${selectedGroup}='' OR m.group_jid=${selectedGroup})
      ORDER BY COALESCE(m.provider_timestamp,m.created_at) DESC,m.id DESC LIMIT 100`,
  ]);
  return { groups, presets, broadcasts, groupMessages };
}

export async function setWhatsappGroupBroadcastAllowed(principal: Principal, groupJid: string, allowed: boolean) {
  requireAdmin(principal);
  const sql = getDatabaseClient();
  const [group] = await sql`UPDATE whatsapp_groups SET allow_broadcast=${allowed},updated_at=now()
    WHERE group_jid=${groupJid} RETURNING group_jid,group_name,allow_broadcast`;
  if (!group) throw new Error('Grup tidak ditemukan. Sinkronkan daftar grup StarSender terlebih dahulu.');
  if (!allowed) {
    await sql`UPDATE whatsapp_group_presets SET updated_at=now() WHERE id IN (
      SELECT preset_id FROM whatsapp_group_preset_items WHERE group_jid=${groupJid})`;
  }
  await sql`INSERT INTO platform_admin_audit(actor_id,action,target,details)
    VALUES (${principal.userId}::uuid,'whatsapp.group.broadcast_permission',${groupJid},${JSON.stringify({allowed})}::jsonb)`;
  return group;
}

export async function saveWhatsappGroupPreset(principal: Principal, input: { id?: string; name: string; description?: string; message: string; groupJids: string[]; active?: boolean }) {
  requireAdmin(principal);
  const name = input.name.trim().slice(0, 120);
  const description = String(input.description ?? '').trim().slice(0, 500);
  const message = input.message.trim().slice(0, 4000);
  const groupJids = uniqueStrings(input.groupJids);
  if (!name) throw new Error('Nama preset wajib diisi.');
  if (!message) throw new Error('Isi pesan preset wajib diisi.');
  if (!groupJids.length || groupJids.length > 100) throw new Error('Pilih 1 sampai 100 grup yang diizinkan menerima broadcast.');
  const sql = getDatabaseClient();
  const allowed = await sql`SELECT group_jid FROM whatsapp_groups WHERE group_jid=ANY(${groupJids}::text[]) AND allow_broadcast=TRUE`;
  if (allowed.length !== groupJids.length) throw new Error('Preset hanya boleh memuat grup yang berstatus Diizinkan broadcast.');
  const id = input.id && /^[0-9a-f-]{36}$/i.test(input.id) ? input.id : randomUUID();
  const row = await sql.begin(async tx => {
    const [preset] = await tx`INSERT INTO whatsapp_group_presets(id,name,description,message,active,created_by,updated_at)
      VALUES (${id}::uuid,${name},${description},${message},${input.active !== false},${principal.userId}::uuid,now())
      ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,message=EXCLUDED.message,active=EXCLUDED.active,updated_at=now()
      RETURNING id,name,description,message,active,updated_at`;
    await tx`DELETE FROM whatsapp_group_preset_items WHERE preset_id=${id}::uuid`;
    for (const groupJid of groupJids) await tx`INSERT INTO whatsapp_group_preset_items(preset_id,group_jid) VALUES (${id}::uuid,${groupJid})`;
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details)
      VALUES (${principal.userId}::uuid,'whatsapp.group_preset.saved',${id},${JSON.stringify({name,groups:groupJids.length})}::jsonb)`;
    return preset;
  });
  return row;
}

export async function toggleWhatsappGroupPreset(principal: Principal, id: string, active: boolean) {
  requireAdmin(principal);
  const sql = getDatabaseClient();
  const [row] = await sql`UPDATE whatsapp_group_presets SET active=${active},updated_at=now() WHERE id=${id}::uuid RETURNING id,name,active`;
  if (!row) throw new Error('Preset grup tidak ditemukan.');
  return row;
}

export async function createWhatsappGroupBroadcast(principal: Principal, input: { name: string; message: string; presetId?: string; groupJids: string[]; scheduledAt: string; mediaUrl?: string; confirmGroupPermission: boolean }) {
  requireAdmin(principal);
  if (!input.confirmGroupPermission) throw new Error('Konfirmasi bahwa grup yang dipilih memang boleh menerima pesan ini wajib diberikan.');
  const name = input.name.trim().slice(0, 120);
  const message = input.message.trim().slice(0, 4000);
  const mediaUrl = whatsappMediaUrl(input.mediaUrl);
  if (/\{\{\s*(kota|referensi)\s*\}\}/i.test(message)) throw new Error('Konten grup mendukung {{nama}} untuk nama grup. Ganti variabel kota atau referensi dengan teks sebelum mengirim.');
  if (!name || (!message && !mediaUrl)) throw new Error('Nama broadcast dan isi atau lampiran wajib diisi.');
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) throw new Error('Tanggal dan waktu pengiriman tidak valid.');
  if (scheduledAt.getTime() < Date.now() - 60_000) throw new Error('Waktu pengiriman tidak boleh berada di masa lalu.');
  const integration = await getIntegrationConfig();
  if (!integration.starsender.apiKey) throw new Error('Device API key StarSender belum dikonfigurasi.');
  const sql = getDatabaseClient();
  const groupJids = input.presetId
    ? (await sql`SELECT i.group_jid FROM whatsapp_group_preset_items i JOIN whatsapp_group_presets p ON p.id=i.preset_id AND p.active=TRUE WHERE p.id=${input.presetId}::uuid ORDER BY i.group_jid`).map(row => String(row.group_jid))
    : uniqueStrings(input.groupJids);
  if (!groupJids.length || groupJids.length > 100) throw new Error('Pilih 1 sampai 100 grup untuk broadcast.');
  const allowed = await sql`SELECT group_jid FROM whatsapp_groups WHERE group_jid=ANY(${groupJids}::text[]) AND allow_broadcast=TRUE`;
  if (allowed.length !== groupJids.length) throw new Error('Ada grup yang belum diizinkan broadcast. Perbarui preset atau izin grup terlebih dahulu.');
  const id = randomUUID();
  await sql.begin(async tx => {
    await tx`INSERT INTO whatsapp_group_broadcasts(id,preset_id,name,message,media_url,timezone,scheduled_at,status,created_by)
      VALUES (${id}::uuid,${input.presetId || null}::uuid,${name},${message},${mediaUrl},'Asia/Jakarta',${scheduledAt.toISOString()}::timestamptz,'scheduled',${principal.userId}::uuid)`;
    for (const groupJid of groupJids) await tx`INSERT INTO whatsapp_group_broadcast_jobs(broadcast_id,group_jid,status,scheduled_at)
      VALUES (${id}::uuid,${groupJid},'pending',${scheduledAt.toISOString()}::timestamptz)`;
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details)
      VALUES (${principal.userId}::uuid,'whatsapp.group_broadcast.created',${id},${JSON.stringify({name,groups:groupJids.length,scheduledAt:scheduledAt.toISOString()})}::jsonb)`;
  });
  return { id, groups: groupJids.length, scheduledAt: scheduledAt.toISOString() };
}

export async function setWhatsappGroupBroadcastStatus(principal: Principal, id: string, action: 'pause' | 'resume' | 'cancel') {
  requireAdmin(principal);
  const sql = getDatabaseClient();
  return await sql.begin(async tx => {
    const [broadcast] = await tx`SELECT id,status,scheduled_at FROM whatsapp_group_broadcasts WHERE id=${id}::uuid FOR UPDATE`;
    if (!broadcast) throw new Error('Broadcast tidak ditemukan.');
    if (action === 'pause') {
      if (!['scheduled','processing'].includes(String(broadcast.status))) throw new Error('Broadcast ini tidak dapat dijeda.');
      await tx`UPDATE whatsapp_group_broadcasts SET status='paused',updated_at=now() WHERE id=${id}::uuid`;
    } else if (action === 'resume') {
      if (String(broadcast.status) !== 'paused') throw new Error('Hanya broadcast yang dijeda dapat dilanjutkan.');
      await tx`UPDATE whatsapp_group_broadcasts SET status='scheduled',scheduled_at=LEAST(scheduled_at,now()),updated_at=now() WHERE id=${id}::uuid`;
      await tx`UPDATE whatsapp_group_broadcast_jobs SET status='pending',scheduled_at=now(),last_error='',updated_at=now() WHERE broadcast_id=${id}::uuid AND status='pending'`;
    } else {
      if (['completed','cancelled'].includes(String(broadcast.status))) throw new Error('Broadcast sudah selesai atau dibatalkan.');
      await tx`UPDATE whatsapp_group_broadcasts SET status='cancelled',completed_at=now(),updated_at=now() WHERE id=${id}::uuid`;
      await tx`UPDATE whatsapp_group_broadcast_jobs SET status='cancelled',last_error='Dibatalkan oleh admin.',updated_at=now() WHERE broadcast_id=${id}::uuid AND status IN ('pending','processing')`;
    }
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details)
      VALUES (${principal.userId}::uuid,'whatsapp.group_broadcast.status',${id},${JSON.stringify({action})}::jsonb)`;
    const [updated] = await tx`SELECT id,status,scheduled_at FROM whatsapp_group_broadcasts WHERE id=${id}::uuid`;
    return updated;
  });
}

export async function renameWhatsappGroup(principal: Principal, groupJid: string, name: string) {
  requireAdmin(principal);
  const trimmed = name.trim();
  if (trimmed.length > 160) throw new Error('Nama grup maksimal 160 karakter.');
  const sql = getDatabaseClient();
  return sql.begin(async tx => {
    const [group] = await tx`UPDATE whatsapp_groups SET display_name_override=${trimmed},updated_at=now() WHERE group_jid=${groupJid} RETURNING group_jid`;
    if (!group) throw new Error('Grup tidak ditemukan.');
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES (${principal.userId}::uuid,'whatsapp.group.renamed',${groupJid},${JSON.stringify({name: trimmed})}::jsonb)`;
    return group;
  });
}

export async function bulkWhatsappGroupPermission(principal: Principal, rawIds: string[], allowed: boolean) {
  requireAdmin(principal);
  const ids = [...new Set(rawIds)];
  if (!ids.length || ids.length > 500 || ids.some(id => !id.endsWith('@g.us'))) throw new Error('Pilih 1 sampai 500 grup.');
  const sql = getDatabaseClient();
  return sql.begin(async tx => {
    const rows = await tx`UPDATE whatsapp_groups SET allow_broadcast=${allowed},updated_at=now() WHERE group_jid=ANY(${ids}::text[]) RETURNING group_jid`;
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES (${principal.userId}::uuid,'whatsapp.groups.bulk_permission','groups',${JSON.stringify({allowed,groupJids:rows.map(row=>row.group_jid)})}::jsonb)`;
    return { updated: rows.length };
  });
}

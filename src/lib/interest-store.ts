import { getDatabaseClient } from '@/lib/article-store';
import crypto from 'node:crypto';

export type LeadStatus =
  | 'baru'
  | 'mencari_promotor'
  | 'ditawarkan'
  | 'diklaim'
  | 'dijadwalkan'
  | 'selesai'
  | 'ditutup';

export const VALID_LEAD_STATUSES: LeadStatus[] = [
  'baru', 'mencari_promotor', 'ditawarkan', 'diklaim', 'dijadwalkan', 'selesai', 'ditutup',
];

export const VALID_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  baru: ['mencari_promotor', 'ditawarkan', 'ditutup'],
  mencari_promotor: ['ditawarkan', 'diklaim', 'ditutup'],
  ditawarkan: ['diklaim', 'dijadwalkan', 'mencari_promotor', 'ditutup'],
  diklaim: ['dijadwalkan', 'selesai', 'ditawarkan', 'ditutup'],
  dijadwalkan: ['selesai', 'ditutup'],
  selesai: [],
  ditutup: [],
};

export type InterestInput = {
  name: string;
  phone: string;
  city: string;
  service: string;
  notes: string;
  sourcePath: string;
  provinceCode?: string;
  provinceName?: string;
  regencyCode?: string;
  regencyName?: string;
  waConsent: boolean;
  waConsentAt: string;
  initialStatus: LeadStatus;
  responseDeadlineAt?: string;
};

export type StoredLead = {
  id: number;
  name: string;
  phone: string;
  city: string;
  service: string;
  notes: string;
  sourcePath: string;
  provinceCode?: string;
  provinceName?: string;
  regencyCode?: string;
  regencyName?: string;
  waConsent: boolean;
  waConsentAt?: string;
  status: LeadStatus;
  assignedPromoterCode?: string;
  assignedAt?: string;
  scheduleAt?: string;
  responseDeadlineAt?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type LeadStatusHistoryEntry = {
  id: number;
  leadId: number;
  oldStatus: string;
  newStatus: string;
  note?: string;
  actor: string;
  createdAt: string;
};

export type LeadClaimLink = {
  id: number;
  leadId: number;
  tokenHash: string;
  expiresAt: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
};

export type LeadClaim = {
  id: number;
  leadId: number;
  promoterCode: string;
  claimStatus: 'diajukan' | 'disetujui' | 'ditolak';
  claimedAt: string;
  adminDecision?: string;
  decidedAt?: string;
  decidedBy?: string;
};

const globalForInterests = globalThis as unknown as { konsepStifinInterestSchema?: Promise<void> };

async function ensureInterestSchema() {
  if (!globalForInterests.konsepStifinInterestSchema) {
    globalForInterests.konsepStifinInterestSchema = (async () => {
      const sql = getDatabaseClient();

      await sql`
        CREATE TABLE IF NOT EXISTS public_interest_leads (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          city TEXT NOT NULL,
          service TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          source_path TEXT NOT NULL DEFAULT '/',
          status TEXT NOT NULL DEFAULT 'baru',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS province_code TEXT`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS province_name TEXT`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS regency_code TEXT`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS regency_name TEXT`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS wa_consent BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS wa_consent_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS assigned_promoter_code TEXT`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS schedule_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS response_deadline_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS internal_notes TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

      await sql`UPDATE public_interest_leads SET status = 'baru' WHERE status = 'new'`;
      await sql`UPDATE public_interest_leads SET status = 'baru' WHERE status NOT IN ${sql(VALID_LEAD_STATUSES)}`;

      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_created_idx ON public_interest_leads(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_status_idx ON public_interest_leads(status)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_region_idx ON public_interest_leads(province_code, regency_code)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_service_idx ON public_interest_leads(service)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_promoter_idx ON public_interest_leads(assigned_promoter_code)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_deadline_idx ON public_interest_leads(response_deadline_at) WHERE response_deadline_at IS NOT NULL`;

      await sql`
        CREATE TABLE IF NOT EXISTS lead_status_history (
          id BIGSERIAL PRIMARY KEY,
          lead_id BIGINT NOT NULL REFERENCES public_interest_leads(id) ON DELETE CASCADE,
          old_status TEXT NOT NULL,
          new_status TEXT NOT NULL,
          note TEXT,
          actor TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS lead_status_history_lead_idx ON lead_status_history(lead_id, created_at DESC)`;

      await sql`
        CREATE TABLE IF NOT EXISTS lead_claim_links (
          id BIGSERIAL PRIMARY KEY,
          lead_id BIGINT NOT NULL REFERENCES public_interest_leads(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_by TEXT NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS lead_claim_links_lead_idx ON lead_claim_links(lead_id, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS lead_claim_links_active_idx ON lead_claim_links(token_hash) WHERE active = TRUE`;

      await sql`
        CREATE TABLE IF NOT EXISTS lead_claims (
          id BIGSERIAL PRIMARY KEY,
          lead_id BIGINT NOT NULL REFERENCES public_interest_leads(id) ON DELETE CASCADE,
          promoter_code TEXT NOT NULL,
          claim_status TEXT NOT NULL DEFAULT 'diajukan',
          claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          admin_decision TEXT,
          decided_at TIMESTAMPTZ,
          decided_by TEXT
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS lead_claims_lead_idx ON lead_claims(lead_id, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS lead_claims_promoter_idx ON lead_claims(promoter_code)`;

      await sql`
        CREATE TABLE IF NOT EXISTS promoter_public_cache (
          code TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          branch_code TEXT NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          wilayah_layanan JSONB NOT NULL DEFAULT '[]'::jsonb,
          data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS promoter_public_cache_active_idx ON promoter_public_cache(active) WHERE active = TRUE`;
      await sql`CREATE INDEX IF NOT EXISTS promoter_public_cache_branch_idx ON promoter_public_cache(branch_code)`;
    })().catch((error) => {
      globalForInterests.konsepStifinInterestSchema = undefined;
      throw error;
    });
  }
  await globalForInterests.konsepStifinInterestSchema;
}

function compact(value: unknown, max: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizePhone(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('62')) return `+${digits}`;
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  return digits;
}

export function validateInterestInput(value: unknown): InterestInput {
  if (!value || typeof value !== 'object') throw new Error('Data formulir tidak valid.');
  const data = value as Record<string, unknown>;

  const name = compact(data.name, 120);
  const rawPhone = compact(data.phone, 32).replace(/[^0-9+() -]/g, '');
  const phone = normalizePhone(rawPhone);
  const city = compact(data.city, 100);
  const service = compact(data.service, 120);
  const notes = compact(data.notes, 600);
  const sourcePath = compact(data.sourcePath, 240) || '/';

  const provinceCode = compact(data.provinceCode, 10) || undefined;
  const provinceName = compact(data.provinceName, 100) || undefined;
  const regencyCode = compact(data.regencyCode, 15) || undefined;
  const regencyName = compact(data.regencyName, 100) || undefined;

  const waConsent = Boolean(data.waConsent);
  const waConsentAtRaw = String(data.waConsentAt ?? '').trim();
  const waConsentAt = waConsentAtRaw && !Number.isNaN(new Date(waConsentAtRaw).getTime())
    ? waConsentAtRaw
    : new Date().toISOString();

  const initialStatusRaw = compact(data.initialStatus, 30) as LeadStatus;
  const initialStatus: LeadStatus = VALID_LEAD_STATUSES.includes(initialStatusRaw)
    ? initialStatusRaw
    : (provinceCode || regencyCode ? 'mencari_promotor' : 'baru');

  const responseDeadlineAtRaw = String(data.responseDeadlineAt ?? '').trim();
  const responseDeadlineAt = responseDeadlineAtRaw && !Number.isNaN(new Date(responseDeadlineAtRaw).getTime())
    ? responseDeadlineAtRaw
    : undefined;

  if (name.length < 3) throw new Error('Nama lengkap minimal 3 karakter.');
  if (phone.replace(/\D/g, '').length < 9) throw new Error('Nomor WhatsApp belum lengkap.');
  if (city.length < 2 && !regencyName) throw new Error('Kota atau domisili perlu diisi.');
  if (service.length < 3) throw new Error('Pilih layanan yang diminati.');
  if (!waConsent) throw new Error('Persetujuan penggunaan WhatsApp wajib untuk tindak lanjut.');

  return {
    name, phone, city, service, notes, sourcePath,
    provinceCode, provinceName, regencyCode, regencyName,
    waConsent, waConsentAt, initialStatus, responseDeadlineAt,
  };
}

export function isValidStatusTransition(from: LeadStatus, to: LeadStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function createInterestLead(input: InterestInput): Promise<number> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const deadline = input.responseDeadlineAt
    ? new Date(input.responseDeadlineAt)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const rows = await sql`
    INSERT INTO public_interest_leads (
      name, phone, city, service, notes, source_path,
      province_code, province_name, regency_code, regency_name,
      wa_consent, wa_consent_at, status, response_deadline_at
    )
    VALUES (
      ${input.name}, ${input.phone}, ${input.city || input.regencyName || ''},
      ${input.service}, ${input.notes}, ${input.sourcePath},
      ${input.provinceCode || null}, ${input.provinceName || null},
      ${input.regencyCode || null}, ${input.regencyName || null},
      ${input.waConsent}, ${new Date(input.waConsentAt)},
      ${input.initialStatus}, ${deadline}
    )
    RETURNING id
  `;
  const leadId = Number(rows[0].id);

  await sql`
    INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor)
    VALUES (${leadId}, '', ${input.initialStatus}, 'Lead dibuat', 'system')
  `;

  return leadId;
}

function rowToLead(row: Record<string, unknown>): StoredLead {
  return {
    id: Number(row.id),
    name: String(row.name),
    phone: String(row.phone),
    city: String(row.city ?? ''),
    service: String(row.service ?? ''),
    notes: String(row.notes ?? ''),
    sourcePath: String(row.source_path ?? '/'),
    provinceCode: row.province_code ? String(row.province_code) : undefined,
    provinceName: row.province_name ? String(row.province_name) : undefined,
    regencyCode: row.regency_code ? String(row.regency_code) : undefined,
    regencyName: row.regency_name ? String(row.regency_name) : undefined,
    waConsent: Boolean(row.wa_consent),
    waConsentAt: row.wa_consent_at ? new Date(String(row.wa_consent_at)).toISOString() : undefined,
    status: (VALID_LEAD_STATUSES.includes(String(row.status) as LeadStatus)
      ? String(row.status)
      : 'baru') as LeadStatus,
    assignedPromoterCode: row.assigned_promoter_code ? String(row.assigned_promoter_code) : undefined,
    assignedAt: row.assigned_at ? new Date(String(row.assigned_at)).toISOString() : undefined,
    scheduleAt: row.schedule_at ? new Date(String(row.schedule_at)).toISOString() : undefined,
    responseDeadlineAt: row.response_deadline_at ? new Date(String(row.response_deadline_at)).toISOString() : undefined,
    internalNotes: row.internal_notes ? String(row.internal_notes) : undefined,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : undefined,
  };
}

export type LeadFilter = {
  status?: LeadStatus[];
  provinceCode?: string;
  regencyCode?: string;
  service?: string;
  assignedPromoterCode?: string;
  fromDate?: string;
  toDate?: string;
};

export async function listLeads(filter: LeadFilter = {}, limit = 200): Promise<StoredLead[]> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  let query = sql`SELECT * FROM public_interest_leads WHERE 1=1`;
  const clauses: string[] = [];
  const args: unknown[] = [];

  if (filter.status?.length) {
    clauses.push(`status IN (${filter.status.map(() => '?').join(', ')})`);
    args.push(...filter.status);
  }
  if (filter.provinceCode) { clauses.push('province_code = ?'); args.push(filter.provinceCode); }
  if (filter.regencyCode) { clauses.push('regency_code = ?'); args.push(filter.regencyCode); }
  if (filter.service) { clauses.push('service ILIKE ?'); args.push(`%${filter.service}%`); }
  if (filter.assignedPromoterCode) { clauses.push('assigned_promoter_code = ?'); args.push(filter.assignedPromoterCode); }
  if (filter.fromDate) { clauses.push('created_at >= ?'); args.push(new Date(filter.fromDate)); }
  if (filter.toDate) { clauses.push('created_at <= ?'); args.push(new Date(filter.toDate)); }

  if (clauses.length) {
    query = sql`${query} AND ${sql(clauses.join(' AND '), ...(args as string[])) as unknown as any}`;
  }
  query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;
  const rows = await query;
  return rows.map(rowToLead);
}

export async function getLead(id: number): Promise<StoredLead | undefined> {
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`SELECT * FROM public_interest_leads WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToLead(rows[0]) : undefined;
}

export async function getLeadStatusHistory(leadId: number): Promise<LeadStatusHistoryEntry[]> {
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`
    SELECT * FROM lead_status_history WHERE lead_id = ${leadId} ORDER BY created_at DESC
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    leadId: Number(row.lead_id),
    oldStatus: String(row.old_status ?? ''),
    newStatus: String(row.new_status),
    note: row.note ? String(row.note) : undefined,
    actor: String(row.actor),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function updateLeadStatus(
  leadId: number,
  newStatus: LeadStatus,
  actor: string,
  note?: string,
): Promise<StoredLead | undefined> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const current = await getLead(leadId);
  if (!current) return undefined;
  if (!isValidStatusTransition(current.status, newStatus)) {
    throw new Error(`Transisi status tidak sah: ${current.status} → ${newStatus}`);
  }
  const rows = await sql`
    UPDATE public_interest_leads SET status = ${newStatus}, updated_at = NOW()
    WHERE id = ${leadId} RETURNING *
  `;
  await sql`
    INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor)
    VALUES (${leadId}, ${current.status}, ${newStatus}, ${note ?? null}, ${actor})
  `;
  return rows[0] ? rowToLead(rows[0]) : undefined;
}

export async function assignPromoter(
  leadId: number,
  promoterCode: string,
  actor: string,
): Promise<StoredLead | undefined> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const rows = await sql`
    UPDATE public_interest_leads
    SET assigned_promoter_code = ${promoterCode.toUpperCase()},
        assigned_at = NOW(),
        status = CASE WHEN status IN ('baru','mencari_promotor','ditawarkan') THEN 'diklaim'::text ELSE status END,
        updated_at = NOW()
    WHERE id = ${leadId} RETURNING *
  `;
  if (rows[0]) {
    const updated = rowToLead(rows[0]);
    await sql`
      INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor)
      VALUES (${leadId}, ${(await getLead(leadId))?.status ?? ''}, ${updated.status},
              ${`Ditetapkan promotor ${promoterCode.toUpperCase()}`}, ${actor})
    `;
    return updated;
  }
  return undefined;
}

export async function setLeadSchedule(
  leadId: number,
  scheduleAt: Date,
  actor: string,
): Promise<StoredLead | undefined> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const current = await getLead(leadId);
  if (!current) return undefined;
  const newStatus: LeadStatus = ['selesai', 'ditutup'].includes(current.status) ? current.status : 'dijadwalkan';
  const rows = await sql`
    UPDATE public_interest_leads
    SET schedule_at = ${scheduleAt}, status = ${newStatus}, updated_at = NOW()
    WHERE id = ${leadId} RETURNING *
  `;
  if (rows[0]) {
    const updated = rowToLead(rows[0]);
    if (newStatus !== current.status) {
      await sql`
        INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor)
        VALUES (${leadId}, ${current.status}, ${newStatus},
                ${`Jadwal ditentukan: ${scheduleAt.toLocaleString('id-ID')}`}, ${actor})
      `;
    }
    return updated;
  }
  return undefined;
}

export async function updateInternalNotes(
  leadId: number,
  internalNotes: string,
  actor: string,
): Promise<StoredLead | undefined> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const rows = await sql`
    UPDATE public_interest_leads SET internal_notes = ${compact(internalNotes, 5000)}, updated_at = NOW()
    WHERE id = ${leadId} RETURNING *
  `;
  void actor;
  return rows[0] ? rowToLead(rows[0]) : undefined;
}

export type LeadCounts = Record<LeadStatus, number>;

export async function getLeadCounts(): Promise<LeadCounts> {
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`
    SELECT status, COUNT(*)::int AS cnt FROM public_interest_leads GROUP BY status
  `;
  const counts = Object.fromEntries(VALID_LEAD_STATUSES.map((s) => [s, 0])) as LeadCounts;
  for (const row of rows) {
    const status = String(row.status) as LeadStatus;
    if (VALID_LEAD_STATUSES.includes(status)) counts[status] = Number(row.cnt);
  }
  return counts;
}

export function hashClaimToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateClaimToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export async function createClaimLink(
  leadId: number,
  createdBy: string,
  expiresInHours = 48,
): Promise<{ id: number; token: string }> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const token = generateClaimToken();
  const tokenHash = hashClaimToken(token);
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  const rows = await sql`
    INSERT INTO lead_claim_links (lead_id, token_hash, expires_at, created_by)
    VALUES (${leadId}, ${tokenHash}, ${expiresAt}, ${createdBy})
    RETURNING id
  `;
  return { id: Number(rows[0].id), token };
}

export async function deactivateClaimLink(
  id: number,
): Promise<boolean> {
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`
    UPDATE lead_claim_links SET active = FALSE WHERE id = ${id} RETURNING id
  `;
  return Boolean(rows[0]);
}

export async function listClaimLinks(leadId: number): Promise<LeadClaimLink[]> {
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`
    SELECT * FROM lead_claim_links WHERE lead_id = ${leadId} ORDER BY created_at DESC
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    leadId: Number(row.lead_id),
    tokenHash: String(row.token_hash),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    active: Boolean(row.active),
    createdAt: new Date(String(row.created_at)).toISOString(),
    createdBy: String(row.created_by),
  }));
}

export async function validateAndGetClaimLink(
  token: string,
): Promise<(LeadClaimLink & { lead: StoredLead }) | null> {
  await ensureInterestSchema();
  const tokenHash = hashClaimToken(token);
  const rows = await getDatabaseClient()`
    SELECT l.*, c.id AS link_id, c.token_hash, c.expires_at, c.active, c.created_at AS link_created, c.created_by
    FROM lead_claim_links c
    JOIN public_interest_leads l ON l.id = c.lead_id
    WHERE c.token_hash = ${tokenHash}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const row = rows[0];
  const expired = new Date(String(row.expires_at)) < new Date();
  const active = Boolean(row.active) && !expired;
  const link: LeadClaimLink = {
    id: Number(row.link_id),
    leadId: Number(row.id),
    tokenHash: String(row.token_hash),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    active,
    createdAt: new Date(String(row.link_created)).toISOString(),
    createdBy: String(row.created_by),
  };
  return { ...link, lead: rowToLead(row as Record<string, unknown>) };
}

export async function submitClaim(
  linkId: number,
  leadId: number,
  promoterCode: string,
): Promise<number> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const normalizedCode = String(promoterCode ?? '').trim().toUpperCase();
  if (!normalizedCode) throw new Error('Kode ID promotor wajib diisi.');
  const rows = await sql`
    INSERT INTO lead_claims (lead_id, promoter_code, claim_status)
    VALUES (${leadId}, ${normalizedCode}, 'diajukan')
    RETURNING id
  `;
  void linkId;
  return Number(rows[0].id);
}

export async function listClaims(leadId: number): Promise<LeadClaim[]> {
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`
    SELECT * FROM lead_claims WHERE lead_id = ${leadId} ORDER BY claimed_at DESC
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    leadId: Number(row.lead_id),
    promoterCode: String(row.promoter_code),
    claimStatus: ['diajukan', 'disetujui', 'ditolak'].includes(String(row.claim_status))
      ? String(row.claim_status) as LeadClaim['claimStatus']
      : 'diajukan',
    claimedAt: new Date(String(row.claimed_at)).toISOString(),
    adminDecision: row.admin_decision ? String(row.admin_decision) : undefined,
    decidedAt: row.decided_at ? new Date(String(row.decided_at)).toISOString() : undefined,
    decidedBy: row.decided_by ? String(row.decided_by) : undefined,
  }));
}

export async function decideClaim(
  claimId: number,
  decision: 'disetujui' | 'ditolak',
  decidedBy: string,
  note?: string,
): Promise<LeadClaim | undefined> {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const rows = await sql`
    UPDATE lead_claims
    SET claim_status = ${decision}, decided_at = NOW(), decided_by = ${decidedBy}, admin_decision = ${note ?? null}
    WHERE id = ${claimId} RETURNING *
  `;
  if (!rows[0]) return undefined;
  const row = rows[0];
  if (decision === 'disetujui') {
    const leadId = Number(row.lead_id);
    const promoterCode = String(row.promoter_code);
    await assignPromoter(leadId, promoterCode, decidedBy);
  }
  return {
    id: Number(row.id),
    leadId: Number(row.lead_id),
    promoterCode: String(row.promoter_code),
    claimStatus: decision,
    claimedAt: new Date(String(row.claimed_at)).toISOString(),
    adminDecision: note,
    decidedAt: new Date().toISOString(),
    decidedBy,
  };
}

export async function savePromoterPublicCache(
  promoters: Array<{
    code: string; name: string; branchCode: string; active: boolean;
    wilayahLayanan: string[]; data: Record<string, unknown>;
  }>,
): Promise<void> {
  if (!promoters.length) return;
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  await Promise.all(promoters.map((p) => sql`
    INSERT INTO promoter_public_cache (code, name, branch_code, active, wilayah_layanan, data_json, synced_at)
    VALUES (${p.code.toUpperCase()}, ${p.name}, ${p.branchCode}, ${p.active},
            ${sql.json(p.wilayahLayanan)}, ${sql.json(p.data as unknown as Parameters<typeof sql.json>[0])}, NOW())
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      branch_code = EXCLUDED.branch_code,
      active = EXCLUDED.active,
      wilayah_layanan = EXCLUDED.wilayah_layanan,
      data_json = EXCLUDED.data_json,
      synced_at = NOW()
  `));
}

export async function getCachedPublicPromoters(): Promise<Array<{
  code: string; name: string; branchCode: string; active: boolean;
  wilayahLayanan: string[]; data: Record<string, unknown>; syncedAt: string;
}>> {
  try {
    await ensureInterestSchema();
  } catch {
    return [];
  }
  const rows = await getDatabaseClient()`SELECT * FROM promoter_public_cache ORDER BY name`;
  return rows.map((row) => ({
    code: String(row.code),
    name: String(row.name),
    branchCode: String(row.branch_code),
    active: Boolean(row.active),
    wilayahLayanan: Array.isArray(row.wilayah_layanan) ? (row.wilayah_layanan as string[]).map(String) : [],
    data: row.data_json && typeof row.data_json === 'object' ? (row.data_json as Record<string, unknown>) : {},
    syncedAt: new Date(String(row.synced_at)).toISOString(),
  }));
}

export function buildWhatsAppTemplates(lead: StoredLead, promoterDisplayName?: string) {
  const regionParts = [lead.regencyName, lead.provinceName].filter(Boolean).join(', ');
  const ref = `KSF-${String(lead.id).padStart(5, '0')}`;
  return {
    groupPromoter: `[LEAD BARU] ${ref}\nWilayah: ${regionParts || lead.city || '-'}\nLayanan: ${lead.service}\nKebutuhan: ${lead.notes || '-'} \n\nJika Anda dapat melayani, silakan ajukan klaim melalui tautan yang dibagikan admin. Jangan membagikan data calon konsumen di grup.`,
    assignedPromoter: `Halo ${promoterDisplayName || 'Promotor'},\n\nAnda ditugaskan untuk menangani calon konsumen Konsep STIFIn.\n\nReferensi: ${ref}\nNama: ${lead.name}\nWilayah: ${regionParts || lead.city || '-'}\nLayanan: ${lead.service}\nCatatan: ${lead.notes || '-'}\n\nSilakan perkenalkan diri dan konfirmasi ketersediaan jadwal. Terima kasih.`,
    consumer: `Halo ${lead.name.split(' ')[0]},\n\nTerima kasih telah mengajukan permintaan ${lead.service} melalui Konsep STIFIn.\n\nKami akan menghubungkan Anda dengan promotor yang dapat membantu di wilayah ${regionParts || lead.city || 'Anda'}.\n\nMohon menunggu konfirmasi lebih lanjut. Jika ada pertanyaan, balas pesan ini ya. 🙏`,
  };
}

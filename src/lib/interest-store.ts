import { getDatabaseClient } from '@/lib/article-store';
import {
  leadStatuses,
  promoterCandidateStatuses,
  testServiceStatuses,
  type LeadStatus,
  type LeadType,
  type MatchMethod,
  type PaymentStatus,
} from '@/lib/lead-domain';

export {
  leadStatuses,
  promoterCandidateStatuses,
  testServiceStatuses,
  type LeadStatus,
  type LeadType,
  type MatchMethod,
  type PaymentStatus,
  type PromoterCandidateStatus,
  type TestServiceStatus,
} from '@/lib/lead-domain';

const TEST_PRODUCT_KEYS = new Set([
  'tesPersonal', 'tesPasangan', 'paketKeluarga', 'paketKeluargaPlus', 'sekolahKomunitas', 'bantuanTes',
]);
const PROMOTER_PRODUCT_KEYS = new Set([
  'previewPromotor', 'wsl1', 'wsl2', 'idDanAlat', 'paketPromotor', 'bantuanPromotor',
]);
const PAYMENT_STATUSES = new Set<PaymentStatus>(['belum_dicek', 'menunggu', 'dibayar', 'gagal', 'dikembalikan']);
const IDEMPOTENCY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type InterestInput = {
  leadType: LeadType;
  productKey: string;
  name: string;
  phone: string;
  email: string;
  provinceCode: string;
  provinceName: string;
  regencyCode: string;
  regencyName: string;
  city: string;
  service: string;
  notes: string;
  sourcePath: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  referrer: string;
  consentToContact: boolean;
  consentToShare: boolean;
};

export type StoredPromoterCandidate = {
  code: string;
  name: string;
  branchCode: string;
  area: string;
  province: string;
};

export type StoredLead = InterestInput & {
  id: number;
  status: LeadStatus;
  assignedPromoterCode: string;
  pic: string;
  matchMethod: MatchMethod;
  matchedPromoterName: string;
  matchedBranchCode: string;
  promoterCandidates: StoredPromoterCandidate[];
  paymentStatus: PaymentStatus;
  sejoliOrderId: string;
  saleAmount: number;
  promoterPayout: number;
  otherCost: number;
  margin: number;
  scheduledAt: string | null;
  paymentCheckedAt: string | null;
  internalNotes: string;
  responseDueAt: string;
  consentAt: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadHistoryEntry = {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  note: string;
  actor: string;
  eventType: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type LeadMatchSnapshot = {
  matchMethod: MatchMethod;
  assignedPromoterCode: string;
  matchedPromoterName: string;
  matchedBranchCode: string;
  candidates?: StoredPromoterCandidate[];
};

export type CreateInterestLeadCommand = {
  interest: InterestInput;
  idempotencyKey: string;
  status?: LeadStatus;
  match?: LeadMatchSnapshot | null;
};

export type LeadAdminUpdate = {
  leadType: LeadType;
  status: LeadStatus;
  assignedPromoterCode?: string;
  pic?: string;
  scheduledAt?: string | null;
  internalNotes?: string;
  paymentStatus?: PaymentStatus;
  sejoliOrderId?: string;
  saleAmount?: number;
  promoterPayout?: number;
  otherCost?: number;
};

const globalForInterests = globalThis as unknown as { konsepStifinInterestSchema?: Promise<void> };

function compact(value: unknown, max: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function isoString(value: unknown) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function nullableIsoString(value: unknown) {
  const result = isoString(value);
  return result || null;
}

function nonNegativeNumber(value: unknown, label: string) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} tidak boleh negatif.`);
  return Math.round(number);
}

function inferProductKey(service: string) {
  const normalized = service.toLocaleLowerCase('id-ID');
  if (normalized.includes('preview')) return 'previewPromotor';
  if (normalized.includes('wsl 1')) return 'wsl1';
  if (normalized.includes('wsl 2')) return 'wsl2';
  if (normalized.includes('id') && normalized.includes('alat')) return 'idDanAlat';
  if (normalized.includes('paket promotor')) return 'paketPromotor';
  if (normalized.includes('pasangan')) return 'tesPasangan';
  if (normalized.includes('keluarga')) return 'paketKeluarga';
  if (normalized.includes('sekolah') || normalized.includes('komunitas')) return 'sekolahKomunitas';
  if (normalized.includes('tes')) return 'tesPersonal';
  return 'bantuanTes';
}

function inferLeadType(productKey: string): LeadType {
  return PROMOTER_PRODUCT_KEYS.has(productKey) ? 'promoter_candidate' : 'test_service';
}

function validStatuses(leadType: LeadType): readonly LeadStatus[] {
  return leadType === 'test_service' ? testServiceStatuses : promoterCandidateStatuses;
}

export function sanitizeCampaignValue(value: unknown, max = 120) {
  return compact(value, max).replace(/[<>{}"'`]/g, '');
}

function sanitizeSourcePath(value: unknown) {
  const path = compact(value, 240).replace(/[<>"'`]/g, '');
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

export function normalizePhone(value: unknown) {
  const digits = compact(value, 32).replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

export function validateIdempotencyKey(value: unknown) {
  const key = compact(value, 64).toLowerCase();
  if (!IDEMPOTENCY_PATTERN.test(key)) throw new Error('Identitas formulir tidak valid.');
  return key;
}

export function validateInterestInput(value: unknown): InterestInput {
  if (!value || typeof value !== 'object') throw new Error('Data formulir tidak valid.');
  const data = value as Record<string, unknown>;
  const name = compact(data.name, 120);
  const phone = normalizePhone(data.phone);
  const email = compact(data.email, 160).toLocaleLowerCase('id-ID');
  const provinceCode = compact(data.provinceCode, 16);
  const provinceName = compact(data.provinceName, 100);
  const regencyCode = compact(data.regencyCode, 16);
  const regencyName = compact(data.regencyName, 100);
  const city = compact(data.city || regencyName, 100);
  const service = compact(data.service, 120);
  const productKey = compact(data.productKey, 80) || inferProductKey(service);
  const rawLeadType = compact(data.leadType, 40);
  const leadType: LeadType = rawLeadType === 'promoter_candidate' || rawLeadType === 'test_service'
    ? rawLeadType
    : inferLeadType(productKey);
  const notes = compact(data.notes, 600);
  const sourcePath = sanitizeSourcePath(data.sourcePath);
  const consentToContact = data.consentToContact === true || data.consentToContact === 'on';
  const consentToShare = data.consentToShare === true || data.consentToShare === 'on';

  if (name.length < 3) throw new Error('Nama lengkap minimal 3 karakter.');
  if (phone.length < 10 || phone.length > 15) throw new Error('Nomor WhatsApp belum valid.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email belum valid.');
  if (city.length < 2) throw new Error('Kabupaten/kota atau domisili perlu diisi.');
  if (service.length < 3) throw new Error('Pilih layanan yang diminati.');
  const allowedProducts = leadType === 'test_service' ? TEST_PRODUCT_KEYS : PROMOTER_PRODUCT_KEYS;
  if (!allowedProducts.has(productKey)) throw new Error('Layanan tidak sesuai dengan jenis lead.');
  if (!consentToContact) throw new Error('Persetujuan kontak oleh tim wajib diberikan.');
  if (leadType === 'test_service' && !consentToShare) {
    throw new Error('Persetujuan pembagian terbatas kepada promotor yang ditugaskan wajib diberikan.');
  }

  return {
    leadType,
    productKey,
    name,
    phone,
    email,
    provinceCode,
    provinceName,
    regencyCode,
    regencyName,
    city,
    service,
    notes,
    sourcePath,
    utmSource: sanitizeCampaignValue(data.utmSource ?? data.utm_source),
    utmMedium: sanitizeCampaignValue(data.utmMedium ?? data.utm_medium),
    utmCampaign: sanitizeCampaignValue(data.utmCampaign ?? data.utm_campaign),
    utmContent: sanitizeCampaignValue(data.utmContent ?? data.utm_content),
    utmTerm: sanitizeCampaignValue(data.utmTerm ?? data.utm_term),
    referrer: sanitizeCampaignValue(data.referrer, 240),
    consentToContact,
    consentToShare,
  };
}

export function calculateMargin(input: { saleAmount?: unknown; promoterPayout?: unknown; otherCost?: unknown }) {
  return nonNegativeNumber(input.saleAmount, 'Nilai penjualan')
    - nonNegativeNumber(input.promoterPayout, 'Bagian promotor')
    - nonNegativeNumber(input.otherCost, 'Biaya lain');
}

export function validateLeadAdminUpdate(value: unknown): LeadAdminUpdate {
  if (!value || typeof value !== 'object') throw new Error('Perubahan lead tidak valid.');
  const data = value as Record<string, unknown>;
  const leadType = compact(data.leadType, 40) as LeadType;
  const status = compact(data.status, 40) as LeadStatus;
  if (leadType !== 'test_service' && leadType !== 'promoter_candidate') throw new Error('Jenis lead tidak valid.');
  if (!validStatuses(leadType).includes(status)) throw new Error('Status tidak sesuai dengan jenis lead.');
  const paymentStatus = compact(data.paymentStatus, 40) as PaymentStatus;
  if (paymentStatus && !PAYMENT_STATUSES.has(paymentStatus)) throw new Error('Status pembayaran tidak valid.');
  const scheduledAt = data.scheduledAt ? nullableIsoString(data.scheduledAt) : null;
  if (data.scheduledAt && !scheduledAt) throw new Error('Jadwal tidak valid.');
  return {
    leadType,
    status,
    assignedPromoterCode: compact(data.assignedPromoterCode, 80),
    pic: compact(data.pic, 120),
    scheduledAt,
    internalNotes: compact(data.internalNotes, 2000),
    paymentStatus: paymentStatus || 'belum_dicek',
    sejoliOrderId: compact(data.sejoliOrderId, 120),
    saleAmount: nonNegativeNumber(data.saleAmount, 'Nilai penjualan'),
    promoterPayout: nonNegativeNumber(data.promoterPayout, 'Bagian promotor'),
    otherCost: nonNegativeNumber(data.otherCost, 'Biaya lain'),
  };
}

export async function initializeInterestSchema() {
  if (!globalForInterests.konsepStifinInterestSchema) {
    globalForInterests.konsepStifinInterestSchema = (async () => {
      const sql = getDatabaseClient();
      await sql`CREATE TABLE IF NOT EXISTS public_interest_leads (
        id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL DEFAULT '',
        service TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', source_path TEXT NOT NULL DEFAULT '/',
        status TEXT NOT NULL DEFAULT 'baru', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'test_service'`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS product_key TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS province_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS province_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS regency_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS regency_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS utm_source TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS utm_medium TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS utm_content TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS utm_term TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS referrer TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_to_share BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS response_due_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS assigned_promoter_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS pic TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS match_method TEXT NOT NULL DEFAULT 'none'`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS matched_promoter_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS matched_branch_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS promoter_candidates JSONB NOT NULL DEFAULT '[]'::jsonb`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'belum_dicek'`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS sejoli_order_id TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS sale_amount BIGINT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS promoter_payout BIGINT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS other_cost BIGINT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS payment_checked_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS internal_notes TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS idempotency_key TEXT`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
      await sql`UPDATE public_interest_leads SET status='baru' WHERE status='new'`;
      await sql`UPDATE public_interest_leads SET product_key=CASE
        WHEN LOWER(service) LIKE '%preview%' THEN 'previewPromotor'
        WHEN LOWER(service) LIKE '%wsl 1%' THEN 'wsl1'
        WHEN LOWER(service) LIKE '%wsl 2%' THEN 'wsl2'
        WHEN LOWER(service) LIKE '%id%alat%' THEN 'idDanAlat'
        WHEN LOWER(service) LIKE '%paket promotor%' THEN 'paketPromotor'
        WHEN LOWER(service) LIKE '%pasangan%' THEN 'tesPasangan'
        WHEN LOWER(service) LIKE '%keluarga%' THEN 'paketKeluarga'
        WHEN LOWER(service) LIKE '%sekolah%' OR LOWER(service) LIKE '%komunitas%' THEN 'sekolahKomunitas'
        WHEN LOWER(service) LIKE '%tes%' THEN 'tesPersonal'
        ELSE 'bantuanTes' END WHERE product_key=''`;
      await sql`UPDATE public_interest_leads SET lead_type=CASE
        WHEN product_key IN ('previewPromotor','wsl1','wsl2','idDanAlat','paketPromotor','bantuanPromotor') THEN 'promoter_candidate'
        ELSE 'test_service' END`;
      await sql`UPDATE public_interest_leads SET internal_notes=TRIM(internal_notes || ' Backfill: layanan lama diklasifikasikan sebagai test_service.')
        WHERE product_key='bantuanTes' AND internal_notes NOT LIKE '%Backfill: layanan lama%'`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS public_interest_leads_idempotency_idx ON public_interest_leads(idempotency_key) WHERE idempotency_key IS NOT NULL`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_created_idx ON public_interest_leads(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_pipeline_idx ON public_interest_leads(lead_type, status, created_at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS lead_status_history (
        id BIGSERIAL PRIMARY KEY, lead_id BIGINT NOT NULL REFERENCES public_interest_leads(id) ON DELETE CASCADE,
        old_status TEXT, new_status TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', actor TEXT NOT NULL DEFAULT 'system',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`ALTER TABLE lead_status_history ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'status_change'`;
      await sql`ALTER TABLE lead_status_history ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb`;
    })().catch((error) => {
      globalForInterests.konsepStifinInterestSchema = undefined;
      throw error;
    });
  }
  await globalForInterests.konsepStifinInterestSchema;
}

function mapCandidates(value: unknown): StoredPromoterCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 3).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const code = compact(row.code, 80);
    const name = compact(row.name, 120);
    return code && name ? [{
      code,
      name,
      branchCode: compact(row.branchCode, 80),
      area: compact(row.area, 100),
      province: compact(row.province, 100),
    }] : [];
  });
}

export function mapLead(row: Record<string, unknown>): StoredLead {
  const saleAmount = Number(row.sale_amount ?? 0);
  const promoterPayout = Number(row.promoter_payout ?? 0);
  const otherCost = Number(row.other_cost ?? 0);
  return {
    id: Number(row.id),
    leadType: (row.lead_type === 'promoter_candidate' ? 'promoter_candidate' : 'test_service'),
    productKey: String(row.product_key ?? ''),
    name: String(row.name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    provinceCode: String(row.province_code ?? ''),
    provinceName: String(row.province_name ?? ''),
    regencyCode: String(row.regency_code ?? ''),
    regencyName: String(row.regency_name ?? ''),
    city: String(row.city ?? ''),
    service: String(row.service ?? ''),
    notes: String(row.notes ?? ''),
    sourcePath: String(row.source_path ?? '/'),
    utmSource: String(row.utm_source ?? ''),
    utmMedium: String(row.utm_medium ?? ''),
    utmCampaign: String(row.utm_campaign ?? ''),
    utmContent: String(row.utm_content ?? ''),
    utmTerm: String(row.utm_term ?? ''),
    referrer: String(row.referrer ?? ''),
    consentToContact: Boolean(row.consent_to_contact),
    consentToShare: Boolean(row.consent_to_share),
    status: String(row.status ?? 'baru') as LeadStatus,
    assignedPromoterCode: String(row.assigned_promoter_code ?? ''),
    pic: String(row.pic ?? ''),
    matchMethod: String(row.match_method ?? 'none') as MatchMethod,
    matchedPromoterName: String(row.matched_promoter_name ?? ''),
    matchedBranchCode: String(row.matched_branch_code ?? ''),
    promoterCandidates: mapCandidates(row.promoter_candidates),
    paymentStatus: String(row.payment_status ?? 'belum_dicek') as PaymentStatus,
    sejoliOrderId: String(row.sejoli_order_id ?? ''),
    saleAmount,
    promoterPayout,
    otherCost,
    margin: saleAmount - promoterPayout - otherCost,
    scheduledAt: nullableIsoString(row.scheduled_at),
    paymentCheckedAt: nullableIsoString(row.payment_checked_at),
    internalNotes: String(row.internal_notes ?? ''),
    responseDueAt: isoString(row.response_due_at),
    consentAt: isoString(row.consent_at),
    idempotencyKey: String(row.idempotency_key ?? ''),
    createdAt: isoString(row.created_at),
    updatedAt: isoString(row.updated_at),
  };
}

function defaultStatus(command: CreateInterestLeadCommand): LeadStatus {
  if (command.status && validStatuses(command.interest.leadType).includes(command.status)) return command.status;
  if (command.interest.leadType === 'promoter_candidate') return 'baru';
  return command.match?.assignedPromoterCode ? 'ditawarkan' : 'mencari_promotor';
}

async function createInterestLeadFromCommand(command: CreateInterestLeadCommand): Promise<StoredLead> {
  await initializeInterestSchema();
  const interest = validateInterestInput(command.interest);
  const idempotencyKey = validateIdempotencyKey(command.idempotencyKey);
  const status = defaultStatus({ ...command, interest });
  if (!validStatuses(interest.leadType).includes(status)) throw new Error('Status tidak sesuai dengan jenis lead.');
  const match = interest.leadType === 'test_service' ? command.match : null;
  const candidates = mapCandidates(match?.candidates ?? []);
  const sql = getDatabaseClient();

  return sql.begin(async (transaction) => {
    const inserted = await transaction`INSERT INTO public_interest_leads (
      lead_type, product_key, name, phone, email, province_code, province_name, regency_code, regency_name,
      city, service, notes, source_path, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer,
      status, consent_to_contact, consent_to_share, consent_at, response_due_at, assigned_promoter_code,
      pic, match_method, matched_promoter_name, matched_branch_code, promoter_candidates, idempotency_key
    ) VALUES (
      ${interest.leadType}, ${interest.productKey}, ${interest.name}, ${interest.phone}, ${interest.email},
      ${interest.provinceCode}, ${interest.provinceName}, ${interest.regencyCode}, ${interest.regencyName},
      ${interest.city}, ${interest.service}, ${interest.notes}, ${interest.sourcePath}, ${interest.utmSource},
      ${interest.utmMedium}, ${interest.utmCampaign}, ${interest.utmContent}, ${interest.utmTerm}, ${interest.referrer},
      ${status}, ${interest.consentToContact}, ${interest.consentToShare}, NOW(), NOW() + INTERVAL '2 hours',
      ${match?.assignedPromoterCode ?? ''}, ${interest.leadType === 'promoter_candidate' ? '' : ''},
      ${match?.matchMethod ?? 'none'}, ${match?.matchedPromoterName ?? ''}, ${match?.matchedBranchCode ?? ''},
      ${transaction.json(candidates)}, ${idempotencyKey}
    ) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`;
    const rows = inserted.length
      ? inserted
      : await transaction`SELECT * FROM public_interest_leads WHERE idempotency_key=${idempotencyKey} LIMIT 1`;
    if (!rows.length) throw new Error('Lead belum dapat disimpan.');
    if (inserted.length) {
      await transaction`INSERT INTO lead_status_history (
        lead_id, old_status, new_status, note, actor, event_type, details
      ) VALUES (${rows[0].id}, NULL, ${status}, 'Lead dibuat dari formulir publik', 'system', 'created', ${transaction.json({ leadType: interest.leadType, productKey: interest.productKey })})`;
    }
    return mapLead(rows[0] as Record<string, unknown>);
  });
}

export function createInterestLead(command: CreateInterestLeadCommand): Promise<StoredLead>;
export function createInterestLead(input: InterestInput, status?: LeadStatus): Promise<number>;
export async function createInterestLead(
  input: CreateInterestLeadCommand | InterestInput,
  legacyStatus?: LeadStatus,
): Promise<StoredLead | number> {
  if ('interest' in input) return createInterestLeadFromCommand(input);
  const lead = await createInterestLeadFromCommand({
    interest: input,
    idempotencyKey: crypto.randomUUID(),
    status: legacyStatus,
  });
  return lead.id;
}

export async function getLeadByIdempotencyKey(key: string) {
  await initializeInterestSchema();
  const idempotencyKey = validateIdempotencyKey(key);
  const rows = await getDatabaseClient()`SELECT * FROM public_interest_leads WHERE idempotency_key=${idempotencyKey} LIMIT 1`;
  return rows[0] ? mapLead(rows[0] as Record<string, unknown>) : null;
}

export async function getLeadById(id: number) {
  await initializeInterestSchema();
  if (!Number.isInteger(id) || id < 1) return null;
  const rows = await getDatabaseClient()`SELECT * FROM public_interest_leads WHERE id=${id} LIMIT 1`;
  return rows[0] ? mapLead(rows[0] as Record<string, unknown>) : null;
}

export async function getLeads(filter: { leadType?: LeadType; status?: LeadStatus; limit?: number } | string = {}) {
  await initializeInterestSchema();
  const sql = getDatabaseClient();
  const normalized = typeof filter === 'string' ? { status: filter as LeadStatus } : filter;
  const limit = Math.min(500, Math.max(1, Number(normalized.limit) || 500));
  let rows;
  if (normalized.leadType && normalized.status && validStatuses(normalized.leadType).includes(normalized.status)) {
    rows = await sql`SELECT * FROM public_interest_leads WHERE lead_type=${normalized.leadType} AND status=${normalized.status} ORDER BY created_at DESC LIMIT ${limit}`;
  } else if (normalized.leadType) {
    rows = await sql`SELECT * FROM public_interest_leads WHERE lead_type=${normalized.leadType} ORDER BY created_at DESC LIMIT ${limit}`;
  } else if (normalized.status && leadStatuses.includes(normalized.status)) {
    rows = await sql`SELECT * FROM public_interest_leads WHERE status=${normalized.status} ORDER BY created_at DESC LIMIT ${limit}`;
  } else {
    rows = await sql`SELECT * FROM public_interest_leads ORDER BY created_at DESC LIMIT ${limit}`;
  }
  return rows.map((row) => mapLead(row as Record<string, unknown>));
}

function changed<T>(from: T, to: T) {
  return Object.is(from, to) ? undefined : { from, to };
}

export async function updateLead(id: number, input: Omit<LeadAdminUpdate, 'leadType'> & { leadType?: LeadType }, actor: string) {
  await initializeInterestSchema();
  if (!Number.isInteger(id) || id < 1) throw new Error('Perubahan lead tidak valid.');
  const current = await getLeadById(id);
  if (!current) throw new Error('Lead tidak ditemukan.');
  const update = validateLeadAdminUpdate({ ...input, leadType: current.leadType });
  const details = Object.fromEntries(Object.entries({
    status: changed(current.status, update.status),
    assignedPromoterCode: changed(current.assignedPromoterCode, update.assignedPromoterCode || ''),
    pic: changed(current.pic, update.pic || ''),
    scheduledAt: changed(current.scheduledAt, update.scheduledAt || null),
    internalNotes: changed(current.internalNotes, update.internalNotes || ''),
    paymentStatus: changed(current.paymentStatus, update.paymentStatus || 'belum_dicek'),
    sejoliOrderId: changed(current.sejoliOrderId, update.sejoliOrderId || ''),
    saleAmount: changed(current.saleAmount, update.saleAmount || 0),
    promoterPayout: changed(current.promoterPayout, update.promoterPayout || 0),
    otherCost: changed(current.otherCost, update.otherCost || 0),
  }).filter(([, value]) => value !== undefined));
  const sql = getDatabaseClient();
  await sql.begin(async (transaction) => {
    await transaction`UPDATE public_interest_leads SET
      status=${update.status}, assigned_promoter_code=${update.assignedPromoterCode || ''}, pic=${update.pic || ''},
      scheduled_at=${update.scheduledAt || null}, internal_notes=${update.internalNotes || ''},
      payment_status=${update.paymentStatus || 'belum_dicek'}, sejoli_order_id=${update.sejoliOrderId || ''},
      sale_amount=${update.saleAmount || 0}, promoter_payout=${update.promoterPayout || 0}, other_cost=${update.otherCost || 0},
      payment_checked_at=CASE WHEN payment_status IS DISTINCT FROM ${update.paymentStatus || 'belum_dicek'} THEN NOW() ELSE payment_checked_at END,
      updated_at=NOW() WHERE id=${id}`;
    await transaction`INSERT INTO lead_status_history (
      lead_id, old_status, new_status, note, actor, event_type, details
    ) VALUES (${id}, ${current.status}, ${update.status}, 'Lead diperbarui dari dashboard', ${compact(actor, 160) || 'admin'}, 'admin_update', ${transaction.json(details)})`;
  });
  return getLeadById(id);
}

export async function getLeadHistory(id: number): Promise<LeadHistoryEntry[]> {
  await initializeInterestSchema();
  if (!Number.isInteger(id) || id < 1) return [];
  const rows = await getDatabaseClient()`SELECT id, old_status, new_status, note, actor, event_type, details, created_at
    FROM lead_status_history WHERE lead_id=${id} ORDER BY created_at DESC, id DESC LIMIT 200`;
  return rows.map((row) => ({
    id: Number(row.id),
    oldStatus: row.old_status ? String(row.old_status) : null,
    newStatus: String(row.new_status),
    note: String(row.note ?? ''),
    actor: String(row.actor ?? ''),
    eventType: String(row.event_type ?? 'status_change'),
    details: row.details && typeof row.details === 'object' ? row.details as Record<string, unknown> : {},
    createdAt: isoString(row.created_at),
  }));
}

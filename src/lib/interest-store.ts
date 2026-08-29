import { getDatabaseClient } from '@/lib/article-store';
import type { MatchMethod } from './promoter-domain';

export const leadStatuses = ['baru', 'mencari_promotor', 'ditawarkan', 'diklaim', 'dijadwalkan', 'selesai', 'ditutup'] as const;
export type LeadStatus = typeof leadStatuses[number];
export const paymentStatuses = ['belum_dicek', 'dibayar', 'dibatalkan', 'dikembalikan'] as const;
export type PaymentStatus = typeof paymentStatuses[number];

export type InterestInput = {
  name: string; phone: string; email: string; provinceCode: string; provinceName: string;
  regencyCode: string; regencyName: string; city: string; service: string; productKey: string;
  notes: string; sourcePath: string; consentToContact: boolean; consentToShare: boolean;
};
export type GenericInterestInput = {
  name: string; phone: string; city: string; service: string; notes: string; sourcePath: string;
  consentToContact: boolean; consentToShare: boolean;
};
export type LeadMatchSnapshot = { matchMethod: MatchMethod; assignedPromoterCode: string; matchedPromoterName: string; matchedBranchCode: string };
export type LeadAdminUpdate = {
  status: LeadStatus; assignedPromoterCode: string; scheduledAt: string | null; internalNotes: string;
  paymentStatus: PaymentStatus; sejoliOrderId: string; saleAmount: number; promoterPayout: number; otherCost: number;
};
export type CreateLeadInput = { interest: InterestInput; idempotencyKey: string; status: LeadStatus; match: LeadMatchSnapshot };
export type StoredLead = InterestInput & LeadMatchSnapshot & {
  id: number; idempotencyKey: string; status: LeadStatus; paymentStatus: PaymentStatus; sejoliOrderId: string;
  saleAmount: number; promoterPayout: number; otherCost: number; margin: number; scheduledAt: string | null;
  paymentCheckedAt: string | null; internalNotes: string; responseDueAt: string; consentAt: string; createdAt: string; updatedAt: string;
};

const globalForInterests = globalThis as unknown as { konsepStifinInterestSchema?: Promise<void> };
async function ensureInterestSchema() {
  if (!globalForInterests.konsepStifinInterestSchema) {
    globalForInterests.konsepStifinInterestSchema = (async () => {
      const sql = getDatabaseClient();
      await sql`CREATE TABLE IF NOT EXISTS public_interest_leads (
        id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL DEFAULT '',
        service TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', source_path TEXT NOT NULL DEFAULT '/',
        status TEXT NOT NULL DEFAULT 'baru', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS province_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS province_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS regency_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS regency_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS product_key TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS idempotency_key TEXT`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_to_share BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS response_due_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS assigned_promoter_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS match_method TEXT NOT NULL DEFAULT 'none'`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS matched_promoter_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS matched_branch_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'belum_dicek'`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS sejoli_order_id TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS sale_amount BIGINT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS promoter_payout BIGINT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS other_cost BIGINT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS payment_checked_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS internal_notes TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
      await sql`UPDATE public_interest_leads SET status='baru' WHERE status='new'`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS public_interest_leads_idempotency_idx ON public_interest_leads(idempotency_key) WHERE idempotency_key IS NOT NULL`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_created_idx ON public_interest_leads(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_status_idx ON public_interest_leads(status, created_at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS lead_status_history (
        id BIGSERIAL PRIMARY KEY, lead_id BIGINT NOT NULL REFERENCES public_interest_leads(id) ON DELETE CASCADE,
        old_status TEXT, new_status TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', actor TEXT NOT NULL DEFAULT 'system',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`ALTER TABLE lead_status_history ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'status'`;
      await sql`ALTER TABLE lead_status_history ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb`;
    })().catch((error) => { globalForInterests.konsepStifinInterestSchema = undefined; throw error; });
  }
  await globalForInterests.konsepStifinInterestSchema;
}

function compact(value: unknown, max: number) { return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max); }
export function normalizePhone(value: unknown) { const digits = compact(value, 32).replace(/\D/g, ''); return digits.startsWith('0') ? `62${digits.slice(1)}` : digits; }
function money(value: unknown, label: string) { const parsed = Number(value ?? 0); if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(label + ' tidak boleh negatif.'); return parsed; }
export function calculateMargin(values: Pick<LeadAdminUpdate, 'saleAmount' | 'promoterPayout' | 'otherCost'>) { return values.saleAmount - values.promoterPayout - values.otherCost; }
export function validateIdempotencyKey(value: unknown) {
  const key = compact(value, 64).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key)) throw new Error('Identitas formulir tidak valid.');
  return key;
}
export function validateInterestInput(value: unknown): InterestInput {
  if (!value || typeof value !== 'object') throw new Error('Data formulir tidak valid.');
  const data = value as Record<string, unknown>;
  const name = compact(data.name, 120), phone = normalizePhone(data.phone), email = compact(data.email, 160).toLowerCase();
  const provinceCode = compact(data.provinceCode, 16), provinceName = compact(data.provinceName, 100);
  const regencyCode = compact(data.regencyCode, 16), regencyName = compact(data.regencyName, 100);
  const city = compact(data.city || regencyName, 100), service = compact(data.service, 120), productKey = compact(data.productKey, 80);
  const notes = compact(data.notes, 600), sourcePath = compact(data.sourcePath, 240) || '/';
  const consentToContact = data.consentToContact === true || data.consentToContact === 'on';
  const consentToShare = data.consentToShare === true || data.consentToShare === 'on';
  if (name.length < 3) throw new Error('Nama lengkap minimal 3 karakter.');
  if (phone.length < 10 || phone.length > 15) throw new Error('Nomor WhatsApp belum valid.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email belum valid.');
  if (!provinceCode || !provinceName || !regencyCode || !regencyName) throw new Error('Provinsi dan kabupaten/kota perlu dipilih.');
  if (city.length < 2) throw new Error('Kabupaten/kota atau domisili perlu diisi.');
  if (service.length < 3 || !productKey) throw new Error('Pilih layanan yang diminati.');
  if (!consentToContact || !consentToShare) throw new Error('Persetujuan kontak dan pembagian terbatas wajib diberikan.');
  return { name, phone, email, provinceCode, provinceName, regencyCode, regencyName, city, service, productKey, notes, sourcePath, consentToContact, consentToShare };
}
export function validateGenericInterestInput(value: unknown): GenericInterestInput {
  if (!value || typeof value !== 'object') throw new Error('Data formulir tidak valid.');
  const data = value as Record<string, unknown>;
  const name = compact(data.name, 120), phone = normalizePhone(data.phone), city = compact(data.city, 100);
  const service = compact(data.service, 120), notes = compact(data.notes, 600), sourcePath = compact(data.sourcePath, 240) || '/';
  const consentToContact = data.consentToContact === true || data.consentToContact === 'on';
  const consentToShare = data.consentToShare === true || data.consentToShare === 'on';
  if (name.length < 3) throw new Error('Nama lengkap minimal 3 karakter.');
  if (phone.length < 10 || phone.length > 15) throw new Error('Nomor WhatsApp belum valid.');
  if (city.length < 2) throw new Error('Kabupaten/kota atau domisili perlu diisi.');
  if (service.length < 3) throw new Error('Pilih layanan yang diminati.');
  if (!consentToContact || !consentToShare) throw new Error('Persetujuan kontak dan pembagian terbatas wajib diberikan.');
  return { name, phone, city, service, notes, sourcePath, consentToContact, consentToShare };
}
export function validateLeadAdminUpdate(value: unknown): LeadAdminUpdate {
  if (!value || typeof value !== 'object') throw new Error('Perubahan lead tidak valid.');
  const data = value as Record<string, unknown>;
  const status = compact(data.status, 40) as LeadStatus, paymentStatus = compact(data.paymentStatus, 40) as PaymentStatus;
  if (!leadStatuses.includes(status)) throw new Error('Status lead tidak valid.');
  if (!paymentStatuses.includes(paymentStatus)) throw new Error('Status pembayaran tidak valid.');
  const scheduledAt = data.scheduledAt ? new Date(String(data.scheduledAt)) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.valueOf())) throw new Error('Jadwal tidak valid.');
  return { status, assignedPromoterCode: compact(data.assignedPromoterCode, 80).toUpperCase(), scheduledAt: scheduledAt?.toISOString() ?? null,
    internalNotes: compact(data.internalNotes, 2_000), paymentStatus, sejoliOrderId: compact(data.sejoliOrderId, 120),
    saleAmount: money(data.saleAmount, 'Nilai penjualan'), promoterPayout: money(data.promoterPayout, 'Bagian promotor'), otherCost: money(data.otherCost, 'Biaya lain') };
}
function dateValue(value: unknown) { return value ? new Date(String(value)).toISOString() : ''; }
export function mapLead(row: Record<string, unknown>): StoredLead {
  const amounts = { saleAmount: money(row.sale_amount, 'Nilai penjualan'), promoterPayout: money(row.promoter_payout, 'Bagian promotor'), otherCost: money(row.other_cost, 'Biaya lain') };
  return { id: Number(row.id), name: String(row.name), phone: String(row.phone), email: String(row.email), provinceCode: String(row.province_code),
    provinceName: String(row.province_name), regencyCode: String(row.regency_code), regencyName: String(row.regency_name), city: String(row.city),
    service: String(row.service), productKey: String(row.product_key), notes: String(row.notes), sourcePath: String(row.source_path),
    consentToContact: Boolean(row.consent_to_contact), consentToShare: Boolean(row.consent_to_share), idempotencyKey: String(row.idempotency_key ?? ''),
    status: row.status as LeadStatus, assignedPromoterCode: String(row.assigned_promoter_code), matchMethod: row.match_method as MatchMethod,
    matchedPromoterName: String(row.matched_promoter_name), matchedBranchCode: String(row.matched_branch_code), paymentStatus: row.payment_status as PaymentStatus,
    sejoliOrderId: String(row.sejoli_order_id), ...amounts, margin: calculateMargin(amounts), scheduledAt: row.scheduled_at ? dateValue(row.scheduled_at) : null,
    paymentCheckedAt: row.payment_checked_at ? dateValue(row.payment_checked_at) : null, internalNotes: String(row.internal_notes),
    responseDueAt: dateValue(row.response_due_at), consentAt: dateValue(row.consent_at), createdAt: dateValue(row.created_at), updatedAt: dateValue(row.updated_at) };
}

export async function createInterestLead(input: CreateLeadInput) {
  await ensureInterestSchema(); const sql = getDatabaseClient();
  const rows = await sql`INSERT INTO public_interest_leads (
    name, phone, email, province_code, province_name, regency_code, regency_name, city, service, product_key, notes, source_path,
    status, consent_to_contact, consent_to_share, consent_at, response_due_at, idempotency_key,
    assigned_promoter_code, match_method, matched_promoter_name, matched_branch_code
  ) VALUES (${input.interest.name}, ${input.interest.phone}, ${input.interest.email}, ${input.interest.provinceCode}, ${input.interest.provinceName},
    ${input.interest.regencyCode}, ${input.interest.regencyName}, ${input.interest.city}, ${input.interest.service}, ${input.interest.productKey},
    ${input.interest.notes}, ${input.interest.sourcePath}, ${input.status}, ${input.interest.consentToContact}, ${input.interest.consentToShare},
    NOW(), NOW() + INTERVAL '2 hours', ${input.idempotencyKey}, ${input.match.assignedPromoterCode}, ${input.match.matchMethod},
    ${input.match.matchedPromoterName}, ${input.match.matchedBranchCode})
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING RETURNING *`;
  const row = rows[0] ?? (await sql`SELECT * FROM public_interest_leads WHERE idempotency_key=${input.idempotencyKey} LIMIT 1`)[0];
  if (!row) throw new Error('Lead belum dapat disimpan.');
  if (rows[0]) await sql`INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor, event_type, details)
    VALUES (${row.id}, NULL, ${input.status}, 'Lead dibuat dari formulir publik', 'system', 'created', ${sql.json({ matchMethod: input.match.matchMethod })})`;
  return mapLead(row as Record<string, unknown>);
}
export async function createGenericInterestLead(input: GenericInterestInput) {
  await ensureInterestSchema(); const sql = getDatabaseClient();
  const rows = await sql`INSERT INTO public_interest_leads (
    name, phone, city, service, notes, source_path, status, consent_to_contact, consent_to_share, consent_at, response_due_at
  ) VALUES (${input.name}, ${input.phone}, ${input.city}, ${input.service}, ${input.notes}, ${input.sourcePath}, 'baru',
    ${input.consentToContact}, ${input.consentToShare}, NOW(), NOW() + INTERVAL '2 hours') RETURNING id`;
  const id = Number(rows[0].id);
  await sql`INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor, event_type, details)
    VALUES (${id}, NULL, 'baru', 'Lead dibuat dari formulir publik', 'system', 'created', ${sql.json({ flow: 'generic' })})`;
  return id;
}
export async function getLeadByIdempotencyKey(key: string) {
  await ensureInterestSchema(); const rows = await getDatabaseClient()`SELECT * FROM public_interest_leads WHERE idempotency_key=${validateIdempotencyKey(key)} LIMIT 1`;
  return rows[0] ? mapLead(rows[0] as Record<string, unknown>) : null;
}
export async function getLeads(status?: string) {
  await ensureInterestSchema(); const sql = getDatabaseClient();
  const rows = status && leadStatuses.includes(status as LeadStatus) ? await sql`SELECT * FROM public_interest_leads WHERE status=${status} ORDER BY created_at DESC LIMIT 500`
    : await sql`SELECT * FROM public_interest_leads ORDER BY created_at DESC LIMIT 500`;
  return rows.map((row) => mapLead(row as Record<string, unknown>));
}
export async function updateLead(id: number, input: LeadAdminUpdate, actor: string) {
  await ensureInterestSchema(); if (!Number.isInteger(id) || id < 1) throw new Error('Perubahan lead tidak valid.');
  const sql = getDatabaseClient();
  return sql.begin(async (transaction) => {
    const currentRows = await transaction`SELECT * FROM public_interest_leads WHERE id=${id} FOR UPDATE`;
    if (!currentRows[0]) throw new Error('Lead tidak ditemukan.');
    const before = mapLead(currentRows[0] as Record<string, unknown>);
    const rows = await transaction`UPDATE public_interest_leads SET status=${input.status}, assigned_promoter_code=${input.assignedPromoterCode},
      scheduled_at=${input.scheduledAt}, internal_notes=${input.internalNotes}, payment_checked_at=CASE WHEN payment_status <> ${input.paymentStatus} THEN NOW() ELSE payment_checked_at END,
      payment_status=${input.paymentStatus}, sejoli_order_id=${input.sejoliOrderId}, sale_amount=${input.saleAmount}, promoter_payout=${input.promoterPayout}, other_cost=${input.otherCost}, updated_at=NOW()
      WHERE id=${id} RETURNING *`;
    const compared = { status: { from: before.status, to: input.status }, assignedPromoterCode: { from: before.assignedPromoterCode, to: input.assignedPromoterCode },
      paymentStatus: { from: before.paymentStatus, to: input.paymentStatus }, sejoliOrderId: { from: before.sejoliOrderId, to: input.sejoliOrderId },
      saleAmount: { from: before.saleAmount, to: input.saleAmount }, promoterPayout: { from: before.promoterPayout, to: input.promoterPayout },
      otherCost: { from: before.otherCost, to: input.otherCost }, scheduledAt: { from: before.scheduledAt, to: input.scheduledAt } };
    const details = Object.fromEntries(Object.entries(compared).filter(([, change]) => change.from !== change.to));
    await transaction`INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor, event_type, details)
      VALUES (${id}, ${before.status}, ${input.status}, 'Lead diperbarui dari dashboard', ${compact(actor, 160)}, 'admin_update', ${transaction.json(details)})`;
    return mapLead(rows[0] as Record<string, unknown>);
  });
}

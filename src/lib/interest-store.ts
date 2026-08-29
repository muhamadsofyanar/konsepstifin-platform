import { getDatabaseClient } from '@/lib/article-store';

export const leadStatuses = ['baru', 'mencari_promotor', 'ditawarkan', 'diklaim', 'dijadwalkan', 'selesai', 'ditutup'] as const;
export type LeadStatus = typeof leadStatuses[number];

export type InterestInput = {
  name: string; phone: string; provinceCode: string; provinceName: string;
  regencyCode: string; regencyName: string; city: string; service: string;
  notes: string; sourcePath: string; consentToContact: boolean; consentToShare: boolean;
};

export type StoredLead = InterestInput & {
  id: number; status: LeadStatus; assignedPromoterCode: string; scheduledAt: string | null;
  internalNotes: string; responseDueAt: string; consentAt: string; createdAt: string; updatedAt: string;
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
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_to_contact BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_to_share BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS response_due_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS assigned_promoter_code TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS internal_notes TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
      await sql`UPDATE public_interest_leads SET status='baru' WHERE status='new'`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_created_idx ON public_interest_leads(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_status_idx ON public_interest_leads(status, created_at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS lead_status_history (
        id BIGSERIAL PRIMARY KEY, lead_id BIGINT NOT NULL REFERENCES public_interest_leads(id) ON DELETE CASCADE,
        old_status TEXT, new_status TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', actor TEXT NOT NULL DEFAULT 'system',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    })().catch((error) => { globalForInterests.konsepStifinInterestSchema = undefined; throw error; });
  }
  await globalForInterests.konsepStifinInterestSchema;
}

function compact(value: unknown, max: number) { return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max); }

export function normalizePhone(value: unknown) {
  const digits = compact(value, 32).replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

export function validateInterestInput(value: unknown): InterestInput {
  if (!value || typeof value !== 'object') throw new Error('Data formulir tidak valid.');
  const data = value as Record<string, unknown>;
  const name = compact(data.name, 120); const phone = normalizePhone(data.phone);
  const provinceCode = compact(data.provinceCode, 16); const provinceName = compact(data.provinceName, 100);
  const regencyCode = compact(data.regencyCode, 16); const regencyName = compact(data.regencyName, 100);
  const city = compact(data.city || regencyName, 100); const service = compact(data.service, 120);
  const notes = compact(data.notes, 600); const sourcePath = compact(data.sourcePath, 240) || '/';
  const consentToContact = data.consentToContact === true || data.consentToContact === 'on';
  const consentToShare = data.consentToShare === true || data.consentToShare === 'on';
  if (name.length < 3) throw new Error('Nama lengkap minimal 3 karakter.');
  if (phone.length < 10 || phone.length > 15) throw new Error('Nomor WhatsApp belum valid.');
  if (city.length < 2) throw new Error('Kabupaten/kota atau domisili perlu diisi.');
  if (service.length < 3) throw new Error('Pilih layanan yang diminati.');
  if (!consentToContact || !consentToShare) throw new Error('Persetujuan penggunaan dan pembagian terbatas nomor WhatsApp wajib diberikan.');
  return { name, phone, provinceCode, provinceName, regencyCode, regencyName, city, service, notes, sourcePath, consentToContact, consentToShare };
}

export async function createInterestLead(input: InterestInput, status: LeadStatus = 'mencari_promotor') {
  await ensureInterestSchema();
  const sql = getDatabaseClient();
  const rows = await sql`INSERT INTO public_interest_leads (
    name, phone, province_code, province_name, regency_code, regency_name, city, service, notes, source_path,
    status, consent_to_contact, consent_to_share, consent_at, response_due_at
  ) VALUES (${input.name}, ${input.phone}, ${input.provinceCode}, ${input.provinceName}, ${input.regencyCode},
    ${input.regencyName}, ${input.city}, ${input.service}, ${input.notes}, ${input.sourcePath}, ${status},
    ${input.consentToContact}, ${input.consentToShare}, NOW(), NOW() + INTERVAL '2 hours') RETURNING id`;
  const id = Number(rows[0].id);
  await sql`INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor) VALUES (${id}, NULL, ${status}, 'Lead dibuat dari formulir publik', 'system')`;
  return id;
}

function mapLead(row: Record<string, unknown>): StoredLead {
  return { id: Number(row.id), name: String(row.name), phone: String(row.phone), provinceCode: String(row.province_code),
    provinceName: String(row.province_name), regencyCode: String(row.regency_code), regencyName: String(row.regency_name),
    city: String(row.city), service: String(row.service), notes: String(row.notes), sourcePath: String(row.source_path),
    consentToContact: Boolean(row.consent_to_contact), consentToShare: Boolean(row.consent_to_share),
    status: row.status as LeadStatus, assignedPromoterCode: String(row.assigned_promoter_code),
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null, internalNotes: String(row.internal_notes),
    responseDueAt: String(row.response_due_at ?? ''), consentAt: String(row.consent_at ?? ''),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}

export async function getLeads(status?: string) {
  await ensureInterestSchema(); const sql = getDatabaseClient();
  const rows = status && leadStatuses.includes(status as LeadStatus)
    ? await sql`SELECT * FROM public_interest_leads WHERE status=${status} ORDER BY created_at DESC LIMIT 500`
    : await sql`SELECT * FROM public_interest_leads ORDER BY created_at DESC LIMIT 500`;
  return rows.map((row) => mapLead(row as Record<string, unknown>));
}

export async function updateLead(id: number, input: { status: LeadStatus; assignedPromoterCode?: string; scheduledAt?: string | null; internalNotes?: string }, actor: string) {
  await ensureInterestSchema();
  if (!Number.isInteger(id) || id < 1 || !leadStatuses.includes(input.status)) throw new Error('Perubahan lead tidak valid.');
  const sql = getDatabaseClient(); const current = await sql`SELECT status FROM public_interest_leads WHERE id=${id} LIMIT 1`;
  if (!current.length) throw new Error('Lead tidak ditemukan.');
  const oldStatus = String(current[0].status);
  await sql`UPDATE public_interest_leads SET status=${input.status}, assigned_promoter_code=${compact(input.assignedPromoterCode, 80)}, scheduled_at=${input.scheduledAt || null}, internal_notes=${compact(input.internalNotes, 2000)}, updated_at=NOW() WHERE id=${id}`;
  if (oldStatus !== input.status) await sql`INSERT INTO lead_status_history (lead_id, old_status, new_status, note, actor) VALUES (${id}, ${oldStatus}, ${input.status}, 'Status diperbarui dari dashboard', ${actor})`;
}

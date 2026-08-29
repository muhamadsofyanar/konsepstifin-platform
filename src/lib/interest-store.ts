import { getDatabaseClient } from '@/lib/article-store';

export type InterestInput = {
  name: string;
  phone: string;
  city: string;
  service: string;
  notes: string;
  sourcePath: string;
};

export const leadStatuses = ['new', 'contacted', 'qualified', 'converted', 'closed'] as const;
export type LeadStatus = typeof leadStatuses[number];

export type InterestLead = InterestInput & {
  id: number;
  status: LeadStatus;
  assignedTo: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadAdminUpdate = Pick<InterestLead, 'status' | 'assignedTo' | 'adminNotes'>;

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
          status TEXT NOT NULL DEFAULT 'new',
          assigned_to TEXT NOT NULL DEFAULT '',
          admin_notes TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS assigned_to TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS admin_notes TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE public_interest_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_created_idx ON public_interest_leads(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_status_idx ON public_interest_leads(status, created_at DESC)`;
    })().catch((error) => {
      globalForInterests.konsepStifinInterestSchema = undefined;
      throw error;
    });
  }
  await globalForInterests.konsepStifinInterestSchema;
}

function rowToLead(row: Record<string, unknown>): InterestLead {
  const status = leadStatuses.includes(row.status as LeadStatus) ? row.status as LeadStatus : 'new';
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    phone: String(row.phone ?? ''),
    city: String(row.city ?? ''),
    service: String(row.service ?? ''),
    notes: String(row.notes ?? ''),
    sourcePath: String(row.source_path ?? '/'),
    status,
    assignedTo: String(row.assigned_to ?? ''),
    adminNotes: String(row.admin_notes ?? ''),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at ?? row.created_at)).toISOString(),
  };
}

function compact(value: unknown, max: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function validateInterestInput(value: unknown): InterestInput {
  if (!value || typeof value !== 'object') throw new Error('Data formulir tidak valid.');
  const data = value as Record<string, unknown>;
  const name = compact(data.name, 120);
  const phone = compact(data.phone, 32).replace(/[^0-9+() -]/g, '');
  const city = compact(data.city, 100);
  const service = compact(data.service, 120);
  const notes = compact(data.notes, 600);
  const sourcePath = compact(data.sourcePath, 240) || '/';
  if (name.length < 3) throw new Error('Nama lengkap minimal 3 karakter.');
  if (phone.replace(/\D/g, '').length < 9) throw new Error('Nomor WhatsApp belum lengkap.');
  if (city.length < 2) throw new Error('Kota atau domisili perlu diisi.');
  if (service.length < 3) throw new Error('Pilih layanan yang diminati.');
  return { name, phone, city, service, notes, sourcePath };
}

export async function createInterestLead(input: InterestInput) {
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`
    INSERT INTO public_interest_leads (name, phone, city, service, notes, source_path)
    VALUES (${input.name}, ${input.phone}, ${input.city}, ${input.service}, ${input.notes}, ${input.sourcePath})
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function getLeads(): Promise<InterestLead[]> {
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`
    SELECT id, name, phone, city, service, notes, source_path, status,
           assigned_to, admin_notes, created_at, updated_at
    FROM public_interest_leads
    ORDER BY created_at DESC, id DESC
  `;
  return rows.map((row) => rowToLead(row));
}

export function validateLeadAdminUpdate(value: unknown): LeadAdminUpdate {
  if (!value || typeof value !== 'object') throw new Error('Perubahan lead tidak valid.');
  const data = value as Record<string, unknown>;
  const status = compact(data.status, 20) as LeadStatus;
  if (!leadStatuses.includes(status)) throw new Error('Status lead tidak valid.');
  return {
    status,
    assignedTo: compact(data.assignedTo, 160),
    adminNotes: compact(data.adminNotes, 2_000),
  };
}

export async function updateLead(id: number, input: LeadAdminUpdate): Promise<InterestLead | undefined> {
  if (!Number.isInteger(id) || id <= 0) throw new Error('ID lead tidak valid.');
  await ensureInterestSchema();
  const rows = await getDatabaseClient()`
    UPDATE public_interest_leads
    SET status = ${input.status},
        assigned_to = ${input.assignedTo},
        admin_notes = ${input.adminNotes},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, phone, city, service, notes, source_path, status,
              assigned_to, admin_notes, created_at, updated_at
  `;
  return rows[0] ? rowToLead(rows[0]) : undefined;
}

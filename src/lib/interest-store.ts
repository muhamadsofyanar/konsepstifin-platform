import { getDatabaseClient } from '@/lib/article-store';

export type InterestInput = {
  name: string;
  phone: string;
  city: string;
  service: string;
  notes: string;
  sourcePath: string;
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
          status TEXT NOT NULL DEFAULT 'new',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS public_interest_leads_created_idx ON public_interest_leads(created_at DESC)`;
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

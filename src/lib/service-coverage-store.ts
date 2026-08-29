import { databaseConfigured, getDatabaseClient } from '@/lib/article-store';

export type ServiceCoverageOverride = {
  regionCode: string;
  serviceable: boolean;
  evidenceNote: string;
  updatedAt: string;
};

const SERVICE_REGION_PATTERN = /^\d{2}\.\d{2}(?:\.\d{2})?$/;
let schemaPromise: Promise<void> | undefined;

function normalizeRegionCode(value: unknown) {
  const code = String(value ?? '').trim();
  if (!SERVICE_REGION_PATTERN.test(code)) {
    throw new Error('Kode wilayah layanan harus berupa kabupaten/kota atau kecamatan yang valid.');
  }
  return code;
}

function normalizeEvidence(value: unknown, serviceable: boolean) {
  const evidenceNote = String(value ?? '').replace(/\s+/g, ' ').trim();
  if ((serviceable && (evidenceNote.length < 10 || evidenceNote.length > 500))
    || (!serviceable && evidenceNote.length > 500)) {
    throw new Error('Bukti layanan harus berisi 10-500 karakter.');
  }
  return evidenceNote;
}

async function ensureSchema() {
  if (!databaseConfigured()) throw new Error('DATABASE_URL belum dikonfigurasi.');
  schemaPromise ??= getDatabaseClient()`CREATE TABLE IF NOT EXISTS public_serviceable_regions (
    region_code TEXT PRIMARY KEY,
    serviceable BOOLEAN NOT NULL,
    evidence_note TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`.then(() => undefined).catch((error) => {
    schemaPromise = undefined;
    throw error;
  });
  await schemaPromise;
}

function mapRow(row: Record<string, unknown>): ServiceCoverageOverride {
  return {
    regionCode: String(row.region_code),
    serviceable: Boolean(row.serviceable),
    evidenceNote: String(row.evidence_note ?? ''),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function getServiceCoverageOverride(
  regionCode: string,
): Promise<ServiceCoverageOverride | null> {
  const code = normalizeRegionCode(regionCode);
  if (!databaseConfigured()) return null;
  await ensureSchema();
  const rows = await getDatabaseClient()`SELECT region_code, serviceable, evidence_note, updated_at FROM public_serviceable_regions WHERE region_code = ${code} LIMIT 1`;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getServiceCoverageOverrides(): Promise<ServiceCoverageOverride[]> {
  if (!databaseConfigured()) return [];
  await ensureSchema();
  const rows = await getDatabaseClient()`SELECT region_code, serviceable, evidence_note, updated_at
    FROM public_serviceable_regions ORDER BY region_code`;
  return rows.map((row) => mapRow(row));
}

export async function setServiceCoverageOverride(input: {
  regionCode: string;
  serviceable: boolean;
  evidenceNote: string;
}): Promise<ServiceCoverageOverride> {
  const regionCode = normalizeRegionCode(input.regionCode);
  const serviceable = Boolean(input.serviceable);
  const evidenceNote = normalizeEvidence(input.evidenceNote, serviceable);
  await ensureSchema();
  const rows = await getDatabaseClient()`INSERT INTO public_serviceable_regions (region_code, serviceable, evidence_note)
    VALUES (${regionCode}, ${serviceable}, ${evidenceNote})
    ON CONFLICT (region_code) DO UPDATE SET serviceable=EXCLUDED.serviceable, evidence_note=EXCLUDED.evidence_note, updated_at=NOW()
    RETURNING region_code, serviceable, evidence_note, updated_at`;
  return mapRow(rows[0]);
}

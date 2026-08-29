import { databaseConfigured, getDatabaseClient } from '@/lib/article-store';

export type PublicPromoter = {
  code: string;
  name: string;
  branchCode: string;
  active: boolean;
  menerimaKunjungan: boolean;
  whatsapp?: string;
  regionCodes: string[];
};

function normalize(value: unknown) { return String(value ?? '').trim(); }
function truthy(value: unknown) { return ['1', 'true', 'ya', 'yes', 'aktif'].includes(normalize(value).toLowerCase()); }

let schemaPromise: Promise<void> | undefined;
async function ensureSchema() {
  if (!databaseConfigured()) return;
  schemaPromise ??= getDatabaseClient()`CREATE TABLE IF NOT EXISTS public_promoter_regions (
    promoter_code TEXT PRIMARY KEY,
    region_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`.then(() => undefined).catch((error) => { schemaPromise = undefined; throw error; });
  await schemaPromise;
}

async function loadRegionMappings() {
  if (!databaseConfigured()) return {} as Record<string, string[]>;
  try {
    await ensureSchema();
    const rows = await getDatabaseClient()`SELECT promoter_code, region_codes FROM public_promoter_regions`;
    return Object.fromEntries(rows.map((row) => [String(row.promoter_code), Array.isArray(row.region_codes) ? row.region_codes.map(String) : []]));
  } catch (error) { console.error('Promoter mapping fallback', error); return {}; }
}

export async function getPublicPromoters(region?: string): Promise<PublicPromoter[]> {
  const base = process.env.STIFIN_API_BASE || 'https://apro.stifin.id/api';
  const branch = normalize(process.env.STIFIN_BRANCH_CODE).toUpperCase();
  let rows: unknown[] = [];
  let sourceBranch = branch;
  const manual = normalize(process.env.STIFIN_PROMOTERS_JSON);
  if (manual) {
    try {
      const parsed: unknown = JSON.parse(manual);
      rows = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' && 'data' in parsed && Array.isArray(parsed.data) ? parsed.data : []);
      sourceBranch = 'manual';
    } catch { rows = []; }
  } else if (branch) {
    const response = await fetch(`${base.replace(/\/$/, '')}/proGetCab/pro/${encodeURIComponent(branch)}`, {
      headers: { accept: 'application/json' }, next: { revalidate: 300, tags: [`promoters:${branch}`] }, signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Promotor upstream HTTP ${response.status}.`);
    const body: unknown = await response.json();
    rows = body && typeof body === 'object' && 'data' in body && Array.isArray(body.data) ? body.data : [];
  }
  let regionMap: Record<string, string[]> = {};
  try { regionMap = JSON.parse(process.env.STIFIN_PROMOTER_REGION_MAP || '{}') as Record<string, string[]>; } catch { regionMap = {}; }
  regionMap = { ...regionMap, ...(await loadRegionMappings()) };
  const publicWhatsapp = process.env.STIFIN_PUBLIC_WHATSAPP === 'true';
  return rows.flatMap((row: unknown) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>;
    const code = normalize(item.KodeID ?? item.kode ?? item.code).toUpperCase();
    const name = normalize(item.Nama ?? item.nama ?? item.name);
    if (!code || !name) return [];
    const regionCodes = Array.isArray(regionMap[code]) ? regionMap[code].map(String).filter(Boolean) : [];
    if (region && !regionCodes.some((codeValue) => region === codeValue || region.startsWith(`${codeValue}.`))) return [];
    const phone = normalize(item.Telepon ?? item.NoHP ?? item.phone).replace(/[^\d+]/g, '');
    return [{ code, name, branchCode: normalize(item.KodeCabang ?? item.branchCode) || sourceBranch, active: truthy(item.Aktif ?? item.active ?? true), menerimaKunjungan: truthy(item.MenerimaKunjungan ?? item.menerima_kunjungan ?? true), ...(publicWhatsapp && phone ? { whatsapp: phone } : {}), regionCodes }];
  });
}

export async function getServedRegionCodes() {
  const promoters = await getPublicPromoters();
  return [...new Set(promoters.filter((promoter) => promoter.active && promoter.regionCodes.length > 0).flatMap((promoter) => promoter.regionCodes))];
}

export async function setPromoterRegionMapping(code: string, regionCodes: string[]) {
  if (!databaseConfigured()) throw new Error('DATABASE_URL belum dikonfigurasi.');
  await ensureSchema();
  const promoterCode = normalize(code).toUpperCase();
  const values = [...new Set(regionCodes.map((value) => normalize(value)).filter((value) => /^\d{2}(?:\.\d{2}){0,3}$/.test(value)))].slice(0, 200);
  if (!promoterCode) throw new Error('Kode promotor wajib diisi.');
  await getDatabaseClient()`INSERT INTO public_promoter_regions (promoter_code, region_codes) VALUES (${promoterCode}, ${getDatabaseClient().json(values)}) ON CONFLICT (promoter_code) DO UPDATE SET region_codes=EXCLUDED.region_codes, updated_at=NOW()`;
  return { code: promoterCode, regionCodes: values };
}

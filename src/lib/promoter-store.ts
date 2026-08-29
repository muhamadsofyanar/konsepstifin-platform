import { databaseConfigured, getDatabaseClient } from '@/lib/article-store';

export type PublicPromoter = {
  code: string;
  name: string;
  branchCode: string;
  active: boolean;
  menerimaKunjungan: boolean;
  regionCodes: string[];
};

function normalize(value: unknown) { return String(value ?? '').trim(); }
function truthy(value: unknown) { return ['1', 'true', 'ya', 'yes', 'aktif'].includes(normalize(value).toLowerCase()); }
function regionCodeList(value: unknown) {
  const values = Array.isArray(value) ? value : normalize(value).split(/[;,\s]+/);
  return [...new Set(values.map(String).map((item) => item.trim()).filter((item) => /^\d{2}(?:\.\d{2}){0,3}$/.test(item)))];
}
function regionMatches(requested: string, mapped: string) {
  return requested === mapped || requested.startsWith(`${mapped}.`) || mapped.startsWith(`${requested}.`);
}

export function promoterSourceStatus() {
  const manual = Boolean(normalize(process.env.STIFIN_PROMOTERS_JSON));
  const branchCount = [...new Set((process.env.STIFIN_BRANCH_CODES || process.env.STIFIN_BRANCH_CODE || '')
    .split(',').map((item) => normalize(item).toUpperCase()).filter(Boolean))].length;
  return {
    configured: manual || branchCount > 0,
    source: manual ? 'manual' as const : branchCount > 0 ? 'stifin-api' as const : 'none' as const,
    branchCount,
  };
}

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
  const branches = [...new Set((process.env.STIFIN_BRANCH_CODES || process.env.STIFIN_BRANCH_CODE || '').split(',').map((item) => normalize(item).toUpperCase()).filter(Boolean))];
  let rows: unknown[] = [];
  let sourceBranch = branches.join(',');
  const manual = normalize(process.env.STIFIN_PROMOTERS_JSON);
  if (manual) {
    try {
      const parsed: unknown = JSON.parse(manual);
      rows = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' && 'data' in parsed && Array.isArray(parsed.data) ? parsed.data : []);
      sourceBranch = 'manual';
    } catch { rows = []; }
  } else if (branches.length) {
    const responses = await Promise.allSettled(branches.map(async (branch) => {
      const authHeader = normalize(process.env.STIFIN_API_AUTH_HEADER);
      const authValue = normalize(process.env.STIFIN_API_AUTH_VALUE);
      const headers: Record<string, string> = { accept: 'application/json' };
      if (authHeader && authValue && /^[A-Za-z0-9-]+$/.test(authHeader)) headers[authHeader] = authValue;
      const response = await fetch(`${base.replace(/\/$/, '')}/proGetCab/pro/${encodeURIComponent(branch)}`, {
        headers, next: { revalidate: 300, tags: [`promoters:${branch}`] }, signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`Promotor upstream HTTP ${response.status}.`);
      const body: unknown = await response.json();
      return body && typeof body === 'object' && 'data' in body && Array.isArray(body.data) ? body.data.map((item) => ({ ...(item as object), __branch: branch })) : [];
    }));
    rows = responses.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    if (!rows.length && responses.some((result) => result.status === 'rejected')) throw new Error('Sumber promotor nasional sedang tidak tersedia.');
  }
  let regionMap: Record<string, string[]> = {};
  try { regionMap = JSON.parse(process.env.STIFIN_PROMOTER_REGION_MAP || '{}') as Record<string, string[]>; } catch { regionMap = {}; }
  regionMap = { ...regionMap, ...(await loadRegionMappings()) };
  const sanitized = rows.flatMap((row: unknown) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>;
    const code = normalize(item.KodeID ?? item.kode ?? item.code).toUpperCase();
    const name = normalize(item.Nama ?? item.nama ?? item.name);
    if (!code || !name) return [];
    const rowRegionCodes = regionCodeList(item.regionCodes ?? item.RegionCodes ?? item.region_codes);
    const regionCodes = regionCodeList(Array.isArray(regionMap[code]) && regionMap[code].length ? regionMap[code] : rowRegionCodes);
    if (region && !regionCodes.some((codeValue) => regionMatches(region, codeValue))) return [];
    return [{ code, name, branchCode: normalize(item.KodeCabang ?? item.branchCode ?? item.__branch) || sourceBranch, active: truthy(item.Aktif ?? item.active ?? true), menerimaKunjungan: truthy(item.MenerimaKunjungan ?? item.menerima_kunjungan ?? true), regionCodes }];
  });
  return [...new Map(sanitized.map((item) => [item.code, item])).values()];
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

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

type PromoterMode = 'auto' | 'national' | 'branch' | 'manual' | 'invalid';

function promoterRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const object = value as Record<string, unknown>;
  if (Array.isArray(object.data)) return object.data;
  if (object.data && typeof object.data === 'object') return promoterRows(object.data);
  return [];
}

function promoterConfiguration() {
  const rawMode = normalize(process.env.STIFIN_PROMOTER_MODE).toLowerCase();
  const mode: PromoterMode = !rawMode ? 'auto'
    : ['national', 'branch', 'manual'].includes(rawMode) ? rawMode as PromoterMode : 'invalid';
  const multipleBranches = process.env.STIFIN_BRANCH_CODES || '';
  const singleBranch = normalize(process.env.STIFIN_BRANCH_CODE).toUpperCase();
  const listedBranches = multipleBranches.split(',').map((item) => normalize(item).toUpperCase()).filter(Boolean);
  const branches = mode === 'branch'
    ? [...new Set([singleBranch || listedBranches[0]].filter(Boolean))]
    : [...new Set([...listedBranches, singleBranch].filter(Boolean))];
  const manual = normalize(process.env.STIFIN_PROMOTERS_JSON);
  const nationalPath = normalize(process.env.STIFIN_PROMOTER_NATIONAL_PATH);
  const source = manual && (mode === 'manual' || mode === 'auto') ? 'manual'
    : mode === 'national' ? nationalPath ? 'stifin-national-endpoint' : 'stifin-national-branches'
      : branches.length ? 'stifin-branch' : 'none';
  const configured = mode !== 'invalid' && (
    source === 'manual' || source === 'stifin-national-endpoint' || branches.length > 0
  );
  let message = '';
  if (mode === 'invalid') message = 'STIFIN_PROMOTER_MODE harus national, branch, atau manual.';
  else if (mode === 'national' && !nationalPath && !branches.length) message = 'Mode national membutuhkan STIFIN_BRANCH_CODES atau STIFIN_PROMOTER_NATIONAL_PATH resmi.';
  else if (mode === 'branch' && !branches.length) message = 'Mode branch membutuhkan STIFIN_BRANCH_CODE.';
  else if (mode === 'manual' && !manual) message = 'Mode manual membutuhkan STIFIN_PROMOTERS_JSON.';
  return { mode, branches, manual, nationalPath, source, configured, message };
}

export function promoterSourceStatus() {
  const config = promoterConfiguration();
  return {
    configured: config.configured,
    mode: config.mode,
    source: config.source,
    branchCount: config.branches.length,
    requiresBranchCodes: config.mode === 'national' && !config.nationalPath && !config.branches.length,
    message: config.message || null,
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
  const config = promoterConfiguration();
  if (config.message) throw new Error(config.message);
  let rows: unknown[] = [];
  let sourceBranch = config.mode === 'national' ? 'NASIONAL' : config.branches.join(',');
  const authHeader = normalize(process.env.STIFIN_API_AUTH_HEADER);
  const authValue = normalize(process.env.STIFIN_API_AUTH_VALUE);
  const headers: Record<string, string> = { accept: 'application/json' };
  if (authHeader && authValue && /^[A-Za-z0-9-]+$/.test(authHeader)) headers[authHeader] = authValue;
  const timeoutValue = Number(process.env.STIFIN_API_TIMEOUT_MS);
  const timeout = Number.isFinite(timeoutValue) ? Math.min(60_000, Math.max(5_000, timeoutValue)) : 10_000;
  if (config.source === 'manual') {
    try {
      rows = promoterRows(JSON.parse(config.manual));
      sourceBranch = 'manual';
    } catch { throw new Error('STIFIN_PROMOTERS_JSON bukan JSON yang valid.'); }
  } else if (config.source === 'stifin-national-endpoint') {
    const nationalUrl = config.nationalPath.startsWith('http')
      ? config.nationalPath : `${base.replace(/\/$/, '')}/${config.nationalPath.replace(/^\//, '')}`;
    const response = await fetch(nationalUrl, {
      headers, next: { revalidate: 300, tags: ['promoters:national'] }, redirect: 'error', signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) throw new Error(`Promotor nasional upstream HTTP ${response.status}.`);
    rows = promoterRows(await response.json());
  } else if (config.branches.length) {
    const responses = await Promise.allSettled(config.branches.map(async (branch) => {
      const response = await fetch(`${base.replace(/\/$/, '')}/proGetCab/pro/${encodeURIComponent(branch)}`, {
        headers, next: { revalidate: 300, tags: [`promoters:${branch}`] }, redirect: 'error', signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) throw new Error(`Promotor upstream HTTP ${response.status}.`);
      return promoterRows(await response.json()).map((item) => ({ ...(item as object), __branch: branch }));
    }));
    rows = responses.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    if (!rows.length && responses.some((result) => result.status === 'rejected')) throw new Error(config.mode === 'national' ? 'Seluruh sumber cabang untuk mode national sedang tidak tersedia.' : 'Sumber promotor cabang sedang tidak tersedia.');
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

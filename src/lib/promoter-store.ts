import { databaseConfigured, getDatabaseClient } from '@/lib/article-store';
import {
  savePromoterPublicCache,
  getCachedPublicPromoters,
} from '@/lib/interest-store';

export type PublicPromoter = {
  code: string;
  name: string;
  branchCode: string;
  active: boolean;
  menerimaKunjungan: boolean;
  whatsapp?: string;
  regionCodes: string[];
  provinceNames: string[];
  regencyNames: string[];
  wilayahTeks: string;
};

function normalize(value: unknown) { return String(value ?? '').trim(); }
function truthy(value: unknown) { return ['1', 'true', 'ya', 'yes', 'aktif'].includes(normalize(value).toLowerCase()); }

function normalizeWilayahName(value: unknown): string {
  return normalize(value)
    .toLocaleLowerCase('id-ID')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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

function parseBranchCodes(): string[] {
  const multi = normalize(process.env.STIFIN_BRANCH_CODES);
  if (multi) {
    return [...new Set(multi.split(',').map((b) => normalize(b).toUpperCase()).filter(Boolean))];
  }
  const single = normalize(process.env.STIFIN_BRANCH_CODE).toUpperCase();
  return single ? [single] : [];
}

async function fetchBranchPromoters(
  base: string,
  branch: string,
): Promise<{ rows: unknown[]; branch: string }> {
  const response = await fetch(`${base.replace(/\/$/, '')}/proGetCab/pro/${encodeURIComponent(branch)}`, {
    headers: { accept: 'application/json' },
    next: { revalidate: 300, tags: [`promoters:${branch}`] },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Promotor upstream ${branch} HTTP ${response.status}.`);
  const body: unknown = await response.json();
  const rows = body && typeof body === 'object' && 'data' in body && Array.isArray(body.data) ? body.data : [];
  return { rows, branch };
}

type RawPromoter = {
  code: string;
  name: string;
  branchCode: string;
  active: boolean;
  menerimaKunjungan: boolean;
  phone: string;
  propinsi: string;
  area: string;
  sub: string;
  raw: Record<string, unknown>;
};

function sanitizeRawItem(item: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    const lower = key.toLowerCase();
    if (['passid', 'password', 'pass', 'pin', 'token', 'saldo', 'balance', 'email', 'telepon', 'nohp', 'phone', 'hp'].includes(lower)) continue;
    safe[key] = typeof value === 'string' ? normalize(value).slice(0, 500) : value;
  }
  return safe;
}

function buildPromoterMatchIndex(promoters: RawPromoter[]) {
  const byCode = new Map<string, RawPromoter[]>();
  const byRegency = new Map<string, RawPromoter[]>();
  const byProvince = new Map<string, RawPromoter[]>();
  for (const p of promoters) {
    if (!p.active) continue;
    const codes = [p.code];
    for (const code of codes) {
      const list = byCode.get(code) || []; list.push(p); byCode.set(code, list);
    }
    const regencyNorm = normalizeWilayahName(p.area || p.sub);
    if (regencyNorm) {
      const list = byRegency.get(regencyNorm) || []; list.push(p); byRegency.set(regencyNorm, list);
    }
    const provNorm = normalizeWilayahName(p.propinsi);
    if (provNorm) {
      const list = byProvince.get(provNorm) || []; list.push(p); byProvince.set(provNorm, list);
    }
  }
  return { byCode, byRegency, byProvince };
}

export type RegionContext = {
  provinceCode?: string;
  provinceName?: string;
  regencyCode?: string;
  regencyName?: string;
};

export function findPromoterCandidates(
  promoters: RawPromoter[],
  region: RegionContext,
  manualRegionMap: Record<string, string[]>,
): RawPromoter[] {
  const seen = new Set<string>();
  const result: RawPromoter[] = [];
  const push = (p: RawPromoter) => { if (!seen.has(p.code)) { seen.add(p.code); result.push(p); } };

  const { byCode, byRegency, byProvince } = buildPromoterMatchIndex(promoters);

  if (region.regencyCode || region.provinceCode) {
    for (const [code, regionCodes] of Object.entries(manualRegionMap)) {
      const match = regionCodes.some((rc) => {
        if (region.regencyCode && (rc === region.regencyCode || region.regencyCode.startsWith(`${rc}.`))) return true;
        if (region.provinceCode && !region.regencyCode && (rc === region.provinceCode || region.provinceCode.startsWith(`${rc}.`))) return true;
        return false;
      });
      if (match) {
        for (const p of byCode.get(code) || []) push(p);
      }
    }
  }

  if (region.regencyName) {
    const regKey = normalizeWilayahName(region.regencyName);
    for (const p of byRegency.get(regKey) || []) push(p);
  }

  if (region.provinceName) {
    const provKey = normalizeWilayahName(region.provinceName);
    for (const p of byProvince.get(provKey) || []) push(p);
  }

  return result;
}

export async function getPublicPromoters(region?: string): Promise<PublicPromoter[]> {
  const base = process.env.STIFIN_API_BASE || 'https://apro.stifin.id/api';
  const branches = parseBranchCodes();
  const manual = normalize(process.env.STIFIN_PROMOTERS_JSON);

  let rows: unknown[] = [];
  let fallbackUsed = false;
  let fetchedBranches: string[] = [];
  try {
    if (manual) {
      try {
        const parsed: unknown = JSON.parse(manual);
        rows = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' && 'data' in parsed && Array.isArray(parsed.data) ? parsed.data : []);
        fetchedBranches = ['manual'];
      } catch { rows = []; }
    } else if (branches.length > 0) {
      const results = await Promise.allSettled(branches.map((branch) => fetchBranchPromoters(base, branch)));
      for (const result of results) {
        if (result.status === 'fulfilled') {
          rows = [...rows, ...result.value.rows];
          fetchedBranches.push(result.value.branch);
        }
      }
      if (fetchedBranches.length === 0) {
        fallbackUsed = true;
      }
    }
  } catch {
    fallbackUsed = true;
  }

  const rawPromotersMap = new Map<string, RawPromoter>();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const code = normalize(item.KodeID ?? item.kode ?? item.code).toUpperCase();
    const name = normalize(item.Nama ?? item.nama ?? item.name);
    if (!code || !name) continue;
    const branchCode = normalize(item.KodeCabang ?? item.branchCode) || fetchedBranches[0] || 'unknown';
    const existing = rawPromotersMap.get(code);
    const candidateActive = truthy(item.Aktif ?? item.active ?? true);
    if (!existing || (candidateActive && !existing.active)) {
      rawPromotersMap.set(code, {
        code,
        name,
        branchCode,
        active: candidateActive,
        menerimaKunjungan: truthy(item.MenerimaKunjungan ?? item.menerima_kunjungan ?? true),
        phone: normalize(item.Telepon ?? item.NoHP ?? item.phone).replace(/[^\d+]/g, ''),
        propinsi: normalize(item.Propinsi ?? item.propinsi ?? item.province ?? item.Provinsi),
        area: normalize(item.Area ?? item.area),
        sub: normalize(item.Sub ?? item.sub),
        raw: sanitizeRawItem(item),
      });
    }
  }

  const allRaw = Array.from(rawPromotersMap.values());

  if (allRaw.length === 0 && !fallbackUsed) {
    fallbackUsed = true;
  }

  if (fallbackUsed) {
    const cached = await getCachedPublicPromoters();
    if (cached.length > 0) {
      return cached.map((c) => {
        const regionCodes = c.wilayahLayanan;
        const matches = !region || regionCodes.some((rc) => region === rc || region.startsWith(`${rc}.`));
        if (region && !matches) return null;
        const whatsapp = process.env.STIFIN_PUBLIC_WHATSAPP === 'true' && c.data && typeof c.data === 'object' && (c.data as Record<string, unknown>).phone
          ? String((c.data as Record<string, unknown>).phone)
          : undefined;
        return {
          code: c.code, name: c.name, branchCode: c.branchCode, active: c.active,
          menerimaKunjungan: Boolean((c.data as Record<string, unknown>).menerimaKunjungan ?? true),
          regionCodes, whatsapp,
          provinceNames: Array.isArray((c.data as Record<string, unknown>).provinceNames) ? ((c.data as Record<string, unknown>).provinceNames as string[]) : [],
          regencyNames: Array.isArray((c.data as Record<string, unknown>).regencyNames) ? ((c.data as Record<string, unknown>).regencyNames as string[]) : [],
          wilayahTeks: String((c.data as Record<string, unknown>).wilayahTeks || ''),
        };
      }).filter(Boolean) as PublicPromoter[];
    }
  }

  let regionMap: Record<string, string[]> = {};
  try { regionMap = JSON.parse(process.env.STIFIN_PROMOTER_REGION_MAP || '{}') as Record<string, string[]>; } catch { regionMap = {}; }
  regionMap = { ...regionMap, ...(await loadRegionMappings()) };

  const publicWhatsapp = process.env.STIFIN_PUBLIC_WHATSAPP === 'true';

  const output: PublicPromoter[] = [];
  const cacheable: Array<{
    code: string; name: string; branchCode: string; active: boolean;
    wilayahLayanan: string[]; data: Record<string, unknown>;
  }> = [];

  for (const p of allRaw) {
    const manualCodes = Array.isArray(regionMap[p.code]) ? regionMap[p.code].map(String).filter(Boolean) : [];
    const provinceNames = [...new Set([p.propinsi].filter(Boolean))];
    const regencyNames = [...new Set([p.area, p.sub].filter(Boolean))];
    const wilayahParts = [...provinceNames, ...regencyNames];
    const regionCodes = manualCodes;
    if (region && !regionCodes.some((codeValue) => region === codeValue || region.startsWith(`${codeValue}.`))) {
      if (region && p.active) {
        const ctx: RegionContext = { provinceName: undefined, regencyName: undefined };
        if (region.includes('.')) {
          const parts = region.split('.');
          if (parts.length >= 1) {
            try {
              const { getWilayah } = await import('@/lib/wilayah');
              const provinces = await getWilayah('provinces');
              const prov = provinces.find((pp) => pp.code === parts[0]);
              if (prov) ctx.provinceName = prov.name;
              if (parts.length >= 2 && prov) {
                const regs = await getWilayah('regencies', prov.code);
                const reg = regs.find((rr) => rr.code === `${parts[0]}.${parts[1]}`);
                if (reg) ctx.regencyName = reg.name;
              }
            } catch { /* ignore */ }
          }
        }
        const matches = findPromoterCandidates([p], ctx, regionMap);
        if (matches.length === 0) continue;
      } else if (region) {
        continue;
      }
    }
    const entry: PublicPromoter = {
      code: p.code,
      name: p.name,
      branchCode: p.branchCode,
      active: p.active,
      menerimaKunjungan: p.menerimaKunjungan,
      ...(publicWhatsapp && p.phone ? { whatsapp: p.phone } : {}),
      regionCodes,
      provinceNames,
      regencyNames,
      wilayahTeks: wilayahParts.join(' · '),
    };
    output.push(entry);
    cacheable.push({
      code: p.code,
      name: p.name,
      branchCode: p.branchCode,
      active: p.active,
      wilayahLayanan: regionCodes,
      data: {
        menerimaKunjungan: p.menerimaKunjungan,
        provinceNames,
        regencyNames,
        wilayahTeks: entry.wilayahTeks,
      },
    });
  }

  if (!fallbackUsed && cacheable.length > 0) {
    savePromoterPublicCache(cacheable).catch((e) => console.error('Gagal simpan cache promotor', e));
  }

  return output;
}

export async function getPromotersForRegion(ctx: RegionContext): Promise<{
  direct: PublicPromoter[];
  candidates: PublicPromoter[];
  available: boolean;
}> {
  const regionMap: Record<string, string[]> = {};
  try {
    await ensureSchema();
    const dbMap = await loadRegionMappings();
    let envMap: Record<string, string[]> = {};
    try { envMap = JSON.parse(process.env.STIFIN_PROMOTER_REGION_MAP || '{}') as Record<string, string[]>; } catch { envMap = {}; }
    Object.assign(regionMap, envMap, dbMap);
  } catch { /* ignore */ }

  let all: PublicPromoter[] = [];
  try {
    all = await getPublicPromoters();
  } catch {
    all = [];
  }

  const direct = ctx.regencyCode
    ? all.filter((p) => p.active && p.regionCodes.some((rc) => rc === ctx.regencyCode || ctx.regencyCode!.startsWith(`${rc}.`)))
    : (ctx.provinceCode
        ? all.filter((p) => p.active && p.regionCodes.some((rc) => rc === ctx.provinceCode || ctx.provinceCode!.startsWith(`${rc}.`)))
        : []);

  if (direct.length > 0) {
    return { direct, candidates: [], available: true };
  }

  const rawLike: RawPromoter[] = all.map((p) => ({
    code: p.code, name: p.name, branchCode: p.branchCode, active: p.active,
    menerimaKunjungan: p.menerimaKunjungan, phone: p.whatsapp || '',
    propinsi: p.provinceNames[0] || '', area: p.regencyNames[0] || '', sub: p.regencyNames[1] || '',
    raw: {},
  }));
  const candidatesRaw = findPromoterCandidates(rawLike, ctx, regionMap);
  const candidateCodes = new Set(candidatesRaw.map((c) => c.code));
  const candidates = all.filter((p) => p.active && candidateCodes.has(p.code));

  return { direct, candidates, available: direct.length > 0 || candidates.length > 0 };
}

export async function getServedRegionCodes() {
  const promoters = await getPublicPromoters();
  return [...new Set(promoters.filter((promoter) => promoter.active && promoter.regionCodes.length > 0).flatMap((promoter) => promoter.regionCodes))];
}

export async function isPromoterCodeActive(code: string): Promise<boolean> {
  const all = await getPublicPromoters().catch(() => []);
  const normalized = normalize(code).toUpperCase();
  return all.some((p) => p.code === normalized && p.active);
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

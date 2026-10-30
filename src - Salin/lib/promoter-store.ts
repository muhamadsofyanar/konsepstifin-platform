import { databaseConfigured, getDatabaseClient } from '@/lib/article-store';
import {
  applyAutomaticRegionMapping,
  paginatePromoters,
  type PromoterPage,
  type PromoterQuery,
} from '@/lib/promoter-catalog';
import {
  normalizeRegionCodes,
  regionMappingCovers,
  type PublicPromoter,
} from '@/lib/promoter-domain';
import {
  getPromoterSourceStatus,
  loadPromoterSnapshot,
  type PromoterSourceStatus,
} from '@/lib/promoter-source';
import { getProvinceRegencyCatalog } from '@/lib/wilayah';

export type { PromoterPage, PromoterQuery } from '@/lib/promoter-catalog';
export type { PublicPromoter } from '@/lib/promoter-domain';
export type { PromoterSourceStatus } from '@/lib/promoter-source';

export type PromoterCatalogStatus = {
  source: PromoterSourceStatus;
  mapped: number;
  automatic: number;
  unresolved: number;
  updatedAt: string | null;
};

type ManualMappings = {
  byCode: Record<string, string[]>;
  updatedAt: string | null;
};

function normalize(value: unknown) {
  return String(value ?? '').trim();
}

function latestTimestamp(...values: Array<string | null>) {
  const timestamps = values.filter((value): value is string => Boolean(value));
  if (!timestamps.length) return null;
  return timestamps.sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

let schemaPromise: Promise<void> | undefined;

async function ensureSchema() {
  if (!databaseConfigured()) return;
  schemaPromise ??= getDatabaseClient()`CREATE TABLE IF NOT EXISTS public_promoter_regions (
    promoter_code TEXT PRIMARY KEY,
    region_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`.then(() => undefined).catch((error) => {
    schemaPromise = undefined;
    throw error;
  });
  await schemaPromise;
}

async function loadDatabaseMappings(): Promise<ManualMappings> {
  if (!databaseConfigured()) return { byCode: {}, updatedAt: null };
  try {
    await ensureSchema();
    const rows = await getDatabaseClient()`SELECT promoter_code, region_codes, updated_at FROM public_promoter_regions`;
    const updatedAt = rows.reduce<string | null>((latest, row) => {
      const current = row.updated_at ? new Date(String(row.updated_at)).toISOString() : null;
      return latestTimestamp(latest, current);
    }, null);
    return {
      byCode: Object.fromEntries(rows.map((row) => [
        String(row.promoter_code).toUpperCase(),
        normalizeRegionCodes(row.region_codes),
      ])),
      updatedAt,
    };
  } catch (error) {
    console.error('Promoter mapping fallback', error);
    return { byCode: {}, updatedAt: null };
  }
}

function loadEnvironmentMappings() {
  const raw = process.env.STIFIN_PROMOTER_REGION_MAP || '{}';
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {} as Record<string, string[]>;
    return Object.fromEntries(Object.entries(parsed).map(([code, regionCodes]) => [
      normalize(code).toUpperCase(),
      normalizeRegionCodes(regionCodes),
    ]));
  } catch {
    return {} as Record<string, string[]>;
  }
}

function applyManualMappings(promoters: PublicPromoter[], mappings: Record<string, string[]>) {
  return promoters.map((promoter) => {
    if (!Object.prototype.hasOwnProperty.call(mappings, promoter.code)) return promoter;
    return {
      ...promoter,
      regionCodes: mappings[promoter.code],
      mappingSource: 'manual' as const,
    };
  });
}

async function loadCatalog() {
  const snapshot = await loadPromoterSnapshot();
  let regions = [] as Awaited<ReturnType<typeof getProvinceRegencyCatalog>>;
  try {
    regions = await getProvinceRegencyCatalog();
  } catch (error) {
    console.error('Wilayah catalog fallback', error);
  }
  const automaticallyMapped = applyAutomaticRegionMapping(snapshot.promoters, regions);
  const databaseMappings = await loadDatabaseMappings();
  const promoters = applyManualMappings(automaticallyMapped, {
    ...loadEnvironmentMappings(),
    ...databaseMappings.byCode,
  });
  return {
    promoters,
    source: snapshot.status,
    manualUpdatedAt: databaseMappings.updatedAt,
  };
}

export function promoterSourceStatus(): PromoterSourceStatus {
  return getPromoterSourceStatus();
}

export async function queryPromoters(query: PromoterQuery = {}): Promise<PromoterPage> {
  const catalog = await loadCatalog();
  return paginatePromoters(catalog.promoters, query);
}

export async function getPromotersForRegion(regionCode: string): Promise<PublicPromoter[]> {
  const catalog = await loadCatalog();
  return catalog.promoters.filter((promoter) => promoter.regionCodes.some((mappedCode) => (
    regionMappingCovers(regionCode, mappedCode)
  )));
}

export async function getPromoterCatalogStatus(): Promise<PromoterCatalogStatus> {
  const catalog = await loadCatalog();
  const mapped = catalog.promoters.filter((promoter) => promoter.regionCodes.length > 0).length;
  return {
    source: catalog.source,
    mapped,
    automatic: catalog.promoters.filter((promoter) => promoter.mappingSource === 'automatic').length,
    unresolved: catalog.promoters.length - mapped,
    updatedAt: latestTimestamp(catalog.source.lastSuccessAt, catalog.manualUpdatedAt),
  };
}

export async function getPublicPromoters(region?: string): Promise<PublicPromoter[]> {
  if (region) return getPromotersForRegion(region);
  return (await loadCatalog()).promoters;
}

export async function getServedRegionCodes() {
  const promoters = await getPublicPromoters();
  return [...new Set(promoters
    .filter((promoter) => promoter.active && promoter.regionCodes.length > 0)
    .flatMap((promoter) => promoter.regionCodes))];
}

export async function setPromoterRegionMapping(code: string, regionCodes: string[]) {
  if (!databaseConfigured()) throw new Error('DATABASE_URL belum dikonfigurasi.');
  await ensureSchema();
  const promoterCode = normalize(code).toUpperCase();
  const values = normalizeRegionCodes(regionCodes).slice(0, 200);
  if (!promoterCode) throw new Error('Kode promotor wajib diisi.');
  await getDatabaseClient()`INSERT INTO public_promoter_regions (promoter_code, region_codes) VALUES (${promoterCode}, ${getDatabaseClient().json(values)}) ON CONFLICT (promoter_code) DO UPDATE SET region_codes=EXCLUDED.region_codes, updated_at=NOW()`;
  return { code: promoterCode, regionCodes: values };
}

export async function setPromoterRegionMappings(
  mappings: Array<{ promoterCode: string; regionCodes: string[] }>,
) {
  if (!databaseConfigured()) throw new Error('DATABASE_URL belum dikonfigurasi.');
  await ensureSchema();
  const normalized = mappings.map((mapping) => ({
    promoterCode: normalize(mapping.promoterCode).toUpperCase(),
    regionCodes: normalizeRegionCodes(mapping.regionCodes).slice(0, 200),
  }));
  if (normalized.some((mapping) => !mapping.promoterCode)) {
    throw new Error('Kode promotor wajib diisi.');
  }
  const sql = getDatabaseClient();
  await sql.begin(async (transaction) => {
    for (const mapping of normalized) {
      await transaction`INSERT INTO public_promoter_regions (promoter_code, region_codes)
        VALUES (${mapping.promoterCode}, ${transaction.json(mapping.regionCodes)})
        ON CONFLICT (promoter_code) DO UPDATE SET region_codes=EXCLUDED.region_codes, updated_at=NOW()`;
    }
  });
  return normalized;
}

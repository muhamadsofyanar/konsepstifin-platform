import { getPromoterCatalogStatus, getPromotersForRegion, getPublicPromoters, type PublicPromoter } from '@/lib/promoter-store';
import { getPublicManagedProducts } from '@/lib/product-store';
import { getServiceCoverageOverrides, type ServiceCoverageOverride } from '@/lib/service-coverage-store';
import { getProvinceRegencyCatalog, getWilayah, wilayahSlug, type Wilayah, type WilayahLevel } from '@/lib/wilayah';

const STABLE_LOCAL_FALLBACK = '2026-08-29T00:00:00.000Z';

export type LocalPageData = {
  province: Wilayah;
  regency: Wilayah;
  promoters: PublicPromoter[];
  indexable: boolean;
  updatedAt: string | null;
  canonicalSlug: string;
  requestedSlug: string;
  manualCoverage: ServiceCoverageOverride | null;
};

export type LocalRegionSummary = Pick<LocalPageData, 'province' | 'regency' | 'indexable' | 'updatedAt' | 'canonicalSlug'> & {
  activePromoters: number;
};

function latestTimestamp(...values: Array<string | null | undefined>) {
  const valid = values.filter((value): value is string => Boolean(value) && !Number.isNaN(Date.parse(value!)));
  if (!valid.length) return null;
  return valid.sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

function validManualEvidence(coverage: ServiceCoverageOverride | null | undefined) {
  return Boolean(coverage?.serviceable && coverage.evidenceNote.trim().length >= 10);
}

export function localPagePolicy(input: {
  level: WilayahLevel;
  activePromoters: number;
  manualServiceable: boolean;
}): { index: boolean; follow: true } {
  const permittedLevel = input.level === 'regencies' || input.level === 'districts';
  return { index: permittedLevel && (input.activePromoters > 0 || input.manualServiceable), follow: true };
}

export function canonicalCitySlug(regency: Pick<Wilayah, 'code' | 'name'> & { level?: WilayahLevel }) {
  return `${wilayahSlug(regency.name)}-${regency.code.replace(/\./g, '-')}`;
}

export function promoterProfileSlug(promoter: Pick<PublicPromoter, 'code' | 'name'>) {
  return `${wilayahSlug(promoter.name)}-${wilayahSlug(promoter.code)}`;
}

export function promoterProfilePolicy(promoter: Pick<PublicPromoter, 'active' | 'regionCodes'>): { index: boolean; follow: true } {
  return { index: promoter.active && promoter.regionCodes.length > 0, follow: true };
}

async function findCity(slug: string) {
  const normalized = slug.toLocaleLowerCase('id-ID').trim();
  const codeMatch = normalized.match(/-(\d{2})-(\d{2})$/);
  if (codeMatch) {
    const provinceCode = codeMatch[1];
    const regencyCode = `${codeMatch[1]}.${codeMatch[2]}`;
    const [provinces, regencies] = await Promise.all([
      getWilayah('provinces'),
      getWilayah('regencies', provinceCode),
    ]);
    const province = provinces.find((item) => item.code === provinceCode);
    const regency = regencies.find((item) => item.code === regencyCode);
    return province && regency ? { province, regency } : null;
  }

  const matches = (await getProvinceRegencyCatalog()).flatMap((province) => province.regencies
    .filter((regency) => wilayahSlug(regency.name) === normalized)
    .map((regency) => ({ province, regency })));
  return matches.length === 1 ? matches[0] : null;
}

async function localData(province: Wilayah, regency: Wilayah, requestedSlug: string): Promise<LocalPageData> {
  const [promoters, overrides, status, products] = await Promise.all([
    getPromotersForRegion(regency.code).catch(() => []),
    getServiceCoverageOverrides().catch(() => []),
    getPromoterCatalogStatus().catch(() => null),
    getPublicManagedProducts('test').catch(() => []),
  ]);
  const relevantOverrides = overrides.filter((item) => item.regionCode === regency.code || item.regionCode.startsWith(`${regency.code}.`));
  const coverage = relevantOverrides.find(validManualEvidence)
    || relevantOverrides.find((item) => item.regionCode === regency.code)
    || relevantOverrides[0]
    || null;
  const activePromoters = promoters.filter((promoter) => promoter.active);
  const manualServiceable = relevantOverrides.some(validManualEvidence);
  const robots = localPagePolicy({ level: 'regencies', activePromoters: activePromoters.length, manualServiceable });
  return {
    province,
    regency,
    promoters: activePromoters,
    indexable: Boolean(robots?.index),
    updatedAt: latestTimestamp(...relevantOverrides.map((item) => item.updatedAt), ...products.map((item) => item.updatedAt), status?.updatedAt, status?.source.lastSuccessAt) || STABLE_LOCAL_FALLBACK,
    canonicalSlug: canonicalCitySlug(regency),
    requestedSlug,
    manualCoverage: coverage,
  };
}

export async function resolveLocalPage(citySlug: string): Promise<LocalPageData | null> {
  const found = await findCity(citySlug).catch(() => null);
  return found ? localData(found.province, found.regency, citySlug) : null;
}

export async function getIndexableRegions(): Promise<LocalRegionSummary[]> {
  const [catalog, promoters, overrides, status, products] = await Promise.all([
    getProvinceRegencyCatalog().catch(() => []),
    getPublicPromoters().catch(() => []),
    getServiceCoverageOverrides().catch(() => []),
    getPromoterCatalogStatus().catch(() => null),
    getPublicManagedProducts('test').catch(() => []),
  ]);
  const active = promoters.filter((promoter) => promoter.active && promoter.regionCodes.length > 0);
  const validOverrides = new Map(overrides.filter(validManualEvidence).map((item) => [item.regionCode, item]));
  const summaries: LocalRegionSummary[] = [];
  for (const province of catalog) {
    for (const regency of province.regencies) {
      const activePromoters = active.filter((promoter) => promoter.regionCodes.some((code) => (
        code === regency.code || code.startsWith(`${regency.code}.`) || regency.code.startsWith(`${code}.`)
      ))).length;
      const relevantOverrides = [...validOverrides.values()].filter((item) => item.regionCode === regency.code || item.regionCode.startsWith(`${regency.code}.`));
      const indexable = activePromoters > 0 || relevantOverrides.length > 0;
      if (!indexable) continue;
      summaries.push({
        province,
        regency,
        activePromoters,
        indexable,
        canonicalSlug: canonicalCitySlug(regency),
        updatedAt: latestTimestamp(...relevantOverrides.map((item) => item.updatedAt), ...products.map((item) => item.updatedAt), status?.updatedAt, status?.source.lastSuccessAt) || STABLE_LOCAL_FALLBACK,
      });
    }
  }
  return summaries.sort((left, right) => left.regency.code.localeCompare(right.regency.code, 'id-ID'));
}

export async function resolvePromoterProfile(slug: string) {
  const candidates = (await getPublicPromoters().catch(() => []))
    .filter((promoter) => promoterProfileSlug(promoter) === slug.toLocaleLowerCase('id-ID'));
  return candidates.length === 1 ? {
    promoter: candidates[0],
    canonicalSlug: promoterProfileSlug(candidates[0]),
    robots: promoterProfilePolicy(candidates[0]),
  } : null;
}

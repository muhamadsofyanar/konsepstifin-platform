import {
  normalizeAdministrativeName,
  normalizeBranchCode,
  normalizeProvinceName,
  regionMappingCovers,
  type MappingSource,
  type PublicPromoter,
} from './promoter-domain';

export type RegionFixture = { code: string; name: string };
export type ProvinceFixture = RegionFixture & { regencies: RegionFixture[] };

export type PromoterQuery = {
  q?: string;
  province?: string;
  regency?: string;
  branch?: string;
  mapping?: MappingSource;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
};

export type PromoterPage = {
  items: PublicPromoter[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function administrativeKind(value: string) {
  const normalized = value.trim().toLocaleUpperCase('id-ID');
  if (/^(?:KABUPATEN|KAB\.?)(?:\s|$)/.test(normalized)) return 'kabupaten';
  if (/^KOTA(?:\s|$)/.test(normalized)) return 'kota';
  return '';
}

function uniqueProvince(provinces: ProvinceFixture[], provinceName: string) {
  if (!provinceName.trim()) return null;
  const normalized = normalizeProvinceName(provinceName);
  const matches = provinces.filter((province) => normalizeProvinceName(province.name) === normalized);
  return matches.length === 1 ? matches[0] : null;
}

function uniqueRegency(province: ProvinceFixture, areaName: string) {
  if (!areaName.trim()) return null;
  const normalized = normalizeAdministrativeName(areaName);
  let matches = province.regencies.filter((regency) => (
    normalizeAdministrativeName(regency.name) === normalized
  ));
  const kind = administrativeKind(areaName);
  if (kind) {
    matches = matches.filter((regency) => administrativeKind(regency.name) === kind);
  }
  return matches.length === 1 ? matches[0] : null;
}

export function applyAutomaticRegionMapping(
  promoters: PublicPromoter[],
  provinces: ProvinceFixture[],
): PublicPromoter[] {
  return promoters.map((promoter) => {
    if (promoter.mappingSource === 'manual') return promoter;
    const province = uniqueProvince(provinces, promoter.province);
    const regency = province ? uniqueRegency(province, promoter.area) : null;
    if (!regency) {
      return { ...promoter, regionCodes: [], mappingSource: 'unresolved' };
    }
    return {
      ...promoter,
      regionCodes: [regency.code],
      mappingSource: 'automatic',
    };
  });
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function textMatch(value: string, query: string) {
  return value.toLocaleLowerCase('id-ID').includes(query.toLocaleLowerCase('id-ID'));
}

function regionFilterMatch(promoter: PublicPromoter, codeOrName: string, level: 'province' | 'regency') {
  const value = codeOrName.trim();
  if (!value) return true;
  if (/^\d{2}(?:\.\d{2})?$/.test(value)) {
    return promoter.regionCodes.some((mappedCode) => regionMappingCovers(value, mappedCode));
  }
  return level === 'province'
    ? normalizeProvinceName(promoter.province) === normalizeProvinceName(value)
    : normalizeAdministrativeName(promoter.area) === normalizeAdministrativeName(value);
}

function compareText(left: string, right: string) {
  if (!left && right) return 1;
  if (left && !right) return -1;
  return left.localeCompare(right, 'id-ID', { sensitivity: 'base', numeric: true });
}

function comparePromoters(left: PublicPromoter, right: PublicPromoter) {
  return compareText(left.province, right.province)
    || compareText(left.area, right.area)
    || compareText(left.name, right.name)
    || compareText(left.code, right.code);
}

export function paginatePromoters(
  promoters: PublicPromoter[],
  query: PromoterQuery = {},
): PromoterPage {
  const search = query.q?.trim() ?? '';
  const branch = query.branch ? normalizeBranchCode(query.branch) : '';
  const mapping = query.mapping;
  const pageSize = Math.min(100, positiveInteger(query.pageSize, 24));
  const filtered = promoters.filter((promoter) => {
    if (!query.includeInactive && !promoter.active) return false;
    if (search && !textMatch(promoter.name, search) && !textMatch(promoter.code, search)) return false;
    if (query.branch && promoter.branchCode !== branch) return false;
    if (query.province && !regionFilterMatch(promoter, query.province, 'province')) return false;
    if (query.regency && !regionFilterMatch(promoter, query.regency, 'regency')) return false;
    if (mapping && promoter.mappingSource !== mapping) return false;
    return true;
  }).sort(comparePromoters);
  const total = filtered.length;
  const totalPages = total ? Math.ceil(total / pageSize) : 0;
  const requestedPage = positiveInteger(query.page, 1);
  const page = totalPages ? Math.min(requestedPage, totalPages) : 1;
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

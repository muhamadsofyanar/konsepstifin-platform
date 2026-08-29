export type MappingSource = 'automatic' | 'manual' | 'unresolved';

export type PublicPromoter = {
  code: string; name: string; branchCode: string; area: string; province: string;
  active: boolean; regionCodes: string[]; mappingSource: MappingSource;
};
export type PromoterLocationInput = { provinceCode: string; provinceName: string; regencyCode: string; regencyName: string };
export type MatchMethod = 'manual_region' | 'area' | 'province' | 'none';
export type PromoterMatch = { method: MatchMethod; primary: PublicPromoter | null; candidates: PublicPromoter[] };

const BRANCH_PATTERN = /^[A-Z0-9]{2,12}-CAB-[A-Z0-9]{1,8}$/;
const REGION_PATTERN = /^\d{2}(?:\.\d{2}){0,2}(?:\.\d{4})?$/;
function compact(value: unknown, max = 160) { return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max); }
function truthy(value: unknown) { return ['1', 'true', 'ya', 'yes', 'aktif'].includes(compact(value).toLowerCase()); }

export function normalizeAdministrativeName(value: unknown) {
  return compact(value).toLocaleUpperCase('id-ID').replace(/[^A-Z0-9]+/g, ' ')
    .replace(/^KABUPATEN\s+|^KAB\s+|^KOTA\s+/, '').replace(/\s+/g, ' ').trim();
}
export function normalizeProvinceName(value: unknown) {
  const normalized = normalizeAdministrativeName(value);
  const aliases: Record<string, string> = {
    'DAERAH KHUSUS IBUKOTA JAKARTA': 'DKI JAKARTA', 'DKI JAKARTA': 'DKI JAKARTA',
    'DAERAH ISTIMEWA YOGYAKARTA': 'DI YOGYAKARTA', 'DI YOGYAKARTA': 'DI YOGYAKARTA',
  };
  return aliases[normalized] ?? normalized;
}
export function normalizeBranchCode(value: unknown) {
  const normalized = compact(value, 40).toUpperCase();
  return BRANCH_PATTERN.test(normalized) && normalized !== 'XXX-CAB-00' ? normalized : '';
}
export function normalizeRegionCodes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => compact(item, 24)).filter((item) => REGION_PATTERN.test(item)))];
}
export function sanitizePromoterRows(rows: unknown[], sourceBranch = ''): PublicPromoter[] {
  const safe = rows.slice(0, 10_000).flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>;
    const code = compact(item.KodeID ?? item.kode ?? item.code, 80).toUpperCase();
    const name = compact(item.Nama ?? item.nama ?? item.name, 160);
    if (!code || !name) return [];
    return [{
      code,
      name,
      branchCode: normalizeBranchCode(item.Sub ?? item.KodeCabang ?? item.branchCode ?? sourceBranch),
      area: compact(item.Area ?? item.area, 120),
      province: compact(item.Propinsi ?? item.province, 120),
      active: truthy(item.Aktif ?? item.active),
      regionCodes: normalizeRegionCodes(item.regionCodes ?? item.RegionCodes ?? item.region_codes),
      mappingSource: 'unresolved' as const,
    }];
  });
  const unique = new Map<string, PublicPromoter>();
  for (const item of safe) if (!unique.has(item.code)) unique.set(item.code, item);
  return [...unique.values()];
}
export function regionMappingCovers(regionCode: string, mappedCode: string) {
  return regionCode === mappedCode || regionCode.startsWith(mappedCode + '.') || mappedCode.startsWith(regionCode + '.');
}
function orderCandidates(items: PublicPromoter[], location: PromoterLocationInput) {
  return [...items].sort((left, right) => {
    const target = location.regencyCode || location.provinceCode;
    const leftSpecificity = Math.max(0, ...left.regionCodes.filter((code) => regionMappingCovers(target, code)).map((code) => code.split('.').length));
    const rightSpecificity = Math.max(0, ...right.regionCodes.filter((code) => regionMappingCovers(target, code)).map((code) => code.split('.').length));
    if (leftSpecificity !== rightSpecificity) return rightSpecificity - leftSpecificity;
    const leftCompleteness = Number(Boolean(left.area)) + Number(Boolean(left.province));
    const rightCompleteness = Number(Boolean(right.area)) + Number(Boolean(right.province));
    if (leftCompleteness !== rightCompleteness) return rightCompleteness - leftCompleteness;
    return left.code.localeCompare(right.code, 'id-ID');
  });
}
export function matchPromoters(promoters: PublicPromoter[], location: PromoterLocationInput): PromoterMatch {
  const active = promoters.filter((item) => item.active);
  const regionCode = location.regencyCode || location.provinceCode;
  const manual = active.filter((item) => item.regionCodes.some((code) => regionMappingCovers(regionCode, code)));
  const area = active.filter((item) => normalizeAdministrativeName(item.area) === normalizeAdministrativeName(location.regencyName)
    && normalizeProvinceName(item.province) === normalizeProvinceName(location.provinceName));
  const province = active.filter((item) => normalizeProvinceName(item.province) === normalizeProvinceName(location.provinceName));
  const selected = manual.length ? manual : area.length ? area : province;
  const method: MatchMethod = manual.length ? 'manual_region' : area.length ? 'area' : province.length ? 'province' : 'none';
  const candidates = orderCandidates(selected, location).slice(0, 3);
  return { method, primary: candidates[0] ?? null, candidates };
}

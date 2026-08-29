export type WilayahLevel = 'provinces' | 'regencies' | 'districts' | 'villages';
export type Wilayah = { code: string; name: string; level: WilayahLevel; parentCode?: string };
export type ProvinceWithRegencies = Wilayah & { regencies: Wilayah[] };

const API_ROOT = 'https://wilayah.id/api';
const memoryCache = new Map<string, { expiresAt: number; value: Wilayah[] }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function endpoint(level: WilayahLevel, parentCode?: string) {
  if (level === 'provinces') return `${API_ROOT}/provinces.json`;
  if (!parentCode) throw new Error(`Kode induk wajib untuk ${level}.`);
  return `${API_ROOT}/${level}/${encodeURIComponent(parentCode)}.json`;
}

export function wilayahSlug(name: string) {
  return name.toLocaleLowerCase('id-ID').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function wilayahPath(item: Wilayah) {
  return `/wilayah/${wilayahSlug(item.name)}-${item.code.replace(/\./g, '-')}`;
}

export function wilayahChainPath(chain: Wilayah[]) {
  return `/wilayah/${chain.map((item) => `${wilayahSlug(item.name)}-${item.code.replace(/\./g, '-')}`).join('/')}`;
}

export async function getWilayah(level: WilayahLevel, parentCode?: string): Promise<Wilayah[]> {
  const key = `${level}:${parentCode ?? ''}`;
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const response = await fetch(endpoint(level, parentCode), {
    headers: { accept: 'application/json' },
    next: { revalidate: 86400, tags: [`wilayah:${key}`] },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Wilayah upstream HTTP ${response.status}.`);
  const body: unknown = await response.json();
  const rows = body && typeof body === 'object' && 'data' in body && Array.isArray(body.data) ? body.data : [];
  const value = rows.flatMap((row: unknown) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as Record<string, unknown>;
    const code = String(record.code ?? '').trim();
    const name = String(record.name ?? '').trim();
    return code && name ? [{ code, name, level, ...(parentCode ? { parentCode } : {}) }] : [];
  });
  memoryCache.set(key, { expiresAt: Date.now() + CACHE_TTL, value });
  return value;
}

export async function getProvinceRegencyCatalog(): Promise<ProvinceWithRegencies[]> {
  const provinces = await getWilayah('provinces');
  return Promise.all(provinces.map(async (province) => ({
    ...province,
    regencies: await getWilayah('regencies', province.code),
  })));
}

export async function wilayahCodeExists(code: string) {
  const normalized = code.trim();
  if (!/^\d{2}(?:\.\d{2}){0,2}(?:\.\d{4})?$/.test(normalized)) return false;
  const parts = normalized.split('.');
  const level = ({ 1: 'provinces', 2: 'regencies', 3: 'districts', 4: 'villages' } as const)[parts.length];
  if (!level) return false;
  const parentCode = parts.length > 1 ? parts.slice(0, -1).join('.') : undefined;
  const rows = await getWilayah(level, parentCode);
  return rows.some((row) => row.code === normalized);
}

export const childLevel: Record<WilayahLevel, WilayahLevel | null> = {
  provinces: 'regencies', regencies: 'districts', districts: 'villages', villages: null,
};

export async function findWilayahBySegment(level: WilayahLevel, segment: string, parentCode?: string) {
  const rows = await getWilayah(level, parentCode);
  const normalized = segment.toLocaleLowerCase('id-ID');
  return rows.find((row) => `${wilayahSlug(row.name)}-${row.code.replace(/\./g, '-')}` === normalized
    || wilayahSlug(row.name) === normalized || row.code === segment) ?? null;
}

export function levelLabel(level: WilayahLevel) {
  return ({ provinces: 'Provinsi', regencies: 'Kabupaten/Kota', districts: 'Kecamatan', villages: 'Desa/Kelurahan' } as const)[level];
}

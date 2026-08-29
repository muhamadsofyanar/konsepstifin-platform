export type WilayahLevel = 'provinces' | 'regencies' | 'districts' | 'villages';
export type Wilayah = { code: string; name: string; level: WilayahLevel; parentCode?: string };

const API_ROOT = 'https://wilayah.id/api';
const memoryCache = new Map<string, { expiresAt: number; value: Wilayah[] }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const provinceFallback: Wilayah[] = [
  ['11', 'Aceh'], ['12', 'Sumatera Utara'], ['13', 'Sumatera Barat'], ['14', 'Riau'],
  ['15', 'Jambi'], ['16', 'Sumatera Selatan'], ['17', 'Bengkulu'], ['18', 'Lampung'],
  ['19', 'Kepulauan Bangka Belitung'], ['21', 'Kepulauan Riau'], ['31', 'DKI Jakarta'],
  ['32', 'Jawa Barat'], ['33', 'Jawa Tengah'], ['34', 'DI Yogyakarta'], ['35', 'Jawa Timur'],
  ['36', 'Banten'], ['51', 'Bali'], ['52', 'Nusa Tenggara Barat'], ['53', 'Nusa Tenggara Timur'],
  ['61', 'Kalimantan Barat'], ['62', 'Kalimantan Tengah'], ['63', 'Kalimantan Selatan'],
  ['64', 'Kalimantan Timur'], ['65', 'Kalimantan Utara'], ['71', 'Sulawesi Utara'],
  ['72', 'Sulawesi Tengah'], ['73', 'Sulawesi Selatan'], ['74', 'Sulawesi Tenggara'],
  ['75', 'Gorontalo'], ['76', 'Sulawesi Barat'], ['81', 'Maluku'], ['82', 'Maluku Utara'],
  ['91', 'Papua'], ['92', 'Papua Barat'], ['93', 'Papua Selatan'], ['94', 'Papua Tengah'],
  ['95', 'Papua Pegunungan'], ['96', 'Papua Barat Daya'],
].map(([code, name]) => ({ code, name, level: 'provinces' as const }));

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
  if (level === 'provinces' && process.env.NEXT_PHASE === 'phase-production-build') return provinceFallback;
  try {
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
  } catch (error) {
    if (level === 'provinces') return provinceFallback;
    throw error;
  }
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

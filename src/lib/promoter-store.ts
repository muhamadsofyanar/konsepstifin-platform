import { databaseConfigured, getDatabaseClient } from '@/lib/article-store';
import { matchPromoters, normalizeRegionCodes, type PromoterLocationInput, type PromoterMatch, type PublicPromoter } from './promoter-domain';
import { loadPromoters } from './promoter-source';

export type { PublicPromoter, PromoterLocationInput, PromoterMatch } from './promoter-domain';
export { regionMappingCovers } from './promoter-domain';

function normalize(value: unknown) { return String(value ?? '').trim(); }
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
  } catch (error) {
    console.error('Pemetaan promotor belum dapat dimuat.', error);
    return {};
  }
}

export async function getPublicPromoters(): Promise<PublicPromoter[]> {
  const source = (await loadPromoters()).filter((item) => item.active);
  let environmentMap: Record<string, string[]> = {};
  try { environmentMap = JSON.parse(process.env.STIFIN_PROMOTER_REGION_MAP || '{}') as Record<string, string[]>; }
  catch { environmentMap = {}; }
  const databaseMap = await loadRegionMappings();
  return source.map((item) => ({
    ...item,
    regionCodes: normalizeRegionCodes([...item.regionCodes, ...(environmentMap[item.code] ?? []), ...(databaseMap[item.code] ?? [])]),
  }));
}

export async function findPromoterMatch(location: PromoterLocationInput): Promise<PromoterMatch> {
  return matchPromoters(await getPublicPromoters(), location);
}

export async function getServedRegionCodes() {
  const promoters = await getPublicPromoters();
  return [...new Set(promoters.filter((promoter) => promoter.regionCodes.length > 0).flatMap((promoter) => promoter.regionCodes))];
}

export async function setPromoterRegionMapping(code: string, regionCodes: string[]) {
  if (!databaseConfigured()) throw new Error('DATABASE_URL belum dikonfigurasi.');
  await ensureSchema();
  const promoterCode = normalize(code).toUpperCase();
  const values = normalizeRegionCodes(regionCodes).slice(0, 200);
  if (!promoterCode) throw new Error('Kode promotor wajib diisi.');
  const sql = getDatabaseClient();
  await sql`INSERT INTO public_promoter_regions (promoter_code, region_codes) VALUES (${promoterCode}, ${sql.json(values)}) ON CONFLICT (promoter_code) DO UPDATE SET region_codes=EXCLUDED.region_codes, updated_at=NOW()`;
  return { code: promoterCode, regionCodes: values };
}

import { getDatabaseClient, databaseConfigured } from '@/lib/article-store';

export type FamilyPromoScheme = { key: string; paidTests: number; freeTests: number; label: string };
export type PromotionSettings = {
  familyEnabled: boolean;
  workshopEnabled: boolean;
  startDate: string;
  endDate: string;
  minimumPaidTestPrice: number;
  familySchemes: FamilyPromoScheme[];
  workshopPrices: { wsl1: number; wsl2: number; wst: number };
  updatedAt?: string;
};
const DEFAULTS: PromotionSettings = {
  familyEnabled: true,
  workshopEnabled: true,
  startDate: '2026-10-28',
  endDate: '2026-12-31',
  minimumPaidTestPrice: 500000,
  familySchemes: [
    { key: 'family-3-1', paidTests: 3, freeTests: 1, label: '3 tes + 1 gratis' },
    { key: 'family-4-1', paidTests: 4, freeTests: 1, label: '4 tes + 1 gratis' },
    { key: 'family-7-2', paidTests: 7, freeTests: 2, label: '7 tes + 2 gratis' },
  ],
  workshopPrices: { wsl1: 500000, wsl2: 2500000, wst: 1000000 },
};
export const defaultPromotionSettings = (): PromotionSettings => structuredClone(DEFAULTS);
function isDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [y,m,d] = value.split('-').map(Number); const date = new Date(Date.UTC(y,m-1,d)); return date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d; }
function cleanConfig(value: unknown): PromotionSettings {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const schemes = Array.isArray(raw.familySchemes) ? raw.familySchemes : DEFAULTS.familySchemes;
  const familySchemes: FamilyPromoScheme[] = [];
  for (const item of schemes) {
    const key = typeof item === 'string' ? item : item && typeof item === 'object' ? String((item as Record<string, unknown>).key ?? '') : '';
    const match = /^family-(\d{1,3})-(\d{1,3})$/.exec(key);
    if (!match) continue;
    const paidTests = Number(match[1]), freeTests = Number(match[2]);
    if (!Number.isSafeInteger(paidTests) || !Number.isSafeInteger(freeTests) || paidTests < 1 || paidTests > 1000 || freeTests < 1 || freeTests > 1000) continue;
    if (!familySchemes.some(existing => existing.key === key)) familySchemes.push({ key, paidTests, freeTests, label: `${paidTests} tes + ${freeTests} gratis` });
  }
  const prices = raw.workshopPrices && typeof raw.workshopPrices === 'object' ? raw.workshopPrices as Record<string, unknown> : {};
  const money = (v: unknown, fallback: number) => { const n = Number(v); return Number.isSafeInteger(n) && n >= 0 ? n : fallback; };
  const startDate = String(raw.startDate ?? DEFAULTS.startDate), endDate = String(raw.endDate ?? DEFAULTS.endDate);
  return {
    familyEnabled: raw.familyEnabled !== false,
    workshopEnabled: raw.workshopEnabled !== false,
    startDate: isDate(startDate) ? startDate : DEFAULTS.startDate,
    endDate: isDate(endDate) ? endDate : DEFAULTS.endDate,
    minimumPaidTestPrice: Math.max(500000, money(raw.minimumPaidTestPrice, 500000)),
    familySchemes,
    workshopPrices: { wsl1: money(prices.wsl1, DEFAULTS.workshopPrices.wsl1), wsl2: money(prices.wsl2, DEFAULTS.workshopPrices.wsl2), wst: money(prices.wst, DEFAULTS.workshopPrices.wst) },
  };
}
export async function getPromotionSettings(): Promise<PromotionSettings> {
  if (!databaseConfigured()) return defaultPromotionSettings();
  try {
    const sql = getDatabaseClient();
    const [row] = await sql`SELECT config,updated_at FROM platform_promotion_settings WHERE id=1`;
    if (!row) return defaultPromotionSettings();
    return { ...cleanConfig(row.config), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? '') };
  } catch {
    // Public pages should remain readable if the optional promotion table is not ready.
    return defaultPromotionSettings();
  }
}
export function promotionIsActive(settings: PromotionSettings, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  const today = `${get('year')}-${get('month')}-${get('day')}`;
  return today >= settings.startDate && today <= settings.endDate;
}
export async function getActivePromotion() {
  const settings = await getPromotionSettings();
  const active = promotionIsActive(settings);
  return { settings, active, familyActive: active && settings.familyEnabled, workshopActive: active && settings.workshopEnabled };
}
export function familyScheme(settings: PromotionSettings, key: string) {
  return settings.familySchemes.find(item => item.key === key) || null;
}
export function familyPromoTotal(settings: PromotionSettings, key: string) {
  const scheme = familyScheme(settings, key);
  return scheme ? { ...scheme, totalParticipants: scheme.paidTests + scheme.freeTests, minimumTotal: scheme.paidTests * settings.minimumPaidTestPrice } : null;
}
export async function savePromotionSettings(actor: string, input: unknown) {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const startDate = String(raw.startDate ?? ''), endDate = String(raw.endDate ?? '');
  if (!isDate(startDate) || !isDate(endDate) || endDate < startDate) throw new Error('Tanggal promo tidak valid. Tanggal akhir harus sama atau setelah tanggal mulai.');
  const schemes = Array.isArray(raw.familySchemes) ? raw.familySchemes.map(item => typeof item === 'string' ? item : item && typeof item === 'object' ? String((item as Record<string, unknown>).key ?? '') : '') : DEFAULTS.familySchemes.map(x => x.key);
  if (raw.familyEnabled !== false && schemes.length === 0) throw new Error('Pilih setidaknya satu skema Promo Family Test atau nonaktifkan programnya.');
  const config = cleanConfig({ ...raw, familySchemes: schemes });
  if (raw.familyEnabled !== false && config.familySchemes.length === 0) throw new Error('Skema Family Test tidak valid. Gunakan format tes berbayar dan tes gratis, misalnya 3 tes + 1 gratis.');
  const requestedMinimum = Number(raw.minimumPaidTestPrice ?? 500000);
  if (raw.workshopEnabled !== false && Object.values(config.workshopPrices).some(price => price <= 0)) throw new Error('Harga WSL 1, WSL 2, dan WST harus lebih besar dari nol selama promo aktif.');
  if (!Number.isSafeInteger(requestedMinimum) || requestedMinimum < 500000) throw new Error('Harga jual minimal per tes berbayar tidak boleh kurang dari Rp500.000.');
  const sql = getDatabaseClient();
  await sql.begin(async tx => {
    await tx`INSERT INTO platform_promotion_settings(id,config,updated_by,updated_at) VALUES(1,${tx.json(config)},${actor}::uuid,now())
      ON CONFLICT(id) DO UPDATE SET config=EXCLUDED.config,updated_by=EXCLUDED.updated_by,updated_at=now()`;
    await tx`INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES(${actor}::uuid,'promotion.settings.updated','central-promotion',${JSON.stringify({familyEnabled:config.familyEnabled,workshopEnabled:config.workshopEnabled,startDate:config.startDate,endDate:config.endDate,schemeKeys:config.familySchemes.map(s=>s.key),workshopPrices:config.workshopPrices})}::jsonb)`;
  });
  return getPromotionSettings();
}

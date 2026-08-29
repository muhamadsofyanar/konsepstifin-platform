import { sanitizePromoterRows, type PublicPromoter } from './promoter-domain';

type SourceMode = 'national' | 'branch';
type SourceOptions = { mode?: SourceMode; baseUrl?: string; branchCodes?: string[]; manualJson?: string; fetcher?: typeof fetch; now?: () => number };
const FRESH_MS = 15 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { loadedAt: number; data: PublicPromoter[] }>();
function bodyRows(body: unknown) {
  return body && typeof body === 'object' && 'data' in body && Array.isArray(body.data) ? body.data.slice(0, 10_000) : [];
}
export function clearPromoterCacheForTests() { cache.clear(); }
export async function loadPromoters(options: SourceOptions = {}): Promise<PublicPromoter[]> {
  const mode = options.mode ?? (process.env.STIFIN_PROMOTER_MODE === 'branch' ? 'branch' : 'national');
  const base = (options.baseUrl ?? process.env.STIFIN_API_BASE ?? 'https://apro.stifin.id/api').replace(/\/$/, '');
  const branches = options.branchCodes ?? [...new Set((process.env.STIFIN_BRANCH_CODES || process.env.STIFIN_BRANCH_CODE || '')
    .split(',').map((item) => item.trim().toUpperCase()).filter(Boolean))];
  const manualJson = options.manualJson ?? process.env.STIFIN_PROMOTERS_JSON ?? '';
  const now = (options.now ?? Date.now)();
  const fetcher = options.fetcher ?? fetch;
  const key = JSON.stringify([mode, base, branches, Boolean(manualJson)]);
  const existing = cache.get(key);
  if (existing && now - existing.loadedAt <= FRESH_MS) return existing.data;
  try {
    let safe: PublicPromoter[];
    if (manualJson) {
      const parsed: unknown = JSON.parse(manualJson);
      safe = sanitizePromoterRows(bodyRows(Array.isArray(parsed) ? { data: parsed } : parsed));
    } else {
      const targets = mode === 'national' ? [{ url: base + '/proGet/pro/PRO', branch: '' }]
        : branches.map((branch) => ({ url: base + '/proGetCab/pro/' + encodeURIComponent(branch), branch }));
      if (!targets.length) throw new Error('Kode cabang belum dikonfigurasi.');
      const settled = await Promise.allSettled(targets.map(async ({ url, branch }) => {
        const response = await fetcher(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15_000), cache: 'no-store' });
        if (!response.ok || Number(response.headers.get('content-length') || 0) > 12_000_000) throw new Error('Promotor upstream tidak valid.');
        return sanitizePromoterRows(bodyRows(await response.json()), branch);
      }));
      safe = [...new Map(settled.flatMap((item) => item.status === 'fulfilled' ? item.value : []).map((item) => [item.code, item])).values()];
      if (!safe.length && settled.some((item) => item.status === 'rejected')) throw new Error('upstream');
    }
    cache.set(key, { loadedAt: now, data: safe });
    return safe;
  } catch {
    if (existing && now - existing.loadedAt <= STALE_MS) return existing.data;
    throw new Error('Sumber promotor nasional sedang tidak tersedia.');
  }
}

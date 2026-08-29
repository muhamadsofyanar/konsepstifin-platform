import { normalizeBranchCode, sanitizePromoterRows, type PublicPromoter } from './promoter-domain';

export type PromoterSourceMode = 'national' | 'branch' | 'manual' | 'invalid';
export type PromoterSource = 'national' | 'branch' | 'manual' | 'none';
export type PromoterSourceErrorCategory = 'configuration' | 'http' | 'timeout' | 'shape' | null;

export type PromoterSourceStatus = {
  configured: boolean;
  mode: PromoterSourceMode;
  source: PromoterSource;
  rawRows: number;
  safeRows: number;
  activeRows: number;
  inactiveRows: number;
  branchCount: number;
  lastSuccessAt: string | null;
  lastHttpStatus: number | null;
  stale: boolean;
  errorCategory: PromoterSourceErrorCategory;
  message: string | null;
};

export type PromoterSnapshot = {
  promoters: PublicPromoter[];
  status: PromoterSourceStatus;
};

export type SourceOptions = {
  mode?: PromoterSourceMode;
  baseUrl?: string;
  nationalPath?: string;
  branchCodes?: string[];
  manualJson?: string;
  authHeader?: string;
  authValue?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  now?: () => number;
};

type ResolvedSourceOptions = {
  mode: PromoterSourceMode;
  baseUrl: string;
  nationalPath: string;
  branchCodes: string[];
  manualJson: string;
  authHeader: string;
  authValue: string;
  timeoutMs: number;
  fetcher: typeof fetch;
  now: () => number;
};

type CachedSnapshot = {
  loadedAt: number;
  snapshot: PromoterSnapshot;
};

const FRESH_MS = 15 * 60 * 1_000;
const STALE_MS = 24 * 60 * 60 * 1_000;
const MAX_ROWS = 10_000;
const MAX_CONTENT_LENGTH = 12_000_000;
const DEFAULT_BASE_URL = 'https://apro.stifin.id/api';
const DEFAULT_NATIONAL_PATH = '/proGet/pro/PRO';

const cache = new Map<string, CachedSnapshot>();
let lastStatus: PromoterSourceStatus | null = null;

class PromoterSourceError extends Error {
  constructor(
    public readonly category: Exclude<PromoterSourceErrorCategory, null>,
    message: string,
    public readonly httpStatus: number | null = null,
  ) {
    super(message);
    this.name = 'PromoterSourceError';
  }
}

function compact(value: unknown) {
  return String(value ?? '').trim();
}

function parseMode(value: unknown): PromoterSourceMode {
  const normalized = compact(value).toLowerCase();
  if (!normalized) return 'national';
  return normalized === 'national' || normalized === 'branch' || normalized === 'manual'
    ? normalized
    : 'invalid';
}

function resolveOptions(options: SourceOptions): ResolvedSourceOptions {
  const manualJson = options.manualJson ?? process.env.STIFIN_PROMOTERS_JSON ?? '';
  const configuredMode = options.mode ?? parseMode(process.env.STIFIN_PROMOTER_MODE);
  const mode = configuredMode === 'national'
    && options.mode === undefined
    && !compact(process.env.STIFIN_PROMOTER_MODE)
    && compact(manualJson)
    ? 'manual'
    : configuredMode;
  const rawBranches = options.branchCodes ?? (
    process.env.STIFIN_BRANCH_CODES || process.env.STIFIN_BRANCH_CODE || ''
  ).split(',');
  const branchCodes = [...new Set(rawBranches.map(normalizeBranchCode).filter(Boolean))];
  const timeoutValue = options.timeoutMs ?? Number(process.env.STIFIN_API_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(timeoutValue)
    ? Math.min(60_000, Math.max(5_000, Number(timeoutValue)))
    : 15_000;

  return {
    mode,
    baseUrl: compact(options.baseUrl ?? process.env.STIFIN_API_BASE ?? DEFAULT_BASE_URL).replace(/\/$/, ''),
    nationalPath: compact(options.nationalPath ?? process.env.STIFIN_PROMOTER_NATIONAL_PATH ?? DEFAULT_NATIONAL_PATH),
    branchCodes,
    manualJson: compact(manualJson),
    authHeader: compact(options.authHeader ?? process.env.STIFIN_API_AUTH_HEADER),
    authValue: compact(options.authValue ?? process.env.STIFIN_API_AUTH_VALUE),
    timeoutMs,
    fetcher: options.fetcher ?? fetch,
    now: options.now ?? Date.now,
  };
}

function sourceForMode(mode: PromoterSourceMode): PromoterSource {
  if (mode === 'national' || mode === 'branch' || mode === 'manual') return mode;
  return 'none';
}

function configurationMessage(config: ResolvedSourceOptions) {
  if (config.mode === 'invalid') return 'STIFIN_PROMOTER_MODE harus national, branch, atau manual.';
  if (config.mode === 'branch' && !config.branchCodes.length) return 'Mode branch membutuhkan STIFIN_BRANCH_CODE atau STIFIN_BRANCH_CODES.';
  if (config.mode === 'manual' && !config.manualJson) return 'Mode manual membutuhkan STIFIN_PROMOTERS_JSON.';
  if (config.mode === 'national' && !config.nationalPath) return 'Mode national membutuhkan STIFIN_PROMOTER_NATIONAL_PATH.';
  return null;
}

function emptyStatus(config: ResolvedSourceOptions): PromoterSourceStatus {
  const message = configurationMessage(config);
  return {
    configured: message === null,
    mode: config.mode,
    source: message === null ? sourceForMode(config.mode) : 'none',
    rawRows: 0,
    safeRows: 0,
    activeRows: 0,
    inactiveRows: 0,
    branchCount: config.branchCodes.length,
    lastSuccessAt: null,
    lastHttpStatus: null,
    stale: false,
    errorCategory: message ? 'configuration' : null,
    message,
  };
}

function cacheKey(config: ResolvedSourceOptions) {
  return JSON.stringify([
    config.mode,
    config.baseUrl,
    config.nationalPath,
    config.branchCodes,
    config.manualJson,
  ]);
}

function safeHttpsUrl(baseUrl: string, path: string) {
  let url: URL;
  try {
    url = /^https?:\/\//i.test(path)
      ? new URL(path)
      : new URL(path.replace(/^\//, ''), `${baseUrl.replace(/\/$/, '')}/`);
  } catch {
    throw new PromoterSourceError('configuration', 'URL sumber promotor tidak valid.');
  }
  if (url.protocol !== 'https:') {
    throw new PromoterSourceError('configuration', 'URL sumber promotor harus menggunakan HTTPS.');
  }
  return url.toString();
}

function responseRows(body: unknown): unknown[] {
  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new PromoterSourceError('shape', 'Struktur respons promotor tidak dikenali.');
  }
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    throw new PromoterSourceError('shape', 'Field data pada respons promotor harus berupa array.');
  }
  return data.slice(0, MAX_ROWS);
}

function requestHeaders(config: ResolvedSourceOptions) {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (config.authHeader && config.authValue && /^[A-Za-z0-9-]+$/.test(config.authHeader)) {
    headers[config.authHeader] = config.authValue;
  }
  return headers;
}

function errorFrom(error: unknown): PromoterSourceError {
  if (error instanceof PromoterSourceError) return error;
  if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return new PromoterSourceError('timeout', 'Permintaan sumber promotor melewati batas waktu.');
  }
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return new PromoterSourceError('timeout', 'Permintaan sumber promotor melewati batas waktu.');
  }
  return new PromoterSourceError('http', 'Sumber promotor tidak dapat dihubungi.');
}

async function fetchRows(url: string, config: ResolvedSourceOptions) {
  let response: Response;
  try {
    response = await config.fetcher(url, {
      headers: requestHeaders(config),
      redirect: 'error',
      signal: AbortSignal.timeout(config.timeoutMs),
      cache: 'no-store',
    });
  } catch (error) {
    throw errorFrom(error);
  }

  if (!response.ok) {
    throw new PromoterSourceError('http', `Promotor upstream HTTP ${response.status}.`, response.status);
  }
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_CONTENT_LENGTH) {
    throw new PromoterSourceError('shape', 'Respons promotor melebihi batas ukuran.', response.status);
  }
  try {
    return { rows: responseRows(await response.json()), httpStatus: response.status };
  } catch (error) {
    if (error instanceof PromoterSourceError) throw error;
    throw new PromoterSourceError('shape', 'Respons promotor bukan JSON yang valid.', response.status);
  }
}

async function readSource(config: ResolvedSourceOptions) {
  if (config.mode === 'manual') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(config.manualJson);
    } catch {
      throw new PromoterSourceError('configuration', 'STIFIN_PROMOTERS_JSON bukan JSON yang valid.');
    }
    const rows = Array.isArray(parsed) ? parsed.slice(0, MAX_ROWS) : responseRows(parsed);
    return { rows, httpStatus: null as number | null };
  }

  if (config.mode === 'national') {
    return fetchRows(safeHttpsUrl(config.baseUrl, config.nationalPath), config);
  }

  const settled = await Promise.allSettled(config.branchCodes.map(async (branchCode) => {
    const path = `/proGetCab/pro/${encodeURIComponent(branchCode)}`;
    const result = await fetchRows(safeHttpsUrl(config.baseUrl, path), config);
    return {
      rows: result.rows.map((row) => row && typeof row === 'object'
        ? { ...row, __sourceBranch: branchCode }
        : row),
      httpStatus: result.httpStatus,
    };
  }));
  const fulfilled = settled.filter((item): item is PromiseFulfilledResult<{ rows: unknown[]; httpStatus: number }> => item.status === 'fulfilled');
  if (!fulfilled.length) {
    const firstFailure = settled.find((item): item is PromiseRejectedResult => item.status === 'rejected');
    throw errorFrom(firstFailure?.reason);
  }
  return {
    rows: fulfilled.flatMap((item) => item.value.rows).slice(0, MAX_ROWS),
    httpStatus: fulfilled[0]?.value.httpStatus ?? null,
  };
}

function sanitizeRows(rows: unknown[]) {
  const prepared = rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const item = row as Record<string, unknown>;
    return { ...item, Sub: item.Sub ?? item.__sourceBranch };
  });
  return sanitizePromoterRows(prepared).slice(0, MAX_ROWS);
}

export function clearPromoterCacheForTests() {
  cache.clear();
  lastStatus = null;
}

export function getPromoterSourceStatus(): PromoterSourceStatus {
  return lastStatus ?? emptyStatus(resolveOptions({}));
}

export async function loadPromoterSnapshot(options: SourceOptions = {}): Promise<PromoterSnapshot> {
  const config = resolveOptions(options);
  const initialStatus = emptyStatus(config);
  if (!initialStatus.configured) {
    lastStatus = initialStatus;
    throw new Error('Sumber promotor nasional sedang tidak tersedia.');
  }

  const key = cacheKey(config);
  const now = config.now();
  const existing = cache.get(key);
  if (existing && now - existing.loadedAt <= FRESH_MS) {
    lastStatus = existing.snapshot.status;
    return existing.snapshot;
  }

  try {
    const result = await readSource(config);
    const promoters = sanitizeRows(result.rows);
    const activeRows = promoters.filter((promoter) => promoter.active).length;
    const status: PromoterSourceStatus = {
      ...initialStatus,
      rawRows: result.rows.length,
      safeRows: promoters.length,
      activeRows,
      inactiveRows: promoters.length - activeRows,
      lastSuccessAt: new Date(now).toISOString(),
      lastHttpStatus: result.httpStatus,
      stale: false,
      errorCategory: null,
      message: null,
    };
    const snapshot = { promoters, status };
    cache.set(key, { loadedAt: now, snapshot });
    lastStatus = status;
    return snapshot;
  } catch (unknownError) {
    const sourceError = errorFrom(unknownError);
    if (existing && now - existing.loadedAt <= STALE_MS) {
      const status: PromoterSourceStatus = {
        ...existing.snapshot.status,
        stale: true,
        errorCategory: sourceError.category,
        lastHttpStatus: sourceError.httpStatus ?? existing.snapshot.status.lastHttpStatus,
        message: sourceError.message,
      };
      lastStatus = status;
      return { promoters: existing.snapshot.promoters, status };
    }
    lastStatus = {
      ...initialStatus,
      lastHttpStatus: sourceError.httpStatus,
      errorCategory: sourceError.category,
      message: sourceError.message,
    };
    throw new Error('Sumber promotor nasional sedang tidak tersedia.');
  }
}

export async function loadPromoters(options: SourceOptions = {}) {
  return (await loadPromoterSnapshot(options)).promoters;
}

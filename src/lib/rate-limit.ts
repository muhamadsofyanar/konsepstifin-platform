type RateLimitEntry = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  konsepStifinRateLimits?: Map<string, RateLimitEntry>;
};

const entries = globalForRateLimit.konsepStifinRateLimits ?? new Map<string, RateLimitEntry>();
globalForRateLimit.konsepStifinRateLimits = entries;

function clientAddress(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown';
}

export function checkRateLimit(request: Request, namespace: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${namespace}:${clientAddress(request)}`;
  const current = entries.get(key);

  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}


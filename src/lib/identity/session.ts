import { createHash } from 'node:crypto';
import type { Principal } from './access-policy.ts';

export type Account = Omit<Principal, 'sessionValid'>;
export type SessionRecord = {
  tokenHash: string;
  userId: string;
  /** UTC epoch milliseconds, converted by the database adapter. */
  expiresAt: number;
  revokedAt: number | null;
  account: Account | null;
};
export interface SessionReader {
  /** Read session AND current account/roles from trusted storage, without caching.
   * Return null for missing sessions. Never accept account fields from a request.
   */
  findSession(tokenHash: string): Promise<SessionRecord | null>;
}

/** Server-only opaque session resolver. Storage errors propagate; callers must
 * fail closed (e.g. 503), never fall back to legacy/environment admin access.
 */
export async function resolveSession(
  token: unknown, repository: SessionReader, now = Date.now(),
): Promise<Principal | null> {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)
    || !Number.isFinite(now)) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const row = await repository.findSession(tokenHash);
  if (!row || row.tokenHash !== tokenHash || row.revokedAt !== null
    || !Number.isFinite(row.expiresAt) || row.expiresAt <= now) return null;
  const account = row.account;
  if (!account || account.active !== true || typeof account.userId !== 'string'
    || !account.userId.trim() || account.userId !== row.userId
    || !Array.isArray(account.roles) || !account.roles.every(role => typeof role === 'string')
    || (account.promoterCode !== null && typeof account.promoterCode !== 'string')) return null;
  return {
    userId: account.userId, active: true, sessionValid: true,
    roles: [...account.roles], promoterCode: account.promoterCode,
  };
}

import 'server-only';
import postgres from 'postgres';
import { cookies } from 'next/headers';
import { IdentityStore } from './store';
import { ScopedLeadStore } from './scoped-leads';
import { resolveSession } from './session';
import { ACCOUNT_COOKIE } from './http';
const state = globalThis as unknown as { identitySql?: ReturnType<typeof postgres> };
export function getIdentityStore() {
  if (process.env.PLATFORM_IDENTITY_ENABLED !== 'true' || !process.env.DATABASE_URL || !process.env.PLATFORM_ORIGIN)
    throw new Error('Identity is not configured');
  state.identitySql ??= postgres(process.env.DATABASE_URL, { max: 5, connect_timeout: 10 });
  const sql = state.identitySql;
  return new IdentityStore(async (text, values) => [...await sql.unsafe(text, values)]);
}
export async function getAccountPrincipal() {
  const token = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  if (!token) return null;
  return resolveSession(token, getIdentityStore());
}

export function getScopedLeadStore() {
  getIdentityStore();
  const sql = state.identitySql!;
  return new ScopedLeadStore(async (text, values) => [...await sql.unsafe(text, values)]);
}

import { getAccountPrincipal } from './identity/server';

export type AdminPrincipal = { userId: string; email: string; roles: readonly string[] };

/** Current database account and roles are checked on every request. No legacy cookie or environment bypass. */
export async function getAdminPrincipal(): Promise<AdminPrincipal | null> {
  try {
    const principal = await getAccountPrincipal();
    if (!principal || principal.active !== true || principal.sessionValid !== true
      || typeof principal.email !== 'string'
      || !principal.roles.some(role => role === 'admin' || role === 'super_admin')) return null;
    return { userId: principal.userId, email: principal.email, roles: [...principal.roles] };
  } catch { return null; }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminPrincipal()) !== null;
}

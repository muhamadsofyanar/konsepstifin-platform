import { getAdminPrincipal } from '@/lib/admin-auth';

/** Cookie-authenticated mutations require the configured canonical origin. */
export function isSameOriginMutation(request: Request): boolean {
  const origin = process.env.PLATFORM_ORIGIN;
  if (!origin) return false;
  try { return new URL(origin).origin === origin && request.headers.get('origin') === origin; }
  catch { return false; }
}
export async function requireAdminRequest(request: Request) {
  if (!isSameOriginMutation(request)) return null;
  try { return await getAdminPrincipal(); } catch { return null; }
}

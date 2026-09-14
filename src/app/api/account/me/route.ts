import { getAccountPrincipal } from '@/lib/identity/server';
export const runtime = 'nodejs';
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const principal = await getAccountPrincipal();
    if (!principal) return Response.json({ message: 'Silakan masuk.' }, { status: 401, headers });
    return Response.json({ userId: principal.userId, roles: principal.roles, promoterCode: principal.promoterCode }, { headers });
  } catch { return Response.json({ message: 'Layanan akun sementara tidak tersedia.' }, { status: 503, headers }); }
}

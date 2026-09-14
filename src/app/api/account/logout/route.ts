import { cookies } from 'next/headers';
import { getIdentityStore } from '@/lib/identity/server';
import { handleLogout, ACCOUNT_COOKIE } from '@/lib/identity/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try { return await handleLogout(request, getIdentityStore(), process.env.PLATFORM_ORIGIN!, process.env.NODE_ENV === 'production', (await cookies()).get(ACCOUNT_COOKIE)?.value ?? ''); }
  catch { return Response.json({ message: 'Layanan akun belum tersedia.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}

import { getIdentityStore } from '@/lib/identity/server';
import { handleLogin } from '@/lib/identity/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try { return await handleLogin(request, getIdentityStore(), process.env.PLATFORM_ORIGIN!, process.env.NODE_ENV === 'production'); }
  catch { return Response.json({ message: 'Layanan akun belum tersedia.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}

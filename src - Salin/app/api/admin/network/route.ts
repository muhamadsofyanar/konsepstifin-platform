import { getAdminPrincipal } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/lib/admin-request';
import { readAdminJson } from '@/lib/admin-json';
import { getNetworkOverview, issuePromoterInvite } from '@/lib/network-store';
export const runtime = 'nodejs';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
export async function GET() {
  if (!await getAdminPrincipal()) return reply({ message: 'Akses ditolak.' }, 401);
  try { return reply(await getNetworkOverview()); }
  catch { return reply({ message: 'Jaringan belum tersedia. Jalankan impor jaringan cabang.' }, 503); }
}
export async function POST(request: Request) {
  const actor = await requireAdminRequest(request);
  if (!actor) return reply({ message: 'Akses ditolak.' }, 403);
  let data;
  try {
    data = await readAdminJson(request);
    if (Object.keys(data).some(key => key !== 'userId') || typeof data.userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.userId)) throw new Error('Invalid');
  } catch { return reply({ message: 'Akun tujuan tidak valid.' }, 400); }
  try { return reply(await issuePromoterInvite(data.userId as string, actor.userId)); }
  catch { return reply({ message: 'Tautan tidak dapat diterbitkan. Pastikan akun anggota masih menunggu aktivasi.' }, 400); }
}

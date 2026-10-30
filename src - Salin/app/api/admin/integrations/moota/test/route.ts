import { requireAdminRequest } from '@/lib/admin-request';
import { testMootaConnection } from '@/lib/moota-client';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!await requireAdminRequest(request)) return Response.json({ message: 'Akses ditolak.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  try {
    const result = await testMootaConnection();
    return Response.json({ ...result, message: `Moota terhubung. Rekening yang terdeteksi: ${result.bankAccounts}.` }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Tes koneksi Moota gagal.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}

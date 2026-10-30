import { getAdminPrincipal } from '@/lib/admin-auth';
import { listMootaUnmatchedEvents } from '@/lib/moota-store';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!await getAdminPrincipal()) return Response.json({ message: 'Akses admin diperlukan.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    const events = await listMootaUnmatchedEvents(50);
    return Response.json({ events }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
  } catch {
    return Response.json({ message: 'Riwayat webhook Moota belum tersedia. Pastikan migrasi 011 dijalankan.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

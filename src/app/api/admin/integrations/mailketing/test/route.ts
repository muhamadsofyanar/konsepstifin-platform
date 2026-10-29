import { requireAdminRequest } from '@/lib/admin-request';
import { testMailketingConnection } from '@/lib/mailketing-client';
export const dynamic = 'force-dynamic';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const actor = await requireAdminRequest(request);
  if (!actor || !actor.roles.includes('super_admin')) return reply({ message: 'Hanya pemilik platform yang dapat menguji integrasi.' }, 403);
  try { const result = await testMailketingConnection(); return reply({ ...result, message: 'Mailketing terhubung. Kredensial dan akses API valid.' }); }
  catch (error) { return reply({ message: error instanceof Error ? error.message : 'Tes koneksi Mailketing gagal.' }, 400); }
}

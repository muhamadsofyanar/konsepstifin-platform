import { getAdminPrincipal } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/lib/admin-request';
import { readAdminJson } from '@/lib/admin-json';
import { getPromotionSettings, savePromotionSettings } from '@/lib/promotion-store';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  const actor = await getAdminPrincipal();
  if (!actor) return reply({ message: 'Silakan masuk.' }, 401);
  if (!actor.roles.includes('super_admin')) return reply({ message: 'Hanya pemilik platform yang dapat mengubah promo pusat.' }, 403);
  try { return reply({ settings: await getPromotionSettings() }); }
  catch { return reply({ message: 'Pengaturan promo belum dapat dibaca. Jalankan migrasi 012.' }, 503); }
}
export async function PUT(request: Request) {
  const actor = await requireAdminRequest(request);
  if (!actor || !actor.roles.includes('super_admin')) return reply({ message: 'Hanya pemilik platform yang dapat mengubah promo pusat.' }, 403);
  try { return reply({ settings: await savePromotionSettings(actor.userId, await readAdminJson(request)) }); }
  catch (error) { return reply({ message: error instanceof Error && !('code' in error) ? error.message : 'Promo pusat belum tersimpan.' }, 400); }
}

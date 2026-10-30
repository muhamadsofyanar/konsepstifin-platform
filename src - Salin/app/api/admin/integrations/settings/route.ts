import { getAdminPrincipal } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/lib/admin-request';
import { readAdminJson } from '@/lib/admin-json';
import { getPublicIntegrationSettings, saveIntegrationSettings } from '@/lib/integration-settings';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  const actor = await getAdminPrincipal();
  if (!actor) return reply({ message: 'Silakan masuk.' }, 401);
  if (!actor.roles.includes('super_admin')) return reply({ message: 'Hanya pemilik platform yang dapat melihat pengaturan integrasi.' }, 403);
  try { return reply({ settings: await getPublicIntegrationSettings() }); }
  catch { return reply({ message: 'Pengaturan integrasi belum dapat dibaca. Pastikan migrasi 012 sudah dijalankan.' }, 503); }
}
export async function PUT(request: Request) {
  const actor = await requireAdminRequest(request);
  if (!actor || !actor.roles.includes('super_admin')) return reply({ message: 'Hanya pemilik platform yang dapat mengubah integrasi.' }, 403);
  try {
    const body = await readAdminJson(request);
    if (Object.keys(body).some(key => !['moota', 'starsender', 'mailketing', 'openai', 'clearSecrets'].includes(key))) throw new Error('Isian pengaturan tidak dikenal.');
    return reply({ settings: await saveIntegrationSettings(actor.userId, body) });
  } catch (error) {
    return reply({ message: error instanceof Error && !('code' in error) ? error.message : 'Pengaturan integrasi belum tersimpan.' }, 400);
  }
}

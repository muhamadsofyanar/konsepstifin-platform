import { getAccountPrincipal } from '@/lib/identity/server';
import { accessScope } from '@/lib/identity/access-policy';
import { isSameOriginMutation } from '@/lib/admin-request';
import { listWhatsappTemplates, saveWhatsappTemplate, toggleWhatsappTemplate } from '@/lib/whatsapp-store';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
function admin(principal: Awaited<ReturnType<typeof getAccountPrincipal>>) { return Boolean(principal?.active && principal.sessionValid && principal.roles.some(role => role === 'admin' || role === 'super_admin')); }
export async function GET() {
  try {
    const principal = await getAccountPrincipal();
    if (!principal || accessScope(principal).kind === 'none') return json({ message: 'Akses template tidak tersedia.' }, 401);
    return json({ templates: await listWhatsappTemplates(principal, admin(principal)) });
  } catch { return json({ message: 'Template WhatsApp belum tersedia. Jalankan migrasi 015.' }, 503); }
}
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return json({ message: 'Origin permintaan tidak valid.' }, 403);
  try {
    const principal = await getAccountPrincipal();
    if (!admin(principal)) return json({ message: 'Hanya admin yang dapat mengelola template.' }, 403);
    const input = await request.json() as Record<string, unknown>;
    if (input.action === 'toggle') return json({ template: await toggleWhatsappTemplate(principal!, Number(input.id), input.active === true) });
    const template = await saveWhatsappTemplate(principal!, { id: input.id ? Number(input.id) : undefined, title: String(input.title ?? ''), category: String(input.category ?? 'umum'), body: String(input.body ?? ''), active: input.active !== false, mediaUrl: typeof input.mediaUrl === 'string' ? input.mediaUrl : undefined });
    return json({ template, message: 'Template berhasil disimpan.' });
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Template gagal disimpan.' }, 400); }
}

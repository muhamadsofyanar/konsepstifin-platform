import { getAccountPrincipal } from '@/lib/identity/server';
import { isSameOriginMutation } from '@/lib/admin-request';
import { createWhatsappDripCampaign, listWhatsappDripCampaigns, setWhatsappDripCampaignActive } from '@/lib/whatsapp-store';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
function admin(principal: Awaited<ReturnType<typeof getAccountPrincipal>>) { return Boolean(principal?.active && principal.sessionValid && principal.roles.some(role => role === 'admin' || role === 'super_admin')); }
export async function GET() {
  try { const principal = await getAccountPrincipal(); if (!admin(principal)) return json({ message: 'Akses admin diperlukan.' }, 403); return json({ campaigns: await listWhatsappDripCampaigns() }); }
  catch { return json({ message: 'Daftar campaign belum tersedia. Jalankan migrasi 016.' }, 503); }
}
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return json({ message: 'Origin permintaan tidak valid.' }, 403);
  try {
    const principal = await getAccountPrincipal();
    if (!admin(principal)) return json({ message: 'Hanya admin yang dapat membuat campaign.' }, 403);
    const input = await request.json() as Record<string, unknown>;
    if (input.action === 'toggle') {
      const campaign = await setWhatsappDripCampaignActive(principal!, String(input.campaignId || ''), input.active === true);
      return json({ campaign, message: campaign.active ? 'Campaign diaktifkan kembali.' : 'Campaign dihentikan sementara.' });
    }
    const result = await createWhatsappDripCampaign(principal!, {
      name: String(input.name ?? ''), description: String(input.description ?? ''),
      leadIds: Array.isArray(input.leadIds) ? input.leadIds.map(Number) : [],
      scheduledAt: String(input.scheduledAt ?? ''),
      steps: Array.isArray(input.steps) ? input.steps.map((step) => ({ delayMinutes: Number((step as Record<string, unknown>)?.delayMinutes), message: String((step as Record<string, unknown>)?.message ?? '') })) : [],
    });
    return json({ ...result, message: `${result.enrolled} kontak dimasukkan ke campaign ${String(input.name ?? '')}. Mulai: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(result.scheduledAt))} WIB.` }, 201);
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Campaign gagal dibuat.' }, 400); }
}

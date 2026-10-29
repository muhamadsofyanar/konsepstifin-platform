import { getAdminPrincipal } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/lib/admin-request';
import { createMarketingCampaign, listMarketingCampaigns, listMarketingContacts, setMarketingConsent } from '@/lib/marketing-store';
import { starsenderStatus } from '@/lib/starsender-client';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
export async function GET(request: Request) {
  if (!await getAdminPrincipal()) return json({ message: 'Akses admin diperlukan.' }, 401);
  try {
    const url = new URL(request.url);
    const [contacts, campaigns] = await Promise.all([listMarketingContacts(url.searchParams.get('q') || ''), listMarketingCampaigns(20)]);
    return json({ contacts, campaigns, starsender: starsenderStatus() });
  } catch { return json({ message: 'Daftar kontak marketing belum dapat dimuat. Pastikan migrasi 011 sudah dijalankan.' }, 503); }
}
export async function POST(request: Request) {
  const actor = await requireAdminRequest(request);
  if (!actor) return json({ message: 'Akses ditolak atau origin tidak valid.' }, 403);
  try {
    const input = await request.json() as Record<string, unknown>;
    if (input.action === 'consent') {
      const lead = await setMarketingConsent(Number(input.leadId), input.enabled === true, actor.userId, input.confirmation === true);
      return json({ lead, message: input.enabled === true ? 'Persetujuan marketing diaktifkan.' : 'Persetujuan marketing dicabut.' });
    }
    if (input.action === 'campaign') {
      if (typeof input.title !== 'string' || typeof input.message !== 'string') throw new Error('Judul dan isi kampanye harus berupa teks.');
      if (!Array.isArray(input.leadIds) || input.leadIds.length > 100 || input.leadIds.some(id => typeof id !== 'number')) throw new Error('Daftar kontak tidak valid.');
      const result = await createMarketingCampaign({ title: String(input.title ?? ''), message: String(input.message ?? ''), leadIds: input.leadIds as number[], actor: actor.userId });
      return json({ ...result, message: `${result.queued} pesan dimasukkan ke antrean StarSender.` }, 201);
    }
    throw new Error('Tindakan marketing tidak dikenal.');
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Permintaan marketing gagal.' }, 400); }
}

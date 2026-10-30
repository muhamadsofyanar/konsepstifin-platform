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
    return json({ contacts, campaigns, starsender: await starsenderStatus() });
  } catch { return json({ message: 'Data marketing belum dapat dimuat. Pastikan migrasi 011 sampai 017 yang diperlukan sudah dijalankan.' }, 503); }
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
      if (input.scheduledAt !== undefined && typeof input.scheduledAt !== 'string') throw new Error('Jadwal kirim harus berupa tanggal dan waktu.');
      if (input.sendMode !== undefined && typeof input.sendMode !== 'string') throw new Error('Mode pengiriman tidak valid.');
      const result = await createMarketingCampaign({ title: String(input.title ?? ''), message: String(input.message ?? ''), leadIds: input.leadIds as number[], actor: actor.userId, scheduledAt: typeof input.scheduledAt === 'string' ? input.scheduledAt : undefined, sendMode: typeof input.sendMode === 'string' ? input.sendMode : undefined, mediaUrl: typeof input.mediaUrl === 'string' ? input.mediaUrl : undefined });
      return json({ ...result, message: `${result.queued} pesan dijadwalkan pada ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(result.scheduledAt))} WIB.` }, 201);
    }
    throw new Error('Tindakan marketing tidak dikenal.');
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Permintaan marketing gagal.' }, 400); }
}

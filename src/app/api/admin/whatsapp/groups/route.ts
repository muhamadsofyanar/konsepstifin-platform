import { getAccountPrincipal } from '@/lib/identity/server';
import { isSameOriginMutation } from '@/lib/admin-request';
import {
  createWhatsappGroupBroadcast,
  listWhatsappGroupsDashboard,
  saveWhatsappGroupPreset,
  setWhatsappGroupBroadcastStatus,
  setWhatsappGroupBroadcastAllowed,
  syncWhatsappGroups,
  toggleWhatsappGroupPreset,
} from '@/lib/whatsapp-groups';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
function admin(principal: Awaited<ReturnType<typeof getAccountPrincipal>>) {
  return Boolean(principal?.active && principal.sessionValid && principal.roles.some(role => role === 'admin' || role === 'super_admin'));
}
export async function GET() {
  try {
    const principal = await getAccountPrincipal();
    if (!admin(principal)) return json({ message: 'Akses admin diperlukan.' }, 403);
    return json(await listWhatsappGroupsDashboard());
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Data grup WhatsApp belum tersedia. Jalankan migrasi 016.' }, 503); }
}
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return json({ message: 'Origin permintaan tidak valid.' }, 403);
  try {
    const principal = await getAccountPrincipal();
    if (!admin(principal)) return json({ message: 'Hanya admin yang dapat mengelola grup dan broadcast.' }, 403);
    const input = await request.json() as Record<string, unknown>;
    if (input.action === 'sync') return json({ ...await syncWhatsappGroups(principal!), message: 'Daftar grup berhasil disinkronkan dari StarSender.' });
    if (input.action === 'allow') return json({ group: await setWhatsappGroupBroadcastAllowed(principal!, String(input.groupJid || ''), input.allowed === true), message: input.allowed === true ? 'Grup diizinkan menerima broadcast.' : 'Izin broadcast grup dinonaktifkan.' });
    if (input.action === 'savePreset') {
      const preset = await saveWhatsappGroupPreset(principal!, { id: input.id ? String(input.id) : undefined, name: String(input.name || ''), description: String(input.description || ''), message: String(input.message || ''), groupJids: Array.isArray(input.groupJids) ? input.groupJids.map(String) : [], active: input.active !== false });
      return json({ preset, message: 'Preset grup berhasil disimpan.' });
    }
    if (input.action === 'togglePreset') return json({ preset: await toggleWhatsappGroupPreset(principal!, String(input.id || ''), input.active === true), message: 'Status preset diperbarui.' });
    if (input.action === 'createBroadcast') {
      const broadcast = await createWhatsappGroupBroadcast(principal!, { name: String(input.name || ''), message: String(input.message || ''), presetId: input.presetId ? String(input.presetId) : undefined, groupJids: Array.isArray(input.groupJids) ? input.groupJids.map(String) : [], scheduledAt: String(input.scheduledAt || ''), confirmGroupPermission: input.confirmGroupPermission === true });
      return json({ broadcast, message: `Broadcast dibuat untuk ${broadcast.groups} grup. Jadwal: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(broadcast.scheduledAt))} WIB.` }, 201);
    }
    if (input.action === 'broadcastStatus') {
      const action = String(input.statusAction || '');
      if (!['pause','resume','cancel'].includes(action)) throw new Error('Tindakan broadcast tidak valid.');
      const broadcast = await setWhatsappGroupBroadcastStatus(principal!, String(input.id || ''), action as 'pause' | 'resume' | 'cancel');
      return json({ broadcast, message: action === 'pause' ? 'Broadcast dijeda.' : action === 'resume' ? 'Broadcast dilanjutkan.' : 'Broadcast dibatalkan.' });
    }
    throw new Error('Tindakan grup WhatsApp tidak dikenal.');
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Permintaan grup WhatsApp gagal.' }, 400); }
}

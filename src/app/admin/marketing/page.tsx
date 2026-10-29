import { redirect } from 'next/navigation';
import { getAdminPrincipal } from '@/lib/admin-auth';
import { listMarketingContacts } from '@/lib/marketing-store';
import { starsenderStatus } from '@/lib/starsender-client';
import MarketingManager from './marketing-manager';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marketing WhatsApp | Konsep STIFIn' };
export default async function MarketingPage() {
  if (!await getAdminPrincipal()) redirect('/admin/login');
  let contacts: Awaited<ReturnType<typeof listMarketingContacts>> = [];
  let error = '';
  try { contacts = await listMarketingContacts(); } catch { error = 'Daftar kontak belum tersedia. Jalankan migrasi 011-integrations.sql.'; }
  return <main className="portal-page">
    <header className="portal-heading"><div><span className="portal-eyebrow">MARKETING / WHATSAPP</span><h1>Kampanye StarSender</h1><p>Kelola persetujuan promosi dan kirim pesan ke kontak yang sudah memberikan persetujuan eksplisit.</p></div><span className="portal-version">{starsenderStatus().configured ? 'API terkonfigurasi' : 'API belum dikonfigurasi'}</span></header>
    {!starsenderStatus().configured && <p className="portal-error" role="alert">STARSENDER_API_KEY belum diatur. Pesan kampanye tidak dapat dikirim sampai API key disimpan di environment Coolify.</p>}
    {error && <p className="portal-error" role="alert">{error}</p>}
    <MarketingManager initialContacts={contacts as unknown as Array<Record<string, unknown>>} />
  </main>;
}

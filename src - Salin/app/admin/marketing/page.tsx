import { redirect } from 'next/navigation';
import { getAdminPrincipal } from '@/lib/admin-auth';
import { listMarketingCampaigns, listMarketingContacts } from '@/lib/marketing-store';
import { starsenderStatus } from '@/lib/starsender-client';
import MarketingManager from './marketing-manager';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marketing WhatsApp | Konsep STIFIn' };
export default async function MarketingPage() {
  if (!await getAdminPrincipal()) redirect('/admin/login');
  const senderStatus = await starsenderStatus();
  type MarketingContact = (Awaited<ReturnType<typeof listMarketingContacts>>)[number];
  type MarketingCampaign = (Awaited<ReturnType<typeof listMarketingCampaigns>>)[number];
  let contacts: MarketingContact[] = [];
  let campaigns: MarketingCampaign[] = [];
  let error = '';
  try { [contacts, campaigns] = await Promise.all([listMarketingContacts(), listMarketingCampaigns(20)]); } catch { error = 'Data marketing belum tersedia. Jalankan migrasi 011-integrations.sql dan 013-whatsapp-inbound-first.sql serta 017-whatsapp-personal-schedule.sql.'; }
  return <main className="portal-page">
    <header className="portal-heading"><div><span className="portal-eyebrow">MARKETING / WHATSAPP</span><h1>Kampanye StarSender</h1><p>Kelola persetujuan promosi. Jadwalkan pesan personal atau kampanye untuk kontak berizin. Pilih pengiriman langsung melalui StarSender atau mode menunggu chat pelanggan.</p></div><span className="portal-version">{senderStatus.configured ? 'API terkonfigurasi' : 'API belum dikonfigurasi'}</span></header>
    {!senderStatus.configured && <p className="portal-error" role="alert">API StarSender belum diatur. Buka Pengaturan Admin → Integrasi eksternal untuk memasukkan API key tanpa redeploy.</p>}
    {error && <p className="portal-error" role="alert">{error}</p>}
    <MarketingManager initialContacts={contacts as unknown as Array<Record<string, unknown>>} initialCampaigns={campaigns as unknown as Array<Record<string, unknown>>} />
  </main>;
}

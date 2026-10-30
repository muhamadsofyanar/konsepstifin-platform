import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import { accessScope } from '@/lib/identity/access-policy';
import WhatsappWorkspace from './whatsapp-workspace';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'WhatsApp Command Center | KonsepSTIFIn' };
export default async function WhatsappPage() {
  const principal = await getAccountPrincipal();
  if (!principal || accessScope(principal).kind === 'none') redirect('/akun');
  const isAdmin = principal.roles.some(role => role === 'admin' || role === 'super_admin');
  return <main className="portal-page whatsapp-page">
    <header className="portal-heading"><div><span className="portal-eyebrow">CUSTOMER RELATIONSHIP / WHATSAPP</span><h1>WhatsApp Command Center</h1><p>Pusat percakapan, tindak lanjut, dan otomasi pelanggan KonsepSTIFIn.</p></div><span className="portal-version">{isAdmin ? 'Administrator' : 'Ruang Promotor'}</span></header>
    <WhatsappWorkspace isAdmin={isAdmin} />
  </main>;
}

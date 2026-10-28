import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import { getPromoterPortal } from '@/lib/network-store';
import LogoutButton from './logout-button';
export const dynamic = 'force-dynamic';
export default async function PromoterPortalPage() {
  let principal;
  try { principal = await getAccountPrincipal(); }
  catch { return <main className="portal-shell"><section className="portal-card"><h1>Layanan akun belum tersedia</h1><p>Silakan coba kembali setelah layanan akun terhubung.</p><Link href="/akun/login">Kembali ke halaman masuk</Link></section></main>; }
  if (!principal || !principal.active || !principal.sessionValid) redirect('/akun/login');
  const isAdmin = principal.roles.some(role => role === 'admin' || role === 'super_admin');
  const header = <header className="portal-header"><Link className="portal-brand" href="/">Konsep STIFIn</Link><nav>{isAdmin && <Link href="/admin">Dashboard pengelola</Link>}<LogoutButton/></nav></header>;
  if (!principal.roles.includes('promoter') && !isAdmin) return <main className="portal-shell">{header}<section className="portal-card"><h1>Akses promotor diperlukan</h1><p>Akun ini belum memiliki akses promotor. Hubungi kepala cabang untuk memeriksa akun Anda.</p></section></main>;
  let portal;
  try { portal = await getPromoterPortal(principal.userId); }
  catch { return <main className="portal-shell">{header}<section className="portal-card"><h1>Data cabang belum tersedia</h1><p>Hubungi kepala cabang untuk memeriksa konfigurasi dan impor jaringan.</p></section></main>; }
  if (!portal) return <main className="portal-shell">{header}<section className="portal-card"><h1>Keanggotaan cabang belum tersedia</h1><p>Akun Anda belum dipetakan ke jaringan cabang. Hubungi kepala cabang untuk memeriksa keanggotaan.</p></section></main>;
  const { profile, leads } = portal;
  return <main className="portal-shell">{header}
    <section className="portal-welcome"><span className="portal-eyebrow">RUANG PROMOTOR</span><h1>Halo, {profile.name}.</h1><p>Profil cabang dan lead yang ditugaskan kepada Anda.</p></section>
    <div className="portal-profile-grid"><section className="portal-card"><span className="portal-eyebrow">PROFIL ANDA</span><h2>{profile.name}</h2><dl className="portal-details"><dt>Kode promotor</dt><dd>{profile.promoterCode}</dd><dt>Email</dt><dd>{profile.email}</dd><dt>Area layanan</dt><dd>{profile.area || 'Belum ditentukan'}</dd><dt>Peran cabang</dt><dd>{profile.isManager ? 'Kepala Cabang' : 'Promotor'}</dd></dl></section>
    <section className="portal-card"><span className="portal-eyebrow">CABANG RESMI</span><h2>{profile.branchName}</h2><p>Kode cabang: <strong>{profile.branchCode}</strong></p><h3>Voucher tes STIFIn</h3><p>Pembelian voucher promotor dilakukan melalui cabang sendiri. Hubungi kepala cabang untuk harga dan prosedur pembelian.</p><p className="portal-notice"><strong>Saldo belum terhubung.</strong> Modul saldo dan transaksi voucher belum tersedia di portal ini.</p></section></div>
    <section className="portal-card portal-leads"><div className="portal-section-title"><div><span className="portal-eyebrow">LEAD ANDA</span><h2>Kontak yang ditugaskan</h2></div><span className="portal-count">{portal.total} lead</span></div><p>Hanya lead yang ditugaskan kepada Anda dan telah memberikan persetujuan untuk dihubungi.</p>
    {portal.total > leads.length && leads.length > 0 && <p className="portal-muted">Menampilkan {leads.length} lead terbaru dari {portal.total} lead.</p>}
    {!leads.length ? <div className="portal-empty"><h3>Belum ada lead yang ditugaskan</h3><p>Lead akan tampil setelah kepala cabang menugaskannya kepada Anda.</p></div> : <div className="portal-table-wrap"><table><thead><tr><th>Nama</th><th>Kontak</th><th>Kota</th><th>Status</th></tr></thead><tbody>{leads.map(lead => <tr key={lead.id}><td>{lead.name}</td><td>{lead.phone || '—'}<br/>{lead.email || '—'}</td><td>{lead.city || '—'}</td><td>{lead.status}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}

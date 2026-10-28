import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminPrincipal } from '@/lib/admin-auth';
import { getNetworkOverview } from '@/lib/network-store';
import InviteButton from './invite-button';
import './network.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Jaringan Cabang | Konsep STIFIn', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default async function BranchNetworkPage() {
  if (!await getAdminPrincipal()) redirect('/admin/login');
  let network;
  try { network = await getNetworkOverview(); } catch { network = null; }
  return <main className="branch-network"><header className="network-header"><Link href="/admin">← Dashboard pengelola</Link><Link href="/admin/promotor">Pemetaan promotor nasional ↗</Link></header>
    <section className="network-title"><span>JARINGAN CABANG SENDIRI</span><h1>Akun promotor cabang</h1><p>Kelola anggota cabang dan siapkan akses pribadi mereka.</p></section>
    {!network || !network.members.length ? <section className="network-card"><h2>Jaringan belum disiapkan</h2><p>Jalankan migrasi akun dan impor jaringan melalui <code>scripts/promoter-admin.mjs import</code> di server. Impor memvalidasi 11 anggota cabang, termasuk kepala cabang.</p><p>Setelah impor berhasil, muat ulang halaman ini untuk menerbitkan tautan aktivasi pribadi.</p></section> : <>
      <section className="network-summary network-card"><div><span>CABANG RESMI</span><h2>{network.branch.name}</h2><p>{network.branch.code} · {network.branch.regencyName} ({network.branch.regencyCode})</p><p>Kepala cabang: {network.members.find(member => member.isManager)?.name || network.branch.managerCode}</p></div><div className="network-metrics"><div><strong>{network.members.length}</strong><span>Anggota termasuk kepala</span></div><div><strong>{network.members.filter(member => member.active).length}</strong><span>Akun aktif</span></div><div><strong>{network.members.filter(member => !member.active).length}</strong><span>Menunggu aktivasi</span></div></div></section>
      <section className="network-card"><h2>Anggota jaringan</h2><p>Cabang terdiri dari kepala cabang dan sepuluh promotor. Email anggota dan tautan aktivasi bersifat pribadi. Tautan hanya dapat diterbitkan untuk akun yang belum aktif; penerbitan ulang membatalkan tautan lama.</p><div className="network-table-wrap"><table><thead><tr><th>Anggota</th><th>Area layanan</th><th>Status akun</th><th>Akses pribadi</th></tr></thead><tbody>{network.members.map(member => <tr key={member.userId}><td><strong>{member.name}</strong><span>{member.promoterCode}{member.isManager ? ' · Kepala Cabang' : ''}</span><span>{member.email}</span></td><td>{member.area || 'Belum ditentukan'}</td><td><span className={member.active ? 'network-status active' : 'network-status'}>{member.active ? 'Aktif' : 'Menunggu aktivasi'}</span></td><td>{member.active ? <span className="network-muted">Akun sudah memiliki akses.</span> : <InviteButton userId={member.userId}/>}</td></tr>)}</tbody></table></div></section>
      <section className="network-card"><h2>Alur voucher cabang</h2><p>Promotor membeli voucher dari cabang sendiri. Modul saldo, harga, dan transaksi voucher belum terhubung. Halaman ini menyiapkan keanggotaan dan akses akun.</p></section>
    </>}
  </main>;
}

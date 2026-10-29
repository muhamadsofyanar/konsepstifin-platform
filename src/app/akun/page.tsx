import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import { getPromoterPortal } from '@/lib/network-store';
import MemberMenu from './components/member-menu';
import LogoutButton from './logout-button';
export const dynamic = 'force-dynamic';
export default async function PromoterPortalPage() {
    let principal;
    try {
        principal = await getAccountPrincipal();
    }
    catch {
        return <main className="portal-shell"><section className="portal-card"><h1>Layanan akun belum tersedia</h1><p>Silakan coba kembali setelah layanan akun terhubung.</p><Link href="/akun/login">Kembali ke halaman masuk</Link></section></main>;
    }
    if (!principal || !principal.active || !principal.sessionValid)
        redirect('/akun/login');
    const isAdmin = principal.roles.some(role => role === 'admin' || role === 'super_admin');
    const isAffiliate = principal.roles.includes('affiliate');
    if (isAdmin) redirect('/admin');
    const header = <><header className="portal-header"><Link className="portal-brand" href="/">KonsepSTIFIn</Link><nav><Link href="/belajar?tab=catalog">Katalog kelas</Link><LogoutButton /></nav></header><MemberMenu roles={principal.roles} active="/akun"/></>;
    if (!principal.roles.includes('promoter') && !isAffiliate)
        return <main className="portal-shell">{header}<section className="portal-card"><span className="portal-eyebrow">AKUN PESERTA</span><h1>Selamat datang di akun Anda.</h1><p>Akun Anda terdaftar sebagai peserta, bukan akun promotor. Gunakan akun ini untuk kelas, ebook, pembelian, dan sertifikat. Untuk mengajukan layanan tes, Anda juga dapat langsung memilih produk tanpa membuat akun baru.</p><div className="member-shortcuts"><Link href="/produk/layanan/tesPersonal"><strong>Ajukan Tes STIFIn</strong><span>Lihat manfaat, proses, harga, dan ajukan kebutuhan tes.</span><small>Lihat layanan →</small></Link><Link href="/tes-stifin"><strong>Promo Family Test</strong><span>Periksa skema promo pusat jika sedang aktif.</span><small>Lihat promo →</small></Link></div><Link className="member-primary-action" href="/belajar?tab=classes">Lanjut ke kelas saya →</Link></section><section className="member-shortcuts" aria-label="Akses cepat peserta"><Link href="/belajar?tab=classes"><strong>Kelas saya</strong><span>Lanjutkan materi dan lihat progres.</span><small>Buka kelas →</small></Link><Link href="/belajar?tab=orders"><strong>Pembelian</strong><span>Periksa tagihan dan pembayaran.</span><small>Lihat pesanan →</small></Link><Link href="/belajar?tab=certificates"><strong>Sertifikat</strong><span>Lihat dan cetak sertifikat kelas.</span><small>Buka sertifikat →</small></Link><Link href="/belajar?tab=support"><strong>Bantuan</strong><span>Hubungi pengelola terkait akun atau kelas.</span><small>Ajukan bantuan →</small></Link></section></main>;
    if (isAffiliate && !principal.roles.includes('promoter'))
        return <main className="portal-shell">{header}<section className="portal-welcome"><span className="portal-eyebrow">RUANG AFFILIATE</span><h1>Selamat datang di pusat mitra.</h1><p>Akun Anda terdaftar sebagai affiliate. Gunakan tautan dan materi promosi sesuai ketentuan kerja sama. Aktivitas affiliate tidak otomatis memberikan status promotor aktif.</p></section><section className="member-shortcuts" aria-label="Akses cepat affiliate"><Link href="/akun/mitra"><strong>Pusat affiliate</strong><span>Kelola aktivitas referral, produk, dan informasi komisi yang tersedia.</span><small>Buka pusat affiliate →</small></Link><Link href="/akun/tautan"><strong>Tautan saya</strong><span>Buat dan salin tautan referral.</span><small>Kelola tautan →</small></Link><Link href="/tes-stifin#layanan"><strong>Layanan STIFIn</strong><span>Lihat layanan yang dapat Anda rekomendasikan.</span><small>Lihat layanan →</small></Link><Link href="/belajar?tab=support"><strong>Bantuan</strong><span>Hubungi tim untuk pertanyaan akun atau kerja sama.</span><small>Ajukan bantuan →</small></Link></section></main>;
    let portal;
    try {
        portal = await getPromoterPortal(principal.userId);
    }
    catch {
        return <main className="portal-shell">{header}<section className="portal-card"><h1>Data cabang belum tersedia</h1><p>Hubungi kepala cabang untuk memeriksa konfigurasi dan impor jaringan.</p></section></main>;
    }
    if (!portal)
        return <main className="portal-shell">{header}<section className="portal-card"><h1>Keanggotaan cabang belum tersedia</h1><p>Akun Anda belum dipetakan ke jaringan cabang. Hubungi kepala cabang untuk memeriksa keanggotaan.</p></section></main>;
    const { profile, leads } = portal;
    return <main className="portal-shell">{header}
    <section className="portal-welcome"><span className="portal-eyebrow">RUANG MITRA</span><h1>Halo, {profile.name}.</h1><p>Promotor dan mitra referral KonsepSTIFIn. Kelola tautan, voucher, dan calon klien Anda.</p></section>
    <section className="member-shortcuts" aria-label="Akses cepat promotor"><a href="#my-leads"><strong>{portal.total} kontak ditugaskan</strong><span>Tindak lanjuti klien yang menjadi tanggung jawab Anda.</span><small>Lihat kontak →</small></a><Link href="/akun/voucher"><strong>Voucher tes</strong><span>Cek saldo dan buat pembelian voucher.</span><small>Kelola voucher →</small></Link><Link href="/akun/mitra"><strong>Produk & affiliate</strong><span>Pantau pendaftar referral, produk, komisi, dan pencairan.</span><small>Buka pusat affiliate →</small></Link><Link href="/belajar?tab=classes"><strong>Kelas saya</strong><span>Belajar melalui akun promotor yang sama.</span><small>Lanjutkan belajar →</small></Link></section>
    <div className="portal-profile-grid"><section className="portal-card"><span className="portal-eyebrow">PROFIL ANDA</span><h2>{profile.name}</h2><dl className="portal-details"><dt>Kode promotor</dt><dd>{profile.promoterCode}</dd><dt>Email</dt><dd>{profile.email}</dd><dt>Area layanan</dt><dd>{profile.area || 'Belum ditentukan'}</dd><dt>Peran cabang</dt><dd>{profile.isManager ? 'Kepala Cabang' : 'Promotor'}</dd></dl></section>
    <section className="portal-card"><span className="portal-eyebrow">CABANG RESMI</span><h2>{profile.branchName}</h2><p>Kode cabang: <strong>{profile.branchCode}</strong></p><h3>Voucher tes STIFIn</h3><p>Beli voucher melalui cabang dan pantau saldo akun STIFIn Anda.</p><p><Link href="/akun/voucher">Cek saldo dan beli voucher →</Link></p><h3>Tautan referral pribadi</h3><p>Bagikan tautan produk atau pendaftaran dari pusat affiliate. Lihat akun baru yang terhubung di tab Aktivitas referral.</p><p><Link href="/akun/tautan">Atur dan salin tautan saya →</Link></p></section></div>
    <section id="my-leads" className="portal-card portal-leads"><div className="portal-section-title"><div><span className="portal-eyebrow">LEAD ANDA</span><h2>Kontak yang ditugaskan</h2></div><span className="portal-count">{portal.total} lead</span></div><p>Hanya lead yang ditugaskan kepada Anda dan telah memberikan persetujuan untuk dihubungi.</p>
    {portal.total > leads.length && leads.length > 0 && <p className="portal-muted">Menampilkan {leads.length} lead terbaru dari {portal.total} lead.</p>}
    {!leads.length ? <div className="portal-empty"><h3>Belum ada lead yang ditugaskan</h3><p>Permintaan layanan yang disetujui untuk dibagikan dan ditugaskan kepada Anda akan tampil di sini. Pendaftaran akun baru dapat dilihat di <Link href="/akun/mitra?tab=activity">Aktivitas referral</Link>.</p></div> : <div className="portal-table-wrap"><table><thead><tr><th>Nama</th><th>Kontak</th><th>Kota</th><th>Status</th></tr></thead><tbody>{leads.map(lead => <tr key={lead.id}><td>{lead.name}</td><td>{lead.phone || '—'}<br />{lead.email || '—'}</td><td>{lead.city || '—'}</td><td>{lead.status}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}

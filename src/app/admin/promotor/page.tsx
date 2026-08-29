import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured } from '@/lib/article-store';
import { getPublicPromoters } from '@/lib/promoter-store';
import PromoterRegionManager from './promoter-region-manager';

export const metadata = { title: 'Pemetaan Promotor | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function AdminPromoterPage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  let promoters: Awaited<ReturnType<typeof getPublicPromoters>> = [];
  let initialError = '';
  try { promoters = await getPublicPromoters(); }
  catch (error) { initialError = error instanceof Error ? error.message : 'Data promotor belum dapat dibaca.'; }
  const mapped = promoters.filter((promoter) => promoter.regionCodes.length > 0).length;

  return <div className="article-admin promoter-admin">
    <header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Pemetaan Promotor</b></nav><div><Link href="/admin/leads">Koordinasi Lead</Link><Link href="/admin/intelligence">Content Intelligence</Link><Link href="/admin/produk">Produk & Harga</Link></div></header>
    <main>
      <section className="article-admin-title"><div><span>LOCAL SEO · CAKUPAN LAYANAN</span><h1>Petakan promotor ke kode wilayah.</h1><p>Hanya promotor aktif dengan wilayah terpetakan yang dapat membuka indeks halaman layanan dan masuk ke sitemap.</p></div><div className="article-admin-metrics"><span><small>Promotor</small><b>{promoters.length}</b></span><span><small>Aktif</small><b>{promoters.filter((item) => item.active).length}</b></span><span><small>Terpetakan</small><b>{mapped}</b></span></div></section>
      {!databaseConfigured() && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> untuk menyimpan perubahan wilayah dari dashboard. Konfigurasi <code>STIFIN_PROMOTERS_JSON</code> tetap dapat digunakan tanpa database.</p></section>}
      <PromoterRegionManager databaseReady={databaseConfigured()} initialError={initialError} initialPromoters={promoters} />
    </main>
  </div>;
}

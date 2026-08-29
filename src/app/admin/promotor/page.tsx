import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured } from '@/lib/article-store';
import { getPublicPromoters, promoterSourceStatus } from '@/lib/promoter-store';
import PromoterManager from './promoter-manager';

export const metadata = { title: 'Pemetaan Promotor | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

export default async function PromoterMappingPage() {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  const status = promoterSourceStatus();
  let promoters = [] as Awaited<ReturnType<typeof getPublicPromoters>>;
  let sourceError = '';
  try { promoters = await getPublicPromoters(); } catch (error) { sourceError = error instanceof Error ? error.message : 'Sumber promotor tidak tersedia.'; }
  const sourceLabel = ({
    manual: 'JSON',
    'stifin-national-endpoint': 'API Nasional',
    'stifin-national-branches': 'Cabang Nasional',
    'stifin-branch': 'API Cabang',
    none: 'Belum',
  } as Record<string, string>)[status.source] || 'Belum';
  return <div className="article-admin promoter-admin">
    <header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Pemetaan Promotor</b></nav><div><Link href="/admin/leads">Lead</Link><Link href="/admin/intelligence">Content Intelligence</Link><Link href="/promotor" target="_blank">Direktori publik ↗</Link></div></header>
    <main><section className="article-admin-title"><div><span>JARINGAN NASIONAL</span><h1>Hubungkan promotor dengan wilayah layanan</h1><p>Gunakan kode resmi Wilayah.id. Satu promotor dapat melayani lebih dari satu kabupaten/kota atau kecamatan.</p></div><div className="article-admin-metrics"><span><small>Mode</small><b>{status.mode}</b></span><span><small>Sumber</small><b>{sourceLabel}</b></span><span><small>Cabang</small><b>{status.branchCount}</b></span><span><small>Promotor</small><b>{promoters.length}</b></span></div></section>
      {!databaseConfigured() && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> agar pemetaan wilayah dapat disimpan.</p></section>}
      {!status.configured && <section className="admin-setup-warning"><b>Sumber promotor belum dikonfigurasi</b><p>{status.message || <>Untuk mode nasional, isi <code>STIFIN_BRANCH_CODES</code>. Untuk satu cabang, isi <code>STIFIN_BRANCH_CODE</code>.</>}</p></section>}
      {sourceError && <section className="admin-setup-warning"><b>API promotor gagal dibaca</b><p>{sourceError}</p></section>}
      {promoters.length ? <PromoterManager promoters={promoters} /> : <section className="intelligence-panel"><p>Belum ada promotor dari sumber yang dikonfigurasi. Periksa metadata pada <a href="/api/promotor" target="_blank" rel="noreferrer">API publik</a>.</p></section>}
    </main>
  </div>;
}

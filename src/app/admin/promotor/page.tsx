import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { databaseConfigured } from '@/lib/article-store';
import {
  getPromoterCatalogStatus,
  queryPromoters,
  type PromoterCatalogStatus,
  type PromoterQuery,
} from '@/lib/promoter-store';
import { getWilayah, type Wilayah } from '@/lib/wilayah';
import PromoterManager from './promoter-manager';

type AdminSearchParams = Record<string, string | string[] | undefined>;

export const metadata = { title: 'Pemetaan Promotor | Konsep STIFIn' };
export const dynamic = 'force-dynamic';

function firstValue(value: string | string[] | undefined, maxLength = 120) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, maxLength) ?? '';
}

function adminQuery(params: AdminSearchParams): PromoterQuery {
  const mapping = firstValue(params.mapping);
  const parsedPage = Number.parseInt(firstValue(params.page, 8), 10);
  return {
    q: firstValue(params.q),
    province: firstValue(params.province),
    regency: firstValue(params.regency),
    branch: firstValue(params.branch, 80),
    mapping: mapping === 'manual' || mapping === 'automatic' || mapping === 'unresolved' ? mapping : undefined,
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: 100,
    includeInactive: true,
  };
}

const EMPTY_STATUS: PromoterCatalogStatus = {
  source: {
    configured: false,
    mode: 'invalid',
    source: 'none',
    rawRows: 0,
    safeRows: 0,
    activeRows: 0,
    inactiveRows: 0,
    branchCount: 0,
    lastSuccessAt: null,
    lastHttpStatus: null,
    stale: false,
    errorCategory: 'configuration',
    message: 'Status sumber promotor belum tersedia.',
  },
  mapped: 0,
  automatic: 0,
  unresolved: 0,
  updatedAt: null,
};

export default async function PromoterMappingPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  if (!await isAdminAuthenticated()) redirect('/admin/login');
  const query = adminQuery(await searchParams);
  const [pageResult, statusResult, provinceResult] = await Promise.allSettled([
    queryPromoters(query),
    getPromoterCatalogStatus(),
    getWilayah('provinces'),
  ]);
  const page = pageResult.status === 'fulfilled' ? pageResult.value : {
    items: [], total: 0, page: 1, pageSize: 100, totalPages: 0,
  };
  const status = statusResult.status === 'fulfilled' ? statusResult.value : EMPTY_STATUS;
  const provinces: Wilayah[] = provinceResult.status === 'fulfilled' ? provinceResult.value : [];
  const sourceError = pageResult.status === 'rejected'
    ? (pageResult.reason instanceof Error ? pageResult.reason.message : 'Sumber promotor tidak tersedia.')
    : '';

  return <div className="article-admin promoter-admin">
    <header className="article-admin-header">
      <Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link>
      <nav><span>Portal Tim</span><b>Pemetaan Promotor</b></nav>
      <div><Link href="/admin/leads">Lead</Link><Link href="/admin/intelligence">Content Intelligence</Link><Link href="/promotor" target="_blank">Direktori publik ↗</Link></div>
    </header>
    <main>
      <section className="article-admin-title promoter-admin-title">
        <div><span>JARINGAN NASIONAL</span><h1>Kelola promotor tanpa memuat seluruh katalog</h1><p>Cari, petakan, impor, dan ekspor data melalui halaman maksimal 100 baris.</p></div>
        <div className="article-admin-metrics">
          <span><small>Dipetakan</small><b>{status.mapped.toLocaleString('id-ID')}</b></span>
          <span><small>Otomatis</small><b>{status.automatic.toLocaleString('id-ID')}</b></span>
          <span><small>Unresolved</small><b>{status.unresolved.toLocaleString('id-ID')}</b></span>
          <span><small>Hasil</small><b>{page.total.toLocaleString('id-ID')}</b></span>
        </div>
      </section>
      {!databaseConfigured() ? <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan <code>DATABASE_URL</code> agar mapping dan override cakupan dapat disimpan.</p></section> : null}
      {!status.source.configured ? <section className="admin-setup-warning"><b>Sumber promotor belum dikonfigurasi</b><p>{status.source.message}</p></section> : null}
      {sourceError ? <section className="admin-setup-warning"><b>API promotor gagal dibaca</b><p>{sourceError}</p></section> : null}
      <PromoterManager
        initialPage={page}
        status={status}
        provinces={provinces}
        initialQuery={{
          q: query.q,
          province: query.province,
          regency: query.regency,
          branch: query.branch,
          mapping: query.mapping || '',
          page: query.page,
        }}
      />
    </main>
  </div>;
}

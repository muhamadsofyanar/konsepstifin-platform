import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getPromoterCatalogStatus,
  queryPromoters,
  type PromoterPage,
  type PromoterQuery,
} from '@/lib/promoter-store';
import { promoterProfileSlug } from '@/lib/local-seo';
import { getProvinceRegencyCatalog, type ProvinceWithRegencies } from '@/lib/wilayah';

type DirectorySearchParams = Record<string, string | string[] | undefined>;
type DirectoryQuery = Pick<PromoterQuery, 'q' | 'province' | 'regency' | 'branch' | 'page'>;

const DIRECTORY_KEYS = ['q', 'province', 'regency', 'branch', 'page'] as const;

export const dynamic = 'force-dynamic';

function firstValue(value: string | string[] | undefined, maxLength = 120) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, maxLength) ?? '';
}

function normalizeDirectoryQuery(searchParams: DirectorySearchParams): DirectoryQuery {
  const parsedPage = Number.parseInt(firstValue(searchParams.page, 8), 10);
  return {
    q: firstValue(searchParams.q),
    province: firstValue(searchParams.province),
    regency: firstValue(searchParams.regency),
    branch: firstValue(searchParams.branch, 80),
    page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };
}

function hasDirectoryQuery(searchParams: DirectorySearchParams) {
  return DIRECTORY_KEYS.some((key) => firstValue(searchParams[key]).length > 0);
}

export function directoryMetadata(searchParams: DirectorySearchParams): Metadata {
  const filtered = hasDirectoryQuery(searchParams);
  return {
    title: 'Direktori Promotor STIFIn Aktif | Konsep STIFIn',
    description: 'Cari data promotor aktif berdasarkan nama, KodeID, cabang, provinsi, atau kabupaten/kota. Jadwal berdasarkan konfirmasi.',
    alternates: { canonical: '/promotor' },
    robots: { index: !filtered, follow: true },
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}): Promise<Metadata> {
  return directoryMetadata(await searchParams);
}

function queryHref(query: DirectoryQuery, page: number) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.province) params.set('province', query.province);
  if (query.regency) params.set('regency', query.regency);
  if (query.branch) params.set('branch', query.branch);
  if (page > 1) params.set('page', String(page));
  const suffix = params.toString();
  return suffix ? `/promotor?${suffix}` : '/promotor';
}

function FilterOptions({ regions }: { regions: ProvinceWithRegencies[] }) {
  return <>
    <datalist id="promoter-provinces">
      {regions.map((province) => <option key={province.code} value={province.name}>{province.code}</option>)}
    </datalist>
    <datalist id="promoter-regencies">
      {regions.flatMap((province) => province.regencies.map((regency) => (
        <option key={regency.code} value={regency.name}>{province.name}</option>
      )))}
    </datalist>
  </>;
}

export function PromoterDirectoryView({
  page,
  query,
  regions = [],
  updatedAt = null,
  error = '',
}: {
  page: PromoterPage;
  query: DirectoryQuery;
  regions?: ProvinceWithRegencies[];
  updatedAt?: string | null;
  error?: string;
}) {
  const start = page.total ? (page.page - 1) * page.pageSize + 1 : 0;
  const end = page.total ? Math.min(page.page * page.pageSize, page.total) : 0;

  return <main className="region-page promoter-directory">
    <nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / Jaringan Promotor</span></nav>
    <header className="region-hero promoter-directory-hero">
      <span>JARINGAN PROMOTOR STIFIN</span>
      <h1>Cari data promotor aktif tanpa membuka kontak pribadi.</h1>
      <p>Gunakan nama, KodeID, cabang, provinsi, atau kabupaten/kota. Hasil menunjukkan identitas layanan yang aman; penugasan dan jadwal baru dikonfirmasi setelah permintaan dikirim.</p>
    </header>

    <section className="region-section promoter-directory-workspace">
      <form className="promoter-search" action="/promotor" method="get">
        <label className="promoter-search-wide">Nama atau KodeID
          <input type="search" name="q" defaultValue={query.q} placeholder="Contoh: Siti atau P-001" />
        </label>
        <label>Provinsi
          <input name="province" defaultValue={query.province} list="promoter-provinces" placeholder="Jawa Barat" />
        </label>
        <label>Kabupaten/kota
          <input name="regency" defaultValue={query.regency} list="promoter-regencies" placeholder="Kabupaten Bandung" />
        </label>
        <label>Cabang
          <input name="branch" defaultValue={query.branch} placeholder="BDG-CAB-1" />
        </label>
        <div className="promoter-search-actions">
          <button type="submit">Tampilkan hasil</button>
          <Link href="/promotor">Reset</Link>
        </div>
        <FilterOptions regions={regions} />
      </form>

      <div className="promoter-directory-summary" aria-live="polite">
        <div><span>HASIL DIREKTORI</span><h2>{page.total.toLocaleString('id-ID')} promotor aktif</h2></div>
        <p>{page.total ? `Menampilkan ${start}–${end}` : 'Tidak ada hasil untuk filter ini.'}{updatedAt ? ` · Diperbarui ${new Date(updatedAt).toLocaleDateString('id-ID')}` : ''}</p>
      </div>

      {error ? <p className="promoter-directory-error" role="alert">{error}</p> : null}
      {page.items.length ? <div className="region-promoters promoter-card-grid">
        {page.items.map((promoter) => <article key={promoter.code}>
          <div className="promoter-card-heading">
            <span>{promoter.mappingSource === 'unresolved' ? 'WILAYAH BELUM DIPETAKAN' : 'PROMOTOR AKTIF'}</span>
            <h3><Link href={`/promotor/${promoterProfileSlug(promoter)}`}>{promoter.name}</Link></h3>
          </div>
          <dl className="promoter-card-meta">
            <div><dt>Identitas</dt><dd>KodeID {promoter.code}</dd></div>
            <div><dt>Cabang</dt><dd>{promoter.branchCode || 'Belum tersedia'}</dd></div>
            <div><dt>Wilayah</dt><dd>{[promoter.area, promoter.province].filter(Boolean).join(', ') || 'Belum tersedia'}</dd></div>
          </dl>
          <small>Jadwal berdasarkan konfirmasi</small>
          <Link className="promoter-card-action" href={`/tes-stifin?province=${encodeURIComponent(promoter.province)}&regency=${encodeURIComponent(promoter.area)}&promoter=${encodeURIComponent(promoter.code)}`}>Ajukan kebutuhan tes →</Link>
        </article>)}
      </div> : !error ? <div className="promoter-directory-empty"><h3>Promotor belum ditemukan</h3><p>Ubah kata kunci atau hapus salah satu filter untuk memperluas hasil.</p></div> : null}

      {page.totalPages > 1 ? <nav className="promoter-pagination" aria-label="Paginasi promotor">
        {page.page > 1 ? <Link href={queryHref(query, page.page - 1)} rel="prev">← Sebelumnya</Link> : <span aria-disabled="true">← Sebelumnya</span>}
        <p>Halaman <b>{page.page}</b> dari <b>{page.totalPages}</b></p>
        {page.page < page.totalPages ? <Link href={queryHref(query, page.page + 1)} rel="next">Berikutnya →</Link> : <span aria-disabled="true">Berikutnya →</span>}
      </nav> : null}
    </section>
  </main>;
}

const EMPTY_PAGE: PromoterPage = { items: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };

export default async function PromoterDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  const rawSearchParams = await searchParams;
  const query = normalizeDirectoryQuery(rawSearchParams);
  let page = EMPTY_PAGE;
  let regions: ProvinceWithRegencies[] = [];
  let updatedAt: string | null = null;
  let error = '';

  const [pageResult, statusResult, regionResult] = await Promise.allSettled([
    queryPromoters({ ...query, pageSize: 24 }),
    getPromoterCatalogStatus(),
    getProvinceRegencyCatalog(),
  ]);
  if (pageResult.status === 'fulfilled') page = pageResult.value;
  else error = 'Direktori promotor sedang tidak tersedia. Silakan coba kembali.';
  if (statusResult.status === 'fulfilled') updatedAt = statusResult.value.updatedAt;
  if (regionResult.status === 'fulfilled') regions = regionResult.value;

  return <PromoterDirectoryView page={page} query={query} regions={regions} updatedAt={updatedAt} error={error} />;
}

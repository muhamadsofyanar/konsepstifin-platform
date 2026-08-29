import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/app/json-ld';
import PublicInterestAction from '@/app/public-interest-action';
import { resolvePromoterProfile } from '@/lib/local-seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ 'slug-promotor': string }> }): Promise<Metadata> {
  const slug = (await params)['slug-promotor'];
  const data = await resolvePromoterProfile(slug);
  if (!data || !data.promoter.active) return { robots: { index: false, follow: true } };
  return {
    title: `${data.promoter.name} — Promotor STIFIn | Konsep STIFIn`,
    description: `Profil publik aman ${data.promoter.name}, KodeID ${data.promoter.code}, area ${data.promoter.area || data.promoter.province || 'belum dipetakan'}. Jadwal berdasarkan konfirmasi.`,
    alternates: { canonical: `/promotor/${data.canonicalSlug}` },
    robots: data.robots,
  };
}

export default async function PromoterProfilePage({ params }: { params: Promise<{ 'slug-promotor': string }> }) {
  const slug = (await params)['slug-promotor'];
  const data = await resolvePromoterProfile(slug);
  if (!data || !data.promoter.active) notFound();
  const { promoter } = data;
  const canonical = `https://konsepstifin.com/promotor/${data.canonicalSlug}`;
  return <main className="region-page promoter-profile">
    <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
      { '@type': 'ProfilePage', url: canonical, mainEntity: { '@type': 'Person', name: promoter.name, identifier: promoter.code, jobTitle: 'Promotor STIFIn', areaServed: [promoter.area, promoter.province].filter(Boolean) } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://konsepstifin.com/' }, { '@type': 'ListItem', position: 2, name: 'Promotor', item: 'https://konsepstifin.com/promotor' }, { '@type': 'ListItem', position: 3, name: promoter.name, item: canonical }] },
    ] }} />
    <nav className="region-breadcrumb"><Link href="/">Beranda</Link><span> / </span><Link href="/promotor">Promotor</Link><span> / {promoter.name}</span></nav>
    <header className="region-hero promoter-profile-hero"><span>PROMOTOR AKTIF</span><h1>{promoter.name}</h1><p>Profil publik ini hanya memuat identitas layanan yang aman. Kontak pribadi dan data akun tidak ditampilkan.</p><PublicInterestAction leadType="test_service" captureLead linkKey="tesPersonal" label="Ajukan koordinasi tes →" service="Tes STIFIn Personal" className="public-cta big" provinceName={promoter.province} regencyName={promoter.area} /></header>
    <section className="region-section promoter-profile-card"><span>IDENTITAS PUBLIK</span><h2>Informasi promotor</h2><dl><div><dt>Nama</dt><dd>{promoter.name}</dd></div><div><dt>KodeID</dt><dd>{promoter.code}</dd></div><div><dt>Cabang</dt><dd>{promoter.branchCode || 'Belum tersedia'}</dd></div><div><dt>Area</dt><dd>{promoter.area || 'Belum tersedia'}</dd></div><div><dt>Provinsi</dt><dd>{promoter.province || 'Belum tersedia'}</dd></div><div><dt>Jadwal</dt><dd>Jadwal berdasarkan konfirmasi</dd></div></dl>{promoter.regionCodes.length ? <p className="profile-proof">Profil dapat diindeks karena promotor aktif dan mempunyai pemetaan cakupan layanan.</p> : <p className="profile-proof warning">Cakupan wilayah belum dipetakan; halaman ini menggunakan noindex.</p>}</section>
    <section className="region-section region-cta"><h2>Koordinasikan kebutuhan melalui jalur aman</h2><p>Nomor pribadi tidak dibuka di halaman ini. Kirim formulir agar permintaan dicatat dan dibagikan hanya kepada promotor yang ditugaskan dengan persetujuan Anda.</p><PublicInterestAction leadType="test_service" captureLead linkKey="tesPersonal" label="Kirim kebutuhan →" service="Bantuan memilih layanan STIFIn" className="dark-button" provinceName={promoter.province} regencyName={promoter.area} /></section>
  </main>;
}

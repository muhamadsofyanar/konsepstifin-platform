import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import LocalCityPage from '@/app/local-city-page';
import { resolveLocalPage } from '@/lib/local-seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const data = await resolveLocalPage(city);
  if (!data) return { robots: { index: false, follow: true } };
  return {
    title: `Tes STIFIn di ${data.regency.name} | Konsep STIFIn`,
    description: `Ajukan Tes STIFIn di ${data.regency.name}, temukan promotor berdasarkan cakupan, dan konfirmasi jadwal secara aman.`,
    alternates: { canonical: `/tes-stifin/${data.canonicalSlug}` },
    robots: { index: data.indexable, follow: true },
  };
}

export default async function LocalTestPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const data = await resolveLocalPage(city);
  if (!data) notFound();
  if (city !== data.canonicalSlug) permanentRedirect(`/tes-stifin/${data.canonicalSlug}`);
  return <LocalCityPage data={data} intent="test" />;
}

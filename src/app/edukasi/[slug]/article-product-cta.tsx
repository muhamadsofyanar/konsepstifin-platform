'use client';

import { useSyncExternalStore } from 'react';

function subscribeLocation(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}
import type { ArticleContentType } from '@/lib/article-store';
import { isInternalServiceUrl } from '@/app/site-config';

export default function ArticleProductCta({ slug, contentType, productName, productUrl, ctaLabel }: {
  slug: string;
  contentType: ArticleContentType;
  productName: string;
  productUrl: string;
  ctaLabel: string;
}) {
  // Historical external URLs are never used, including URLs stored before cutover.
  const safeUrl = isInternalServiceUrl(productUrl) ? productUrl : '/tes-stifin#layanan';
  const search = useSyncExternalStore(subscribeLocation, () => window.location.search, () => '');
  const target = new URL(safeUrl, 'https://konsepstifin.com');
  new URLSearchParams(search).forEach((value, key) => {
    if (/^utm_/i.test(key) || ['fbclid', 'ref', 'affiliate', 'aff'].includes(key.toLowerCase())) {
      target.searchParams.set(key, value.slice(0, 120));
    }
  });
  const href = `${target.pathname}${target.search}${target.hash}`;

  function recordClick() {
    void fetch(`/api/articles/${encodeURIComponent(slug)}/engagement`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cta', channel: 'internal_service' }), keepalive: true,
    }).catch(() => undefined);
  }

  return <aside className="article-product-cta">
    <span>{contentType === 'affiliate' ? 'REKOMENDASI LAYANAN' : 'LAYANAN TERKAIT'}</span>
    <h2>{productName}</h2>
    <p>Pelajari layanan dan kirim permintaan di website ini. Admin akan mengonfirmasi kebutuhan, jadwal, harga, dan pembayaran.</p>
    {contentType === 'affiliate' && <small>Ketentuan rekomendasi atau kerja sama dikonfirmasi bersama tim.</small>}
    <a href={href} onClick={recordClick}>{ctaLabel || 'Lihat layanan'} →</a>
  </aside>;
}

'use client';

import { MouseEvent, useEffect, useMemo } from 'react';
import type { ArticleContentType } from '@/lib/article-store';

const STORAGE_KEY = 'konsepstifin_affiliate_ref';
const REFERRAL_TTL = 30 * 24 * 60 * 60 * 1000;

function cleanReferral(value: string) {
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]{2,80}$/.test(trimmed) ? trimmed : '';
}

export default function ArticleProductCta({
  slug,
  contentType,
  productName,
  productUrl,
  ctaLabel,
  referralCode,
  affiliateParameter,
}: {
  slug: string;
  contentType: ArticleContentType;
  productName: string;
  productUrl: string;
  ctaLabel: string;
  referralCode: string;
  affiliateParameter: string;
}) {
  useEffect(() => {
    const incoming = cleanReferral(referralCode);
    if (incoming) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: incoming, savedAt: Date.now() }));
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as { code?: string; savedAt?: number };
      if (!saved.savedAt || Date.now() - saved.savedAt > REFERRAL_TTL) localStorage.removeItem(STORAGE_KEY);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [referralCode]);

  const targetUrlFor = useMemo(() => (referral: string) => {
    try {
      const target = new URL(productUrl);
      const parameter = /^[a-zA-Z0-9_-]{1,40}$/.test(affiliateParameter) ? affiliateParameter : 'ref';
      if (contentType === 'affiliate' && referral) target.searchParams.set(parameter, referral);
      return target.toString();
    } catch {
      return productUrl;
    }
  }, [affiliateParameter, contentType, productUrl]);

  function recordClick(event: MouseEvent<HTMLAnchorElement>) {
    if (contentType === 'affiliate') {
      let referral = cleanReferral(referralCode);
      if (!referral) {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as { code?: string; savedAt?: number };
          if (saved.savedAt && Date.now() - saved.savedAt <= REFERRAL_TTL) referral = cleanReferral(saved.code ?? '');
        } catch {
          referral = '';
        }
      }
      event.currentTarget.href = targetUrlFor(referral);
    }
    void fetch(`/api/articles/${encodeURIComponent(slug)}/engagement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cta', channel: 'sejoli' }),
      keepalive: true,
    });
  }

  return <aside className="article-product-cta">
    <span>{contentType === 'affiliate' ? 'REKOMENDASI AFFILIATE' : 'LAYANAN TERKAIT'}</span>
    <h2>{productName}</h2>
    <p>Pelajari detail layanan, manfaat, serta ketentuannya pada halaman resmi sebelum melakukan pemesanan.</p>
    {contentType === 'affiliate' && <small>Tautan ini dapat memuat kode affiliate. Kami mungkin menerima komisi tanpa menambah harga yang Anda bayarkan.</small>}
    <a href={targetUrlFor(cleanReferral(referralCode))} target="_blank" rel={contentType === 'affiliate' ? 'sponsored noopener noreferrer' : 'noopener noreferrer'} onClick={recordClick}>{ctaLabel || 'Lihat produk'} →</a>
  </aside>;
}

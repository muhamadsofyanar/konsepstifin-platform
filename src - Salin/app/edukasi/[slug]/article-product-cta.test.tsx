// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ArticleProductCta from './article-product-cta';
const props = { slug: 'contoh', contentType: 'product' as const, productName: 'Tes Personal', ctaLabel: 'Ajukan layanan', referralCode: '', affiliateParameter: 'ref' };
afterEach(cleanup);
describe('article internal service CTA', () => {
  it('mengganti URL produk lama dengan layanan internal dan mempertahankan UTM', () => {
    window.history.replaceState({}, '', '/edukasi/contoh?utm_source=meta&utm_campaign=artikel');
    render(<ArticleProductCta {...props} productUrl="https://app.konsepstifin.com/product/old/" />);
    const link = screen.getByRole('link', { name: /Ajukan layanan/ });
    const target = new URL(link.getAttribute('href')!, window.location.origin);
    expect(target.pathname).toBe('/tes-stifin');
    expect(target.searchParams.get('utm_campaign')).toBe('artikel');
    expect(link).not.toHaveAttribute('target', '_blank');
  });
  it('mencatat klik dengan channel layanan netral', () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    render(<ArticleProductCta {...props} productUrl="/jadi-promotor#tahapan" />);
    const link = screen.getByRole('link', { name: /Ajukan layanan/ });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({ action: 'cta', channel: 'internal_service' });
    expect(link.getAttribute('href')).toContain('/jadi-promotor');
  });
});

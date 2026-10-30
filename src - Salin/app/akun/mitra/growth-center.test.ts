import { describe, expect, it } from 'vitest';
import { buildPromoterCampaignLink } from './growth-center';

describe('buildPromoterCampaignLink', () => {
  it('creates a service-specific referral link with campaign attribution', () => {
    const link = new URL(buildPromoterCampaignLink('https://konsepstifin.com/r/budi', {
      id: 'tes-keluarga', title: 'Tes Keluarga', audience: 'Keluarga', destination: '/produk/layanan/paketKeluarga', message: 'Info', tip: 'Tip',
    }, 'whatsapp'));
    expect(link.pathname).toBe('/r/budi');
    expect(link.searchParams.get('to')).toBe('/produk/layanan/paketKeluarga');
    expect(link.searchParams.get('utm_source')).toBe('promotor');
    expect(link.searchParams.get('utm_medium')).toBe('whatsapp');
    expect(link.searchParams.get('utm_campaign')).toBe('tes-keluarga');
  });
});

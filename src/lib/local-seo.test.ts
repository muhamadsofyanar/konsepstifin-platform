import { describe, expect, it } from 'vitest';
import {
  canonicalCitySlug,
  localPagePolicy,
  promoterProfilePolicy,
  promoterProfileSlug,
} from './local-seo';

describe('local SEO policy', () => {
  it('hanya mengindeks kota yang mempunyai bukti layanan', () => {
    expect(localPagePolicy({ level: 'regencies', activePromoters: 1, manualServiceable: false }))
      .toEqual({ index: true, follow: true });
    expect(localPagePolicy({ level: 'regencies', activePromoters: 0, manualServiceable: false }))
      .toEqual({ index: false, follow: true });
    expect(localPagePolicy({ level: 'regencies', activePromoters: 0, manualServiceable: true }))
      .toEqual({ index: true, follow: true });
    expect(localPagePolicy({ level: 'villages', activePromoters: 4, manualServiceable: true }))
      .toEqual({ index: false, follow: true });
  });

  it('membuat slug kota dan promotor yang stabil', () => {
    expect(canonicalCitySlug({ code: '12.71', name: 'Kota Medan', level: 'regencies' }))
      .toBe('kota-medan-12-71');
    expect(promoterProfileSlug({ code: 'PRO-001', name: 'Siti Aminah' }))
      .toBe('siti-aminah-pro-001');
  });

  it('tidak mengindeks profil promotor nonaktif atau tanpa cakupan', () => {
    expect(promoterProfilePolicy({ active: true, regionCodes: ['32.73'] })).toEqual({ index: true, follow: true });
    expect(promoterProfilePolicy({ active: true, regionCodes: [] })).toEqual({ index: false, follow: true });
    expect(promoterProfilePolicy({ active: false, regionCodes: ['32.73'] })).toEqual({ index: false, follow: true });
  });
});

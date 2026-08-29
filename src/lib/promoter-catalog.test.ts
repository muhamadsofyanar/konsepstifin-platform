import { describe, expect, it } from 'vitest';
import type { PublicPromoter } from './promoter-domain';
import { applyAutomaticRegionMapping, paginatePromoters, type ProvinceFixture } from './promoter-catalog';

const promoter = (
  input: Partial<PublicPromoter> & Pick<PublicPromoter, 'code' | 'name'>,
): PublicPromoter => ({
  code: input.code,
  name: input.name,
  branchCode: input.branchCode ?? 'BDG-CAB-1',
  area: input.area ?? '',
  province: input.province ?? '',
  active: input.active ?? true,
  regionCodes: input.regionCodes ?? [],
  mappingSource: input.mappingSource ?? 'unresolved',
});

const fixtures: ProvinceFixture[] = [
  {
    code: '32',
    name: 'Jawa Barat',
    regencies: [
      { code: '32.04', name: 'Kabupaten Bandung' },
      { code: '32.73', name: 'Kota Bandung' },
    ],
  },
  {
    code: '31',
    name: 'DKI Jakarta',
    regencies: [{ code: '31.74', name: 'Kota Jakarta Selatan' }],
  },
];

describe('promoter-catalog', () => {
  it('maps a regency only when province and normalized area both match', () => {
    const [mapped] = applyAutomaticRegionMapping([
      promoter({ code: 'P-1', name: 'A', area: 'Kab. Bandung', province: 'Jawa Barat' }),
    ], fixtures);

    expect(mapped).toMatchObject({
      regionCodes: ['32.04'],
      mappingSource: 'automatic',
    });
  });

  it('normalizes official province aliases before mapping', () => {
    const [mapped] = applyAutomaticRegionMapping([
      promoter({
        code: 'P-2',
        name: 'Jakarta',
        area: 'Jakarta Selatan',
        province: 'Daerah Khusus Ibukota Jakarta',
      }),
    ], fixtures);

    expect(mapped).toMatchObject({
      regionCodes: ['31.74'],
      mappingSource: 'automatic',
    });
  });

  it('does not guess when the province is empty', () => {
    const [mapped] = applyAutomaticRegionMapping([
      promoter({ code: 'P-3', name: 'Tanpa Provinsi', area: 'Bandung', province: '' }),
    ], fixtures);

    expect(mapped).toMatchObject({ regionCodes: [], mappingSource: 'unresolved' });
  });

  it('does not guess when normalized regency names are ambiguous', () => {
    const ambiguous: ProvinceFixture[] = [{
      code: '99',
      name: 'Provinsi Uji',
      regencies: [
        { code: '99.01', name: 'Kabupaten Harapan' },
        { code: '99.02', name: 'Kota Harapan' },
      ],
    }];
    const [mapped] = applyAutomaticRegionMapping([
      promoter({ code: 'P-4', name: 'Ambigu', area: 'Harapan', province: 'Provinsi Uji' }),
    ], ambiguous);

    expect(mapped).toMatchObject({ regionCodes: [], mappingSource: 'unresolved' });
  });

  it('preserves a manual mapping even when automatic data could match', () => {
    const [mapped] = applyAutomaticRegionMapping([
      promoter({
        code: 'P-5',
        name: 'Manual',
        area: 'Bandung',
        province: 'Jawa Barat',
        regionCodes: ['32.73'],
        mappingSource: 'manual',
      }),
    ], fixtures);

    expect(mapped).toMatchObject({ regionCodes: ['32.73'], mappingSource: 'manual' });
  });

  it('filters, sorts, and paginates without exposing more than 100 rows', () => {
    const promoters = Array.from({ length: 130 }, (_, index) => promoter({
      code: `P-${String(index).padStart(3, '0')}`,
      name: index % 2 ? `Siti ${index}` : `Budi ${index}`,
      area: 'Bandung',
      province: 'Jawa Barat',
      branchCode: index % 2 ? 'BDG-CAB-1' : 'JKT-CAB-1',
      regionCodes: ['32.04'],
      mappingSource: 'automatic',
    }));

    const page = paginatePromoters(promoters, {
      q: 'siti',
      province: '32',
      branch: 'bdg-cab-1',
      mapping: 'automatic',
      page: 1,
      pageSize: 500,
    });

    expect(page).toMatchObject({ total: 65, page: 1, pageSize: 100, totalPages: 1 });
    expect(page.items[0].name.localeCompare(page.items[1].name, 'id-ID')).toBeLessThanOrEqual(0);
  });

  it('returns the requested page with a 24-row public default', () => {
    const promoters = Array.from({ length: 50 }, (_, index) => promoter({
      code: `P-${index}`,
      name: `Promotor ${String(index).padStart(2, '0')}`,
    }));

    const page = paginatePromoters(promoters, { page: 2 });

    expect(page).toMatchObject({ total: 50, page: 2, pageSize: 24, totalPages: 3 });
    expect(page.items).toHaveLength(24);
  });

  it('excludes inactive promoters publicly but lets the admin request them', () => {
    const promoters = [
      promoter({ code: 'P-AKTIF', name: 'Aktif', active: true }),
      promoter({ code: 'P-NONAKTIF', name: 'Nonaktif', active: false }),
    ];

    expect(paginatePromoters(promoters).items.map((item) => item.code)).toEqual(['P-AKTIF']);
    expect(paginatePromoters(promoters, { includeInactive: true }).items.map((item) => item.code))
      .toEqual(['P-AKTIF', 'P-NONAKTIF']);
  });
});

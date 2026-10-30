import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('./promoter-source', () => ({
  getPromoterSourceStatus: () => ({
    configured: true,
    mode: 'manual',
    source: 'manual',
    rawRows: 1,
    safeRows: 1,
    activeRows: 1,
    inactiveRows: 0,
    branchCount: 0,
    lastSuccessAt: '2026-08-29T00:00:00.000Z',
    lastHttpStatus: null,
    stale: false,
    errorCategory: null,
    message: null,
  }),
  loadPromoterSnapshot: async () => ({
    promoters: [{
      code: 'P-DB-MANUAL',
      name: 'Promotor Database',
      branchCode: 'BDG-CAB-1',
      area: 'Kabupaten Bandung',
      province: 'Jawa Barat',
      active: true,
      regionCodes: [],
      mappingSource: 'unresolved',
    }],
    status: {
      configured: true,
      mode: 'manual',
      source: 'manual',
      rawRows: 1,
      safeRows: 1,
      activeRows: 1,
      inactiveRows: 0,
      branchCount: 0,
      lastSuccessAt: '2026-08-29T00:00:00.000Z',
      lastHttpStatus: null,
      stale: false,
      errorCategory: null,
      message: null,
    },
  }),
}));

vi.mock('./wilayah', () => ({
  getProvinceRegencyCatalog: async () => [{
    code: '32',
    name: 'Jawa Barat',
    level: 'provinces',
    regencies: [{
      code: '32.04',
      name: 'Kabupaten Bandung',
      level: 'regencies',
      parentCode: '32',
    }],
  }],
}));

import { getDatabaseClient } from './article-store';
import {
  getPromoterCatalogStatus,
  queryPromoters,
  setPromoterRegionMapping,
} from './promoter-store';

const describeWithDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeWithDatabase('promoter-store PostgreSQL overlay', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await setPromoterRegionMapping('P-DB-MANUAL', []);
  });

  afterAll(async () => {
    await getDatabaseClient()`DELETE FROM public_promoter_regions WHERE promoter_code = 'P-DB-MANUAL'`;
  });

  it('lets a manual row replace automatic mapping, including an empty mapping', async () => {
    await setPromoterRegionMapping('P-DB-MANUAL', ['32.73']);
    const before = await getDatabaseClient()`SELECT updated_at FROM public_promoter_regions WHERE promoter_code = 'P-DB-MANUAL'`;
    const mapped = await queryPromoters({ mapping: 'manual' });
    expect(mapped.items[0]).toMatchObject({
      code: 'P-DB-MANUAL',
      regionCodes: ['32.73'],
      mappingSource: 'manual',
    });

    await setPromoterRegionMapping('P-DB-MANUAL', []);
    const after = await getDatabaseClient()`SELECT updated_at FROM public_promoter_regions WHERE promoter_code = 'P-DB-MANUAL'`;
    const cleared = await queryPromoters({ mapping: 'manual' });
    expect(cleared.items[0]).toMatchObject({
      code: 'P-DB-MANUAL',
      regionCodes: [],
      mappingSource: 'manual',
    });
    expect(String(after[0].updated_at)).not.toBe(String(before[0].updated_at));
    await expect(getPromoterCatalogStatus()).resolves.toMatchObject({
      mapped: 0,
      automatic: 0,
      unresolved: 1,
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { queryPromoters, getPromoterCatalogStatus } = vi.hoisted(() => ({
  queryPromoters: vi.fn(),
  getPromoterCatalogStatus: vi.fn(),
}));

vi.mock('@/lib/promoter-store', () => ({
  queryPromoters,
  getPromoterCatalogStatus,
}));

import { GET } from './route';

describe('GET /api/promotor', () => {
  beforeEach(() => {
    queryPromoters.mockResolvedValue({
      items: [{
        code: 'P-1',
        name: 'Siti Aminah',
        branchCode: 'BDG-CAB-1',
        area: 'Kabupaten Bandung',
        province: 'Jawa Barat',
        active: true,
        regionCodes: ['32.04'],
        mappingSource: 'automatic',
      }],
      total: 25,
      page: 2,
      pageSize: 24,
      totalPages: 2,
    });
    getPromoterCatalogStatus.mockResolvedValue({
      source: {
        mode: 'national',
        lastSuccessAt: '2026-08-29T10:00:00.000Z',
      },
      mapped: 1,
      automatic: 1,
      unresolved: 0,
      updatedAt: '2026-08-29T10:00:00.000Z',
    });
  });

  it('returns only paginated public data and freshness metadata', async () => {
    const response = await GET(new NextRequest(
      'http://localhost/api/promotor?q=siti&page=2&nationalPath=rahasia&auth=token',
    ));
    const body = await response.json();

    expect(queryPromoters).toHaveBeenCalledWith({
      q: 'siti',
      province: undefined,
      regency: undefined,
      branch: undefined,
      page: 2,
      pageSize: 24,
    });
    expect(body).toEqual({
      data: expect.any(Array),
      meta: {
        total: 25,
        page: 2,
        pageSize: 24,
        totalPages: 2,
        updatedAt: '2026-08-29T10:00:00.000Z',
      },
    });
    expect(JSON.stringify(body)).not.toMatch(/source|nationalPath|auth|email|phone|pass/i);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
});

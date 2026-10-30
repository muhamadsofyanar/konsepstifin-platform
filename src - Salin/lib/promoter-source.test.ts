import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPromoterCacheForTests, loadPromoterSnapshot } from './promoter-source';

function apiResponse(data: unknown[], status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { 'content-type': 'application/json', 'content-length': '500' },
  });
}

describe('promoter-source', () => {
  beforeEach(() => clearPromoterCacheForTests());

  it('uses the national endpoint without requiring branch codes', async () => {
    const fetcher = vi.fn().mockResolvedValue(apiResponse([
      { KodeID: 'P-1', Nama: 'Aman', Sub: 'JKT-CAB-1', Aktif: 1, Email: 'secret@example.com' },
    ]));
    const snapshot = await loadPromoterSnapshot({
      mode: 'national',
      baseUrl: 'https://apro.stifin.id/api',
      nationalPath: '/proGet/pro/PRO',
      branchCodes: [],
      fetcher,
      now: () => 1_000,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://apro.stifin.id/api/proGet/pro/PRO',
      expect.objectContaining({ redirect: 'error' }),
    );
    expect(snapshot.status).toMatchObject({
      source: 'national',
      safeRows: 1,
      activeRows: 1,
      inactiveRows: 0,
      stale: false,
      lastHttpStatus: 200,
    });
    expect(JSON.stringify(snapshot.promoters)).not.toContain('secret@example.com');
  });

  it('keeps a fresh snapshot for 15 minutes', async () => {
    const fetcher = vi.fn().mockResolvedValue(apiResponse([
      { KodeID: 'P-1', Nama: 'Cache', Aktif: 1 },
    ]));
    const options = {
      mode: 'national' as const,
      nationalPath: '/proGet/pro/PRO',
      fetcher,
      now: () => 1_000,
    };

    const first = await loadPromoterSnapshot(options);
    const second = await loadPromoterSnapshot({ ...options, now: () => 14 * 60 * 1_000 });

    expect(second).toEqual(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('serves stale data for at most 24 hours after an upstream failure', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(apiResponse([
      { KodeID: 'P-1', Nama: 'Cache', Aktif: 1 },
    ]));
    await loadPromoterSnapshot({
      mode: 'national',
      nationalPath: '/proGet/pro/PRO',
      fetcher,
      now: () => 0,
    });
    fetcher.mockRejectedValue(new DOMException('timeout', 'TimeoutError'));

    const stale = await loadPromoterSnapshot({
      mode: 'national',
      nationalPath: '/proGet/pro/PRO',
      fetcher,
      now: () => 16 * 60 * 1_000,
    });
    expect(stale.status).toMatchObject({ stale: true, errorCategory: 'timeout' });

    await expect(loadPromoterSnapshot({
      mode: 'national',
      nationalPath: '/proGet/pro/PRO',
      fetcher,
      now: () => 25 * 60 * 60 * 1_000,
    })).rejects.toThrow('Sumber promotor nasional sedang tidak tersedia.');
  });

  it('rejects an unknown response shape instead of reporting zero rows', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: [] }), { status: 200 }),
    );

    await expect(loadPromoterSnapshot({
      mode: 'national',
      nationalPath: '/proGet/pro/PRO',
      fetcher,
      now: () => 0,
    })).rejects.toThrow('Sumber promotor nasional sedang tidak tersedia.');
  });

  it('reports an upstream HTTP failure without replacing it with an empty result', async () => {
    const fetcher = vi.fn().mockResolvedValue(apiResponse([], 503));

    await expect(loadPromoterSnapshot({
      mode: 'national',
      nationalPath: '/proGet/pro/PRO',
      fetcher,
      now: () => 0,
    })).rejects.toThrow('Sumber promotor nasional sedang tidak tersedia.');
  });

  it('accepts an absolute HTTPS national URL', async () => {
    const fetcher = vi.fn().mockResolvedValue(apiResponse([
      { KodeID: 'P-1', Nama: 'Aman', Aktif: 1 },
    ]));

    await loadPromoterSnapshot({
      mode: 'national',
      nationalPath: 'https://data.example.com/promoters',
      fetcher,
      now: () => 0,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://data.example.com/promoters',
      expect.any(Object),
    );
  });

  it('rejects insecure absolute national URLs', async () => {
    await expect(loadPromoterSnapshot({
      mode: 'national',
      nationalPath: 'http://example.com/promoters',
      fetcher: vi.fn(),
      now: () => 0,
    })).rejects.toThrow('Sumber promotor nasional sedang tidak tersedia.');
  });

  it('supports branch mode and caps safe rows at 10000', async () => {
    const fetcher = vi.fn().mockResolvedValue(apiResponse(
      Array.from({ length: 10_050 }, (_, index) => ({
        KodeID: `P-${index}`,
        Nama: `Promotor ${index}`,
        Sub: 'JML-CAB-62',
        Aktif: 1,
      })),
    ));

    const snapshot = await loadPromoterSnapshot({
      mode: 'branch',
      branchCodes: ['JML-CAB-62'],
      fetcher,
      now: () => 0,
    });

    expect(fetcher).toHaveBeenCalledWith(
      'https://apro.stifin.id/api/proGetCab/pro/JML-CAB-62',
      expect.any(Object),
    );
    expect(snapshot.promoters).toHaveLength(10_000);
    expect(snapshot.status).toMatchObject({
      source: 'branch',
      branchCount: 1,
      rawRows: 10_000,
    });
  });

  it('adds an allowlisted authentication header', async () => {
    const fetcher = vi.fn().mockResolvedValue(apiResponse([
      { KodeID: 'P-1', Nama: 'Aman', Aktif: 1 },
    ]));

    await loadPromoterSnapshot({
      mode: 'national',
      nationalPath: '/proGet/pro/PRO',
      authHeader: 'Authorization',
      authValue: 'Bearer safe',
      fetcher,
      now: () => 0,
    });

    expect(fetcher).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer safe' }),
      }),
    );
  });
});

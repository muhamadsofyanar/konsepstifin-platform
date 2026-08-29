import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPromoterCacheForTests, loadPromoters } from './promoter-source';
function apiResponse(data: unknown[]) { return new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json', 'content-length': '500' } }); }
describe('promoter-source', () => {
  beforeEach(() => clearPromoterCacheForTests());
  it('mengambil endpoint nasional sekali selama cache fresh dan membuang PII', async () => {
    const fetcher = vi.fn().mockResolvedValue(apiResponse([{ KodeID: 'P-1', Nama: 'Aman', Sub: 'JKT-CAB-1', Area: 'Jakarta Selatan', Propinsi: 'DKI Jakarta', Aktif: 1, Phone: 'rahasia' }]));
    const options = { mode: 'national' as const, baseUrl: 'https://apro.stifin.id/api', fetcher, now: () => 1_000 };
    const first = await loadPromoters(options); const second = await loadPromoters({ ...options, now: () => 2_000 });
    expect(fetcher).toHaveBeenCalledTimes(1); expect(fetcher).toHaveBeenCalledWith('https://apro.stifin.id/api/proGet/pro/PRO', expect.any(Object));
    expect(second).toEqual(first); expect(JSON.stringify(first)).not.toContain('rahasia');
  });
  it('memakai cache stale maksimal 24 jam', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(apiResponse([{ KodeID: 'P-1', Nama: 'Cache', Sub: 'JKT-CAB-1', Aktif: 1 }]));
    await loadPromoters({ mode: 'national', fetcher, now: () => 0 }); fetcher.mockRejectedValue(new Error('down'));
    await expect(loadPromoters({ mode: 'national', fetcher, now: () => 16 * 60 * 1000 })).resolves.toHaveLength(1);
    await expect(loadPromoters({ mode: 'national', fetcher, now: () => 25 * 60 * 60 * 1000 })).rejects.toThrow('Sumber promotor nasional sedang tidak tersedia.');
  });
  it('mempertahankan mode branch dan batas 10000 baris', async () => {
    const fetcher = vi.fn().mockResolvedValue(apiResponse(Array.from({ length: 10_050 }, (_, index) => ({ KodeID: 'P-' + index, Nama: 'Promotor ' + index, Sub: 'JML-CAB-62', Aktif: 1 }))));
    const result = await loadPromoters({ mode: 'branch', branchCodes: ['JML-CAB-62'], fetcher, now: () => 0 });
    expect(fetcher).toHaveBeenCalledWith('https://apro.stifin.id/api/proGetCab/pro/JML-CAB-62', expect.any(Object)); expect(result).toHaveLength(10_000);
  });
});

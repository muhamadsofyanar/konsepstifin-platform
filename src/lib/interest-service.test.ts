import { describe, expect, it, vi } from 'vitest';
import { submitInterest } from './interest-service';
const raw = { name: 'Budi Santoso', phone: '081234567890', email: 'budi@example.com', provinceCode: '32', provinceName: 'Jawa Barat', regencyCode: '32.04', regencyName: 'Kabupaten Bandung', city: 'Bandung', service: 'Tes STIFIn Personal', productKey: 'tesPersonal', notes: '', sourcePath: '/tes-stifin', consentToContact: true, consentToShare: true, idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' };
describe('submitInterest', () => {
  it('menyimpan kandidat sebelum mengembalikan checkout', async () => {
    const createLead = vi.fn().mockResolvedValue({ id: 42 });
    const result = await submitInterest(raw, { findMatch: vi.fn().mockResolvedValue({ method: 'area', primary: { code: 'P-1', name: 'Promotor Aman', branchCode: 'BDG-CAB-1', area: 'Bandung', province: 'Jawa Barat', active: true, menerimaKunjungan: false, regionCodes: [] }, candidates: [] }), createLead, resolveCheckout: vi.fn().mockResolvedValue('https://app.konsepstifin.com/product/tes-personal/') });
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ status: 'ditawarkan', match: expect.objectContaining({ assignedPromoterCode: 'P-1' }) }));
    expect(result.reference).toBe('KSF-42'); expect(result.match.promoter?.name).toBe('Promotor Aman');
  });
  it('tetap checkout tanpa kandidat ketika sumber promotor gagal', async () => {
    const result = await submitInterest(raw, { findMatch: vi.fn().mockRejectedValue(new Error('upstream')), createLead: vi.fn().mockResolvedValue({ id: 43 }), resolveCheckout: vi.fn().mockResolvedValue('https://app.konsepstifin.com/product/tes-personal/') });
    expect(result.status).toBe('mencari_promotor'); expect(result.match).toEqual({ method: 'none', promoter: null });
  });
  it('tidak menghasilkan checkout ketika database atau URL produk gagal', async () => {
    await expect(submitInterest(raw, { findMatch: vi.fn().mockResolvedValue({ method: 'none', primary: null, candidates: [] }), createLead: vi.fn().mockRejectedValue(new Error('database down')), resolveCheckout: vi.fn().mockResolvedValue('https://app.konsepstifin.com/product/tes-personal/') })).rejects.toThrow('database down');
    await expect(submitInterest(raw, { findMatch: vi.fn(), createLead: vi.fn(), resolveCheckout: vi.fn().mockRejectedValue(new Error('Checkout produk belum tersedia.')) })).rejects.toThrow('Checkout produk belum tersedia.');
  });
});

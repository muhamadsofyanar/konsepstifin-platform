import { describe, expect, it, vi } from 'vitest';
import { submitInterest } from './interest-service';
const raw = { name: 'Budi Santoso', phone: '081234567890', email: 'budi@example.com', provinceCode: '32', provinceName: 'Jawa Barat', regencyCode: '32.04', regencyName: 'Kabupaten Bandung', city: 'Bandung', service: 'Tes STIFIn Personal', productKey: 'tesPersonal', notes: '', sourcePath: '/tes-stifin', consentToContact: true, consentToShare: true, idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' };
describe('submitInterest', () => {
  it('tidak mencari promotor atau checkout untuk lead calon promotor', async () => {
    const findMatch = vi.fn();
    const resolveCheckout = vi.fn();
    const createLead = vi.fn().mockResolvedValue({ id: 41, leadType: 'promoter_candidate', status: 'baru' });
    const result = await submitInterest({
      ...raw,
      leadType: 'promoter_candidate',
      productKey: 'wsl1',
      service: 'WSL 1',
      consentToShare: false,
    }, { findMatch, createLead, resolveCheckout });

    expect(findMatch).not.toHaveBeenCalled();
    expect(resolveCheckout).not.toHaveBeenCalled();
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({
      interest: expect.objectContaining({ leadType: 'promoter_candidate' }),
      status: 'baru',
      match: null,
    }));
    expect(result.match).toBeNull();
  });
  it('menyimpan kandidat sebelum mengembalikan checkout', async () => {
    const createLead = vi.fn().mockResolvedValue({ id: 42 });
    const result = await submitInterest(raw, { findMatch: vi.fn().mockResolvedValue({ method: 'area', primary: { code: 'P-1', name: 'Promotor Aman', branchCode: 'BDG-CAB-1', area: 'Bandung', province: 'Jawa Barat', active: true, menerimaKunjungan: false, regionCodes: [] }, candidates: [] }), createLead, resolveCheckout: vi.fn().mockResolvedValue('https://app.konsepstifin.com/product/tes-personal/') });
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ status: 'ditawarkan', match: expect.objectContaining({ assignedPromoterCode: 'P-1' }) }));
    expect(result).not.toHaveProperty('checkoutUrl'); expect(result.reference).toBe('KSF-42'); expect(result.match?.promoter?.name).toBe('Promotor Aman');
  });
  it('tetap checkout tanpa kandidat ketika sumber promotor gagal', async () => {
    const result = await submitInterest(raw, { findMatch: vi.fn().mockRejectedValue(new Error('upstream')), createLead: vi.fn().mockResolvedValue({ id: 43 }), resolveCheckout: vi.fn().mockResolvedValue('https://app.konsepstifin.com/product/tes-personal/') });
    expect(result.status).toBe('mencari_promotor'); expect(result.match).toEqual({ method: 'none', promoter: null });
  });
  it('tidak menghasilkan checkout ketika database atau URL produk gagal', async () => {
    await expect(submitInterest(raw, { findMatch: vi.fn().mockResolvedValue({ method: 'none', primary: null, candidates: [] }), createLead: vi.fn().mockRejectedValue(new Error('database down')), resolveCheckout: vi.fn().mockResolvedValue('https://app.konsepstifin.com/product/tes-personal/') })).rejects.toThrow('database down');
    const resolver = vi.fn().mockRejectedValue(new Error('Old checkout unavailable'));
    await expect(submitInterest(raw, { createLead: vi.fn().mockResolvedValue({ id: 44 }), resolveCheckout: resolver })).resolves.toMatchObject({ reference: 'KSF-44' });
    expect(resolver).not.toHaveBeenCalled();
  });
});

it('uses only server referral attribution before region matching, ignoring forged body fields',async()=>{
 const source={userId:'00000000-0000-4000-8000-000000000001',promoterCode:'KHU-ABU-01',alias:'budi',name:'Budi',branchCode:'JML-CAB-62',area:'Sumedang'};
 const createLead=vi.fn().mockResolvedValue({id:80}),findMatch=vi.fn();
 await submitInterest({...raw,assignedPromoterCode:'FORGED',source:{...source,promoterCode:'FORGED'}},{createLead,findMatch,referralSource:source});
 expect(findMatch).not.toHaveBeenCalled();expect(createLead).toHaveBeenCalledWith(expect.objectContaining({source,match:expect.objectContaining({assignedPromoterCode:'KHU-ABU-01',matchMethod:'referral'})}));
 const noCookie=vi.fn().mockResolvedValue({id:81});await submitInterest({...raw,referralSource:source},{createLead:noCookie});
 expect(noCookie).toHaveBeenCalledWith(expect.objectContaining({source:undefined,match:expect.objectContaining({assignedPromoterCode:''})}));
});
it('assigns consenting promoter registrations but does not share nonconsenting registrations',async()=>{
 const source={userId:'00000000-0000-4000-8000-000000000001',promoterCode:'KHU-ABU-01',alias:'budi',name:'Budi',branchCode:'JML-CAB-62',area:'Sumedang'};
 const createLead=vi.fn().mockResolvedValue({id:82});const registration={...raw,leadType:'promoter_candidate',productKey:'wsl1',service:'WSL 1'};
 await submitInterest(registration,{createLead,referralSource:source});expect(createLead).toHaveBeenLastCalledWith(expect.objectContaining({source,match:expect.objectContaining({assignedPromoterCode:source.promoterCode})}));
 await submitInterest({...registration,consentToShare:false},{createLead,referralSource:source});expect(createLead).toHaveBeenLastCalledWith(expect.objectContaining({source:null,match:null}));
});

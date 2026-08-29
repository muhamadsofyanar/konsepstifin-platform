import { describe, expect, it } from 'vitest';
import { matchPromoters, normalizeAdministrativeName, normalizeBranchCode, normalizeProvinceName, sanitizePromoterRows, type PublicPromoter } from './promoter-domain';

const promoter = (input: Partial<PublicPromoter> & Pick<PublicPromoter, 'code' | 'name'>): PublicPromoter => ({
  code: input.code, name: input.name, branchCode: input.branchCode ?? 'JML-CAB-62', area: input.area ?? '',
  province: input.province ?? '', active: input.active ?? true, regionCodes: input.regionCodes ?? [],
  mappingSource: input.mappingSource ?? 'unresolved',
});
const bandung = { provinceCode: '32', provinceName: 'Jawa Barat', regencyCode: '32.04', regencyName: 'Kabupaten Bandung' };

describe('promoter-domain', () => {
  it('hanya menghasilkan field publik dan membuang PII', () => {
    const [result] = sanitizePromoterRows([{ KodeID: ' pro-001 ', Nama: ' Siti Aminah ', Sub: 'jml-cab-62', Area: 'Kabupaten Bandung', Propinsi: 'Jawa Barat', Aktif: '1', Phone: '08123456789', Email: 'private@example.com', PassID: 'secret', TglLahir: '1990-01-01' }]);
    expect(result).toEqual({ code: 'PRO-001', name: 'Siti Aminah', branchCode: 'JML-CAB-62', area: 'Kabupaten Bandung', province: 'Jawa Barat', active: true, regionCodes: [], mappingSource: 'unresolved' });
    expect(JSON.stringify(result)).not.toMatch(/081234|private@|secret|1990/);
    expect(Object.keys(result).sort()).toEqual(['active', 'area', 'branchCode', 'code', 'mappingSource', 'name', 'province', 'regionCodes']);
  });
  it('menormalisasi data dan mendeduplikasi kode promotor', () => {
    const result = sanitizePromoterRows([{ KodeID: 'A-1', Nama: 'Awal', Sub: '- -', Aktif: 1 }, { KodeID: 'a-1', Nama: 'Duplikat', Sub: 'XXX-CAB-00', Aktif: 1 }]);
    expect(result).toHaveLength(1); expect(result[0].branchCode).toBe(''); expect(result[0].name).toBe('Awal');
    expect(normalizeAdministrativeName('Kab. Bandung')).toBe('BANDUNG');
    expect(normalizeProvinceName('Daerah Khusus Ibukota Jakarta')).toBe('DKI JAKARTA');
    expect(normalizeBranchCode(' jml-cab-62 ')).toBe('JML-CAB-62');
  });
  it('memprioritaskan mapping manual, area, lalu provinsi', () => {
    const manual = matchPromoters([promoter({ code: 'P-20', name: 'Area', area: 'Bandung', province: 'Jawa Barat' }), promoter({ code: 'P-02', name: 'Manual B', regionCodes: ['32.04'] }), promoter({ code: 'P-01', name: 'Manual A', regionCodes: ['32'] })], bandung);
    expect(manual.method).toBe('manual_region'); expect(manual.candidates.map((item) => item.code)).toEqual(['P-02', 'P-01']);
    expect(matchPromoters([promoter({ code: 'A-1', name: 'Area', area: 'Kota Bandung', province: 'Jawa Barat' })], bandung).method).toBe('area');
    expect(matchPromoters([promoter({ code: 'P-1', name: 'Provinsi', area: 'Bogor', province: 'Jawa Barat' })], bandung).method).toBe('province');
  });
  it('mengabaikan promotor nonaktif dan membatasi tiga kandidat', () => {
    const many = Array.from({ length: 5 }, (_, index) => promoter({ code: 'P-' + index, name: 'Promotor ' + index, province: 'Jawa Barat' }));
    expect(matchPromoters(many, bandung).candidates).toHaveLength(3);
    expect(matchPromoters([promoter({ code: 'X', name: 'X', active: false, province: 'Jawa Barat' })], bandung)).toEqual({ method: 'none', primary: null, candidates: [] });
  });
});

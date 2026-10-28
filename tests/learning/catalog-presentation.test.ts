import {it,expect} from 'vitest';
import {catalogAmount,formatRupiah,publicPrice,currentPublicCopy,promoterInvestment} from '../../src/lib/catalog-presentation';
it('reads exact Rupiah and refuses ranges or prices with extra counts',()=>{
 for(const s of ['Rp1.550.000','Rp 1.550.000,00','1550000'])expect(catalogAmount(s)).toBe(1550000);
 for(const s of ['Rp750.000 untuk 2 peserta','Rp500.000–Rp750.000','Rp1.25','-1000','Hubungi admin','Rp1.000,50'])expect(catalogAmount(s)).toBeNull();
 expect(formatRupiah(650001)).toBe('Rp650.001');expect(formatRupiah(2500000)).toBe('Rp2.500.000');
});
it('distinguishes a quote-only service from a free item without changing the stored price',()=>{
 expect(publicPrice('sekolahKomunitas','Rp0')).toBe('Minta penawaran');expect(publicPrice('tesPersonal','Rp0')).toBe('Minta penawaran');expect(publicPrice('affiliateUmum','Rp1')).toBe('Konfirmasi ketentuan');expect(publicPrice('affiliateUmum','Gratis')).toBe('Gratis');expect(publicPrice('kelas-baru','Rp0')).toBe('Gratis');expect(publicPrice('tesPersonal','Rp650.001')).toBe('Rp650.001');
});
it('does not invent missing costs or savings when a promoter price is not a fixed amount',()=>{
 const products=[{productKey:'wsl1',price:'Rp750.000'},{productKey:'wsl2',price:'Rp4.500.000'},{productKey:'idDanAlat',price:'Rp4.500.000'},{productKey:'paketPromotor',price:'Rp8.500.000'}];
 expect(promoterInvestment(products)).toEqual({individual:9750000,package:8500000,main:8500000,saving:1250000});
 expect(promoterInvestment(products.slice(0,2))).toEqual({individual:null,package:null,main:null,saving:null});
 expect(promoterInvestment(products.map(p=>p.productKey==='wsl1'?{...p,price:'Konfirmasi jadwal'}:p))).toEqual({individual:null,package:8500000,main:8500000,saving:null});
});
it('updates obsolete public checkout terminology without rewriting source data',()=>{const old='ketentuan mengikuti checkout SEJOLI';expect(currentPublicCopy(old)).toBe('ketentuan mengikuti konfirmasi pengelola');expect(old).toBe('ketentuan mengikuti checkout SEJOLI');});

it('does not label the sum of separate stages as a package price when the package requires a quote',()=>{expect(promoterInvestment([{productKey:'wsl1',price:'Rp750.000'},{productKey:'wsl2',price:'Rp4.500.000'},{productKey:'idDanAlat',price:'Rp4.500.000'},{productKey:'paketPromotor',price:'Konfirmasi biaya'}])).toEqual({individual:9750000,package:null,main:null,saving:null});});

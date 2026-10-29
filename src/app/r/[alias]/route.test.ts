import { NextRequest } from 'next/server';
import { expect,it,vi } from 'vitest';
const visit=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/referral-store',()=>({getReferralService:()=>({visit})}));
import { GET } from './route';
it('redirects only to allowed internal destinations and stores a private 30-day cookie',async()=>{
 vi.stubEnv('NODE_ENV','production');visit.mockResolvedValue({valid:true,token:'a'.repeat(64)});
 const response=await GET(new NextRequest('https://example.test/r/BUDI?to=https://evil.test'),{params:Promise.resolve({alias:'BUDI'})});
 expect(response.headers.get('location')).toBe('/tes-stifin');expect(response.headers.get('cache-control')).toContain('no-store');
 const cookie=response.headers.get('set-cookie')!;expect(cookie).toContain('HttpOnly');expect(cookie).toContain('Secure');expect(cookie).toContain('SameSite=lax');expect(cookie).toContain('Max-Age=2592000');
});
it('does not refresh an existing valid first referral and never sets an invalid alias cookie',async()=>{
 visit.mockResolvedValue({valid:true,token:null});const response=await GET(new NextRequest('https://example.test/r/budi?to=/jadi-promotor',{headers:{cookie:`konsepstifin_referral=${'b'.repeat(64)}`}}),{params:Promise.resolve({alias:'budi'})});
 expect(response.headers.get('set-cookie')).toBeNull();expect(response.headers.get('location')).toBe('/jadi-promotor');expect(visit).toHaveBeenCalledWith('budi','b'.repeat(64));
 visit.mockResolvedValue({valid:false,token:null});expect((await GET(new NextRequest('https://example.test/r/unknown'),{params:Promise.resolve({alias:'unknown'})})).headers.get('set-cookie')).toBeNull();
});

it('keeps referral redirect relative behind a container host and retains the selected product',async()=>{visit.mockResolvedValue({valid:true,token:null});const r=await GET(new NextRequest('http://0.0.0.0:3000/r/budi?to=/belajar&product=paketKeluarga'),{params:Promise.resolve({alias:'budi'})});expect(r.headers.get('location')).toBe('/produk/layanan/paketKeluarga');});
it('keeps a digital product named wsl1 separate from the WSL service',async()=>{visit.mockResolvedValue({valid:true,token:null});const r=await GET(new NextRequest('https://example.test/r/budi?product=wsl1&kind=digital'),{params:Promise.resolve({alias:'budi'})});expect(r.headers.get('location')).toBe('/produk/wsl1');});

it('keeps only approved campaign attribution parameters when redirecting to a service page',async()=>{
 visit.mockResolvedValue({valid:true,token:null});
 const r=await GET(new NextRequest('https://example.test/r/budi?to=%2Fproduk%2Flayanan%2FpaketKeluarga&utm_source=promotor&utm_medium=whatsapp&utm_campaign=keluarga&utm_content=pusat-mitra&next=https%3A%2F%2Fevil.test'),{params:Promise.resolve({alias:'budi'})});
 const location=r.headers.get('location')!;
 expect(location).toContain('/produk/layanan/paketKeluarga?');
 expect(location).toContain('utm_source=promotor');expect(location).toContain('utm_medium=whatsapp');expect(location).toContain('utm_campaign=keluarga');
 expect(location).not.toContain('evil.test');
});

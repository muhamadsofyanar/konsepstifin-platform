import { NextRequest } from 'next/server';
import { expect,it,vi } from 'vitest';
const visit=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/referral-store',()=>({getReferralService:()=>({visit})}));
import { GET } from './route';
it('redirects only to allowed internal destinations and stores a private 30-day cookie',async()=>{
 vi.stubEnv('NODE_ENV','production');visit.mockResolvedValue({valid:true,token:'a'.repeat(64)});
 const response=await GET(new NextRequest('https://example.test/r/BUDI?to=https://evil.test'),{params:Promise.resolve({alias:'BUDI'})});
 expect(response.headers.get('location')).toBe('https://example.test/tes-stifin');expect(response.headers.get('cache-control')).toContain('no-store');
 const cookie=response.headers.get('set-cookie')!;expect(cookie).toContain('HttpOnly');expect(cookie).toContain('Secure');expect(cookie).toContain('SameSite=lax');expect(cookie).toContain('Max-Age=2592000');
});
it('does not refresh an existing valid first referral and never sets an invalid alias cookie',async()=>{
 visit.mockResolvedValue({valid:true,token:null});const response=await GET(new NextRequest('https://example.test/r/budi?to=/jadi-promotor',{headers:{cookie:`konsepstifin_referral=${'b'.repeat(64)}`}}),{params:Promise.resolve({alias:'budi'})});
 expect(response.headers.get('set-cookie')).toBeNull();expect(response.headers.get('location')).toBe('https://example.test/jadi-promotor');expect(visit).toHaveBeenCalledWith('budi','b'.repeat(64));
 visit.mockResolvedValue({valid:false,token:null});expect((await GET(new NextRequest('https://example.test/r/unknown'),{params:Promise.resolve({alias:'unknown'})})).headers.get('set-cookie')).toBeNull();
});

import { beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({principal:vi.fn(),getPortal:vi.fn(),saveAlias:vi.fn()}));
vi.mock('@/lib/identity/server',()=>({getAccountPrincipal:mocks.principal}));
vi.mock('@/lib/referral-store',()=>({getReferralService:()=>mocks}));
import { GET,PATCH } from './route';
beforeEach(()=>{vi.stubEnv('PLATFORM_ORIGIN','https://example.test');mocks.principal.mockResolvedValue({userId:'own',active:true,sessionValid:true,roles:['promoter']});mocks.getPortal.mockResolvedValue({alias:'budi'});mocks.saveAlias.mockResolvedValue({alias:'budi'});});
function patch(body:unknown,origin='https://example.test'){return new Request('https://example.test/api/account/referral',{method:'PATCH',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});}
it('requires server principal and always reads only own user',async()=>{
 const response=await GET();expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');expect(mocks.getPortal).toHaveBeenCalledWith('own');
 mocks.principal.mockResolvedValue(null);expect((await GET()).status).toBe(401);
 mocks.principal.mockResolvedValue({userId:'own',active:true,sessionValid:true,roles:['admin']});expect((await GET()).status).toBe(401);
});
it('blocks cross origin and forged account identifiers before mutation',async()=>{
 expect((await PATCH(patch({alias:'budi'},'https://evil.test'))).status).toBe(403);expect(mocks.saveAlias).not.toHaveBeenCalled();
 expect((await PATCH(patch({alias:'budi',userId:'other'}))).status).toBe(400);expect(mocks.saveAlias).not.toHaveBeenCalled();
 expect((await PATCH(patch({alias:'budi'}))).status).toBe(200);expect(mocks.saveAlias).toHaveBeenCalledWith('own','budi');
});
it('returns controlled validation and unavailable errors without database details',async()=>{
 mocks.saveAlias.mockRejectedValueOnce(new Error('Alias sudah dimiliki promotor lain.'));expect((await PATCH(patch({alias:'budi'}))).status).toBe(400);
 mocks.saveAlias.mockRejectedValueOnce(new Error('database password private'));const response=await PATCH(patch({alias:'budi'}));expect(response.status).toBe(503);expect(await response.text()).not.toContain('password');
});

import { beforeEach, it, expect, vi } from 'vitest';
const mocks=vi.hoisted(()=>({createAccount:vi.fn(),consumeLoginAttempt:vi.fn(),cookie:vi.fn(),hashPassword:vi.fn(),getAccountPrincipal:vi.fn(),activity:vi.fn()}));
vi.mock('@/lib/identity/server',()=>({getIdentityStore:()=>mocks,getAccountPrincipal:mocks.getAccountPrincipal}));
vi.mock('@/lib/identity/password',()=>({hashPassword:mocks.hashPassword}));
vi.mock('next/headers',()=>({cookies:async()=>({get:mocks.cookie})}));
vi.mock('@/lib/referral-store',()=>({getReferralService:()=>({activity:mocks.activity})}));
vi.mock('@/lib/rate-limit',()=>({checkRateLimit:()=>({allowed:true})}));
import { POST } from '../../src/app/api/account/register/route';
import { GET } from '../../src/app/api/account/referral/activity/route';
beforeEach(()=>{process.env.PLATFORM_ORIGIN='https://example.test';mocks.consumeLoginAttempt.mockResolvedValue(true);mocks.hashPassword.mockResolvedValue('hash');mocks.createAccount.mockResolvedValue('new');mocks.cookie.mockReturnValue({value:'a'.repeat(64)});mocks.getAccountPrincipal.mockResolvedValue(null);});
const request=(extra:object={},origin='https://example.test')=>new Request('https://example.test/api/account/register',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'new@example.test',password:'Long-password-123',...extra})});
it('uses only the httpOnly cookie and a fixed member role when recording a signup',async()=>{
 expect((await POST(request({partnerUserId:'forged',referral:'fake',roles:['admin']}))).status).toBe(200);
 expect(mocks.createAccount).toHaveBeenCalledWith('new@example.test','hash',['member'],null,'a'.repeat(64));
});
it('rejects cross-origin registration and reports failed persistence as failure',async()=>{
 expect((await POST(request({},'https://evil.test'))).status).toBe(403);expect(mocks.createAccount).not.toHaveBeenCalled();
 mocks.createAccount.mockRejectedValueOnce(new Error('database-password'));const r=await POST(request());expect(r.status).toBe(503);expect(await r.text()).not.toContain('database-password');
});
it('validates normalized email, malformed JSON and duplicate accounts before showing success',async()=>{
 expect((await POST(request({email:'bad-email'}))).status).toBe(400);expect(mocks.hashPassword).not.toHaveBeenCalled();
 const malformed=new Request('https://example.test/api/account/register',{method:'POST',headers:{origin:'https://example.test'},body:'{'});
 expect((await POST(malformed)).status).toBe(400);
 mocks.createAccount.mockRejectedValueOnce(Object.assign(new Error('duplicate'),{code:'23505'}));
 const duplicate=await POST(request({email:' NEW@EXAMPLE.TEST '}));expect(duplicate.status).toBe(400);expect(await duplicate.text()).toContain('halaman masuk');
 expect(mocks.createAccount).toHaveBeenCalledWith('new@example.test','hash',['member'],null,'a'.repeat(64));
});
it('protects activity by the authenticated partner role and ignores supplied owner ids',async()=>{
 const r=new Request('https://example.test/api/account/referral/activity?userId=victim');expect((await GET(r)).status).toBe(401);
 mocks.getAccountPrincipal.mockResolvedValue({userId:'member',active:true,sessionValid:true,roles:['member']});expect((await GET(r)).status).toBe(403);
 mocks.getAccountPrincipal.mockResolvedValue({userId:'partner',active:true,sessionValid:true,roles:['affiliate']});mocks.activity.mockResolvedValue({counts:{registrations:1},registrations:[],purchases:[]});expect((await GET(r)).status).toBe(200);expect(mocks.activity).toHaveBeenCalledWith('partner');
});

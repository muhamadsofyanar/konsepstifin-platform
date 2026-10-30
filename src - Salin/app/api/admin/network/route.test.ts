import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/admin-auth',()=>({getAdminPrincipal:vi.fn()}));
vi.mock('@/lib/admin-request',()=>({requireAdminRequest:vi.fn()}));
vi.mock('@/lib/network-store',()=>({getNetworkOverview:vi.fn(),issuePromoterInvite:vi.fn()}));
import {getAdminPrincipal} from '@/lib/admin-auth';
import {requireAdminRequest} from '@/lib/admin-request';
import {getNetworkOverview,issuePromoterInvite} from '@/lib/network-store';
import {GET,POST} from './route';
const actor={userId:'owner',email:'owner@example.test',roles:['admin']};
const request=(body:unknown)=>new Request('https://konsepstifin.com/api/admin/network',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{vi.mocked(getAdminPrincipal).mockResolvedValue(actor);vi.mocked(requireAdminRequest).mockResolvedValue(actor);});
it('denies anonymous reads and untrusted mutations',async()=>{
 vi.mocked(getAdminPrincipal).mockResolvedValue(null);vi.mocked(requireAdminRequest).mockResolvedValue(null);
 expect((await GET()).status).toBe(401);expect((await POST(request({userId:'member'}))).status).toBe(403);
 expect(getNetworkOverview).not.toHaveBeenCalled();expect(issuePromoterInvite).not.toHaveBeenCalled();
});
it('validates the invite target and binds the issuing actor from session',async()=>{
 expect((await POST(request({userId:42}))).status).toBe(400);
 vi.mocked(issuePromoterInvite).mockResolvedValue({activationUrl:'https://konsepstifin.com/akun/aktivasi#token=secret',expiresAt:'2026-11-04T00:00:00Z'});
 const response=await POST(request({userId:'cf942dca-1ae7-4de7-b0bf-8d30388a7a12'}));
 expect(response.status).toBe(200);expect(issuePromoterInvite).toHaveBeenCalledWith('cf942dca-1ae7-4de7-b0bf-8d30388a7a12','owner');
 expect(response.headers.get('cache-control')).toContain('no-store');
});

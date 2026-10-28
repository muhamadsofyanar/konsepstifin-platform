import { NextRequest } from 'next/server';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/admin-auth',()=>({getAdminPrincipal:vi.fn()}));
vi.mock('@/lib/admin-request',()=>({requireAdminRequest:vi.fn()}));
vi.mock('@/lib/interest-store',async()=>{
 const actual=await vi.importActual<typeof import('@/lib/interest-store')>('@/lib/interest-store');
 return {...actual,updateLead:vi.fn(),getCrmLeads:vi.fn(),createInterestLead:vi.fn()};
});
import {getAdminPrincipal} from '@/lib/admin-auth';
import {requireAdminRequest} from '@/lib/admin-request';
import {updateLead,getCrmLeads} from '@/lib/interest-store';
import {GET} from './route';
import {PATCH} from './[id]/route';
beforeEach(()=>{vi.mocked(getAdminPrincipal).mockResolvedValue({userId:'account-id'} as Awaited<ReturnType<typeof getAdminPrincipal>>);vi.mocked(requireAdminRequest).mockResolvedValue({userId:'account-id'} as Awaited<ReturnType<typeof requireAdminRequest>>);});
it('forwards server pagination/search filters and marks contact responses private',async()=>{
 vi.mocked(getCrmLeads).mockResolvedValue({items:[],total:526} as unknown as Awaited<ReturnType<typeof getCrmLeads>>);
 const response=await GET(new NextRequest('https://example.test/api/admin/leads?q=Old&group=client&page=22&dateTo=2026-01-01'));
 expect(getCrmLeads).toHaveBeenCalledWith(expect.objectContaining({q:'Old',group:'client',page:22,pageSize:25,dateTo:'2026-01-01'}));expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it('rejects financial mutations rather than silently accepting them',async()=>{
 for(const field of ['paymentStatus','sejoliOrderId','saleAmount','promoterPayout','otherCost']) {
  const response=await PATCH(new NextRequest('https://example.test/api/admin/leads/1',{method:'PATCH',body:JSON.stringify({status:'baru',[field]:'x'})}),{params:Promise.resolve({id:'1'})});
  expect(response.status).toBe(400);
 }
 expect(updateLead).not.toHaveBeenCalled();
});
it('uses the authenticated account actor rather than request or environment email',async()=>{
 await PATCH(new NextRequest('https://example.test/api/admin/leads/1',{method:'PATCH',body:JSON.stringify({status:'baru',internalNotes:'Call',actor:'spoof'})}),{params:Promise.resolve({id:'1'})});
 expect(updateLead).toHaveBeenCalledWith(1,expect.objectContaining({internalNotes:'Call'}),'account-id');
});

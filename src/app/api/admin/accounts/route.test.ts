import {describe,it,expect,vi,beforeEach} from 'vitest';
vi.mock('@/lib/admin-auth',()=>({getAdminPrincipal:vi.fn()}));
vi.mock('@/lib/admin-request',()=>({requireAdminRequest:vi.fn()}));
vi.mock('@/lib/operations-store',()=>({getOperationsService:vi.fn()}));
vi.mock('@/lib/identity/password',()=>({hashPassword:vi.fn().mockResolvedValue('hashed')}));
import {getAdminPrincipal} from '@/lib/admin-auth';
import {requireAdminRequest} from '@/lib/admin-request';
import {getOperationsService} from '@/lib/operations-store';
import {GET,POST,PATCH} from './route';
const actor={userId:'12345678-1234-1234-1234-123456789abc',email:'admin@example.test',roles:['admin']};
const service={accounts:vi.fn(),createAdmin:vi.fn(),updateAccount:vi.fn()};
const request=(method:string,body:object)=>new Request('https://konsepstifin.com/api/admin/accounts',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
describe('account administration routes',()=>{
 beforeEach(()=>{vi.mocked(getOperationsService).mockReturnValue(service as unknown as ReturnType<typeof getOperationsService>);vi.mocked(getAdminPrincipal).mockResolvedValue(actor);vi.mocked(requireAdminRequest).mockResolvedValue(actor);});
 it('denies anonymous reads and untrusted writes',async()=>{vi.mocked(getAdminPrincipal).mockResolvedValue(null);expect((await GET()).status).toBe(401);vi.mocked(requireAdminRequest).mockResolvedValue(null);expect((await POST(request('POST',{email:'x@y.test',password:'a'.repeat(12)}))).status).toBe(403);expect(service.createAdmin).not.toHaveBeenCalled();});
 it('rejects privilege injection and tells self password resets to sign out',async()=>{expect((await POST(request('POST',{email:'x@y.test',password:'a'.repeat(12),roles:['super_admin']}))).status).toBe(400);expect(service.createAdmin).not.toHaveBeenCalled();service.updateAccount.mockResolvedValue(undefined);const response=await PATCH(request('PATCH',{id:actor.userId,password:'a'.repeat(12)}));expect(response.status).toBe(200);expect(await response.json()).toEqual({ok:true,signOut:true});expect(response.headers.get('Cache-Control')).toBe('no-store');});
 it('masks postgres error details from responses',async()=>{service.createAdmin.mockRejectedValue(Object.assign(new Error('connection secret password'),{code:'23505'}));const response=await POST(request('POST',{email:'x@y.test',password:'a'.repeat(12)}));expect(response.status).toBe(400);expect(await response.text()).not.toContain('secret');});
});

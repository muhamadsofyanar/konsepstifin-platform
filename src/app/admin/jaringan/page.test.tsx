import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('@/lib/admin-auth',()=>({getAdminPrincipal:vi.fn()}));
vi.mock('@/lib/network-store',()=>({getNetworkOverview:vi.fn()}));
vi.mock('next/navigation',()=>({redirect:vi.fn((url:string)=>{throw new Error('redirect:'+url);})}));
vi.mock('./invite-button',()=>({default:({userId}:{userId:string})=><button data-user={userId}>Terbitkan tautan aktivasi</button>}));
import {getAdminPrincipal} from '@/lib/admin-auth';
import {getNetworkOverview} from '@/lib/network-store';
import Page from './page';
it('redirects unauthenticated visitors before loading private branch emails',async()=>{
 vi.mocked(getAdminPrincipal).mockResolvedValue(null);await expect(Page()).rejects.toThrow('redirect:/admin/login');expect(getNetworkOverview).not.toHaveBeenCalled();
});
it('shows a setup instruction when branch data is not seeded',async()=>{
 vi.mocked(getAdminPrincipal).mockResolvedValue({userId:'owner',email:'owner@example.test',roles:['admin']});vi.mocked(getNetworkOverview).mockRejectedValue(new Error('unseeded'));
 expect(renderToStaticMarkup(await Page())).toContain('scripts/promoter-admin.mjs import');
});
it('counts the head with ten members and only offers activation for pending accounts',async()=>{
 vi.mocked(getAdminPrincipal).mockResolvedValue({userId:'owner',email:'owner@example.test',roles:['admin']});
 vi.mocked(getNetworkOverview).mockResolvedValue({branch:{code:'BRANCH',name:'Cabang Uji',regencyCode:'33.26',regencyName:'Kabupaten Uji',managerCode:'HEAD'},members:Array.from({length:11},(_,index)=>({userId:'member-'+index,promoterCode:'CODE-'+index,name:'Anggota '+index,email:'member'+index+'@example.test',area:'Area Uji',active:index===0,isManager:index===0}))});
 const html=renderToStaticMarkup(await Page());expect(html).toContain('<strong>11</strong>');expect(html).toContain('Anggota 0');expect(html).toContain('member10@example.test');expect(html.match(/Terbitkan tautan aktivasi/g)).toHaveLength(10);expect(html).not.toContain('data-user="member-0"');
});

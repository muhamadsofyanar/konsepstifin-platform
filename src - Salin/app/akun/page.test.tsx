import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('@/lib/identity/server',()=>({getAccountPrincipal:vi.fn()}));
vi.mock('@/lib/network-store',()=>({getPromoterPortal:vi.fn()}));
vi.mock('next/navigation',()=>({redirect:vi.fn((url:string)=>{throw new Error('redirect:'+url);})}));
vi.mock('./logout-button',()=>({default:()=> <button>Keluar</button>}));
import {getAccountPrincipal} from '@/lib/identity/server';
import {getPromoterPortal} from '@/lib/network-store';
import Page from './page';
const principal={userId:'member',active:true as const,sessionValid:true as const,roles:['promoter'],promoterCode:'CODE'};
beforeEach(()=>{vi.clearAllMocks();vi.mocked(getAccountPrincipal).mockResolvedValue(principal);});
it('redirects an anonymous account to login without loading leads',async()=>{vi.mocked(getAccountPrincipal).mockResolvedValue(null);await expect(Page()).rejects.toThrow('redirect:/akun/login');expect(getPromoterPortal).not.toHaveBeenCalled();});
it('shows an explicit non-member access state instead of redirecting again',async()=>{vi.mocked(getPromoterPortal).mockResolvedValue(null);expect(renderToStaticMarkup(await Page())).toContain('Keanggotaan cabang belum tersedia');});
it('requests only the session owner portal and describes empty leads and links to voucher and referral portals',async()=>{
 vi.mocked(getPromoterPortal).mockResolvedValue({profile:{userId:'member',promoterCode:'CODE',name:'Anggota Uji',email:'member@example.test',area:'Area Uji',branchCode:'BRANCH',branchName:'Cabang Uji',isManager:false},leads:[],total:0});
 const html=renderToStaticMarkup(await Page());expect(getPromoterPortal).toHaveBeenCalledWith('member');expect(html).toContain('Belum ada lead yang ditugaskan');expect(html).toContain('/akun/voucher');expect(html).toContain('/akun/tautan');expect(html).toContain('RUANG MITRA');
});
it('never loads promoter data for unrelated roles',async()=>{vi.mocked(getAccountPrincipal).mockResolvedValue({...principal,roles:['member']});const html=renderToStaticMarkup(await Page());expect(html).toContain('Selamat datang di akun Anda');expect(html).toContain('/belajar');expect(getPromoterPortal).not.toHaveBeenCalled();});
it('explains when the scoped preview is smaller than the total',async()=>{
 vi.mocked(getPromoterPortal).mockResolvedValue({profile:{userId:'member',promoterCode:'CODE',name:'Anggota Uji',email:'member@example.test',area:'Area Uji',branchCode:'BRANCH',branchName:'Cabang Uji',isManager:false},leads:[{id:1,name:'Lead Uji',phone:'',email:'',city:'',status:'new'}],total:101});
 expect(renderToStaticMarkup(await Page())).toContain('Menampilkan 1 lead terbaru dari 101 lead.');
});
it('redirects administrators to the dedicated admin workspace', async () => {
  vi.mocked(getAccountPrincipal).mockResolvedValue({ ...principal, roles: ['admin'] });
  await expect(Page()).rejects.toThrow('redirect:/admin');
  expect(getPromoterPortal).not.toHaveBeenCalled();
});
it('shows an affiliate workspace without confusing it with the promoter dashboard', async () => {
  vi.mocked(getAccountPrincipal).mockResolvedValue({ ...principal, roles: ['affiliate'] });
  const html = renderToStaticMarkup(await Page());
  expect(html).toContain('RUANG AFFILIATE');
  expect(html).toContain('/akun/mitra');
  expect(html).not.toContain('RUANG MITRA');
  expect(getPromoterPortal).not.toHaveBeenCalled();
});

// @vitest-environment jsdom
import { it,expect,vi,afterEach } from 'vitest';
import Link from 'next/link';
import { render,screen,cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
vi.mock('next/navigation',()=>({usePathname:()=>'/belajar',useSearchParams:()=>new URLSearchParams()}));
import {isPageNavigation} from '../../src/app/navigation-progress';
import Portal from '../../src/app/belajar/portal';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('keeps referral tracking, API calls, downloads, external pages and anchors out of navigation feedback',()=>{
 const current=window.location.origin+'/belajar',a=document.createElement('a');
 for(const href of ['/r/khu-abu-10','/api/learning/files/1','/belajar#materi','https://example.org/produk','/akun/logout']){a.href=href;expect(isPageNavigation(a,current)).toBe(false);}
 a.href='/produk/kelas-saya';expect(isPageNavigation(a,current)).toBe(true);a.setAttribute('download','');expect(isPageNavigation(a,current)).toBe(false);
 a.removeAttribute('download');a.target='_blank';expect(isPageNavigation(a,current)).toBe(false);
});
it('renders twelve catalog cards and loads no account dashboard for an anonymous visitor',async()=>{
 const products=Array.from({length:25},(_,i)=>({id:i+1,slug:'produk-'+i,title:'Produk '+i,kind:'course',description:'Deskripsi',price:100000}));
 const fetcher=vi.fn(async()=>({ok:true,status:200,json:async()=>({products})}));vi.stubGlobal('fetch',fetcher);
 render(<Portal signedIn={false}/>);await screen.findByRole('heading',{name:'Produk 0'});expect(screen.getAllByRole('link',{name:'Lihat produk →'})).toHaveLength(12);
 expect(screen.queryByRole('heading',{name:'Produk 12'})).not.toBeInTheDocument();await userEvent.click(screen.getByRole('button',{name:'Berikutnya →'}));expect(screen.getByRole('heading',{name:'Produk 12'})).toBeVisible();expect(fetcher).toHaveBeenCalledTimes(1);
});

it('shows immediate feedback for a same-origin page click',async()=>{
 const {default:NavigationProgress}=await import('../../src/app/navigation-progress');
 render(<><NavigationProgress/><Link href="/tes-stifin" onClick={event=>event.preventDefault()}>Lihat layanan</Link></>);
 await new Promise(resolve=>requestAnimationFrame(resolve));
 await userEvent.click(screen.getByRole('link',{name:'Lihat layanan'}));expect(screen.getByRole('status')).toHaveTextContent('Membuka halaman…');
});

'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
const contentPaths=['/admin/konten','/admin/artikel','/admin/pustaka','/admin/intelligence','/admin/produk'];
const contentLinks=[['/admin/artikel','Artikel & AI'],['/admin/pustaka','Pustaka'],['/admin/intelligence','Pemeriksaan SEO'],['/admin/produk','Layanan & Harga']];
export default function PortalNavigation({email}:{email:string}){
 const path=usePathname(),router=useRouter();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 if(path==='/admin/login'||!email)return null;
 const content=contentPaths.some(p=>path.startsWith(p));
 const people=path.startsWith('/admin/leads')||path.startsWith('/admin/promotor')||path.startsWith('/admin/jaringan');
 const links=[['/admin','Ringkasan',path==='/admin'],['/admin/leads','Klien & Promotor',people],['/admin/pesanan','Pesanan & Pembayaran',path.startsWith('/admin/pesanan')],['/admin/konten','Konten & Layanan',content],['/admin/pengaturan','Pengaturan',path.startsWith('/admin/pengaturan')]] as const;
 async function logout(){setBusy(true);setError('');try{const response=await fetch('/api/admin/logout',{method:'POST'});if(!response.ok)throw new Error('Keluar belum berhasil. Coba lagi.');router.replace('/admin/login');router.refresh();}catch(err){setError(err instanceof Error?err.message:'Keluar gagal.');}finally{setBusy(false);}}
 return <div className="portal-bar"><nav className="crm-portal-nav" aria-label="Menu admin"><Link href="/admin" className="portal-brand">Konsep<span>STIFIn</span><small>RUANG ADMIN</small></Link><div className="portal-links">{links.map(([href,label,active])=><Link key={href} href={href} aria-current={active?'page':undefined}>{label}</Link>)}</div><div className="portal-account"><span title={email}>{email}</span><button onClick={logout} disabled={busy}>{busy?'Keluar…':'Keluar'}</button></div></nav>{content&&<nav className="portal-subnav" aria-label="Menu konten">{contentLinks.map(([href,label])=><Link href={href} key={href} aria-current={path.startsWith(href)?'page':undefined}>{label}</Link>)}</nav>}{people&&<nav className="portal-subnav" aria-label="Menu klien dan promotor"><Link href="/admin/leads" aria-current={path.startsWith('/admin/leads')?'page':undefined}>CRM Jaringan</Link><Link href="/admin/jaringan" aria-current={path.startsWith('/admin/jaringan')?'page':undefined}>Promotor Cabang</Link><Link href="/admin/promotor" aria-current={path.startsWith('/admin/promotor')?'page':undefined}>Direktori Nasional</Link></nav>}{error&&<p className="portal-error" role="alert">{error}</p>}</div>;
}

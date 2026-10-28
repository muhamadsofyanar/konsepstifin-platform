import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLearningService } from '@/lib/learning-store';
import { ensureProductSchema, getPublicProductByKey } from '@/lib/product-store';
import { getAccountPrincipal } from '@/lib/identity/server';
import { learningAccess, statusLabel } from '@/lib/portal-ui';
import { currentPublicCopy,formatRupiah } from '@/lib/catalog-presentation';
import { productPath } from '@/lib/product-links';
import PublicInterestAction from '../../public-interest-action';
import type { ProductKey } from '../../site-config';
import ProductCheckout from '../product-checkout';
import '../../belajar/learning.css';
export const dynamic='force-dynamic';
const loadProduct=cache(async(key:string,service:boolean)=>{await ensureProductSchema();return getLearningService().publicProduct(key,service);});
export async function generateMetadata({params}:{params:Promise<{identifier:string[]}>}):Promise<Metadata>{
 const {identifier}=await params,service=identifier.length===2&&identifier[0]==='layanan',key=service?identifier[1]:identifier[0];
 if((!service&&identifier.length!==1)||!key||!/^[a-zA-Z0-9-]{1,100}$/.test(key))return {title:'Produk tidak ditemukan',robots:{index:false,follow:false}};
 const p=await loadProduct(key,service);if(!p)return {title:'Produk tidak tersedia',robots:{index:false,follow:false}};
 const title=String(p.title)+' | KonsepSTIFIn',description=currentPublicCopy(String(p.description)).slice(0,160),url=productPath(p);
 return {title,description,alternates:{canonical:url},openGraph:{title,description,url,type:'website'}};
}
export default async function Page({params}:{params:Promise<{identifier:string[]}>}){
 const {identifier}=await params;
 const service=identifier.length===2&&identifier[0]==='layanan',key=service?identifier[1]:identifier[0];
 if((!service&&identifier.length!==1)||!/^[a-zA-Z0-9-]{1,100}$/.test(key))notFound();
 const s=getLearningService(),p=await loadProduct(key,service);if(!p)notFound();
 const legacy=service?await getPublicProductByKey(key):null;
 const account=await getAccountPrincipal(),signedIn=!!account?.active&&!!account?.sessionValid;
 const owned=signedIn&&!service?(await s.dashboard(account!.userId)).grants.some(g=>Number(g.product_id)===Number(p.id)&&learningAccess(g).active):false;
 const price=formatRupiah(Number(p.price));
 return <main className="learning-app lr-product-detail"><header className="lr-topbar"><Link href="/" className="lr-brand">KonsepSTIFIn</Link><div className="lr-actions"><Link href="/belajar?tab=catalog">Semua produk</Link><Link href={signedIn?'/akun':'/akun/login'}>{signedIn?'Akun saya':'Masuk'}</Link></div></header><nav className="lr-breadcrumb"><Link href="/">Beranda</Link><span>/</span><Link href="/belajar?tab=catalog">Produk</Link><span>/</span><span>{String(p.title)}</span></nav><div className="lr-product-layout"><article className="lr-card"><div className="lr-course-cover"><span>{service?'LAYANAN STIFIN':statusLabel(p.kind).toUpperCase()}</span><b aria-hidden="true">◌</b></div><span className="lr-eyebrow">{legacy?.eyebrow??'PILIHAN KONSEPSTIFIN'}</span><h1>{String(p.title)}</h1><p className="lr-product-description">{currentPublicCopy(String(p.description))}</p>{!!legacy?.features.length&&<><h2>Yang Anda dapatkan</h2><ul className="lr-benefits">{legacy.features.map(x=><li key={x}>✓ {x}</li>)}</ul></>}{!!legacy?.bonuses.length&&<section className="lr-inline-notice"><h3>Bonus pilihan</h3><ul className="lr-benefits">{legacy.bonuses.map(x=><li key={x}>{x}</li>)}</ul></section>}<p className="lr-muted">{service?'Jadwal, wilayah layanan, dan nominal final dikonfirmasi pengelola sebelum pembayaran.':p.kind==='ebook'?'File ebook tersedia setelah akses aktif. Unduhan diperiksa berdasarkan akun Anda.':'Materi dan progres belajar tersedia melalui akun Anda setelah akses aktif.'}</p></article><aside className="lr-card lr-product-purchase"><span className="lr-eyebrow">{service?'PILIHAN LAYANAN':'AKSES PRODUK'}</span><div className="lr-price">{service&&!Number(p.price)?'Minta penawaran':Number(p.price)?price:'Gratis'}</div><p>{service?currentPublicCopy(String(p.price_note)):p.access_days?`${p.access_days} hari akses`:'Akses tanpa tanggal berakhir'}</p>{service?<><PublicInterestAction linkKey={key as ProductKey} service={String(p.title)} label="Ajukan layanan ini →" className="lr-button"/><p className="lr-muted">Tidak perlu membuat akun untuk mengajukan layanan. Permintaan diteruskan ke pengelola untuk koordinasi.</p></>:<ProductCheckout product={p} signedIn={signedIn} owned={owned} path={productPath(p)}/>}</aside></div></main>;
}

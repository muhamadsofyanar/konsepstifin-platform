import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLearningService } from '@/lib/learning-store';
import { getPublicProductByKey } from '@/lib/product-store';
import { getAccountPrincipal } from '@/lib/identity/server';
import { statusLabel } from '@/lib/portal-ui';
import { currentPublicCopy,formatRupiah } from '@/lib/catalog-presentation';
import { productPath } from '@/lib/product-links';
import PublicInterestAction from '../../public-interest-action';
import type { ProductKey } from '../../site-config';
import ProductCheckout from '../product-checkout';
import { getActivePromotion } from '@/lib/promotion-store';
import '../../belajar/learning.css';
export const dynamic='force-dynamic';
const loadProduct=cache(async(key:string,service:boolean)=>{return getLearningService().publicProduct(key,service);});
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
 const [legacy,promo] = await Promise.all([service?getPublicProductByKey(key):Promise.resolve(null),getActivePromotion()]);
 if (service && key === 'wst' && !promo.workshopActive) notFound();
 const account=await getAccountPrincipal(),signedIn=!!account?.active&&!!account?.sessionValid;
 const owned=signedIn&&!service?await s.hasProductAccess(account!.userId,Number(p.id)):false;
 const workshopPromoPrice = service && promo.workshopActive && ['wsl1','wsl2','wst'].includes(key) ? promo.settings.workshopPrices[key as 'wsl1'|'wsl2'|'wst'] : null;
 const familyPromo = service && promo.familyActive && ['paketKeluarga','paketKeluargaPlus'].includes(key) ? {minimumPaidTestPrice:promo.settings.minimumPaidTestPrice,schemes:promo.settings.familySchemes} : undefined;
 const price=formatRupiah(workshopPromoPrice ?? Number(p.price));
 const priceNote = familyPromo ? 'Pilih skema Family Test. Harga minimum dihitung dari jumlah tes berbayar dan dikonfirmasi admin.' : workshopPromoPrice !== null ? `Harga promo pusat berlaku sampai ${promo.settings.endDate}. Jadwal dan rincian program dikonfirmasi admin.` : currentPublicCopy(String(p.price_note));
 return <main className="learning-app lr-product-detail"><header className="lr-topbar"><Link href="/" className="lr-brand">KonsepSTIFIn</Link><div className="lr-actions"><Link href="/belajar?tab=catalog">Semua produk</Link><Link href={signedIn?'/akun':'/akun/login'}>{signedIn?'Akun saya':'Masuk'}</Link></div></header><nav className="lr-breadcrumb"><Link href="/">Beranda</Link><span>/</span><Link href="/belajar?tab=catalog">Produk</Link><span>/</span><span>{String(p.title)}</span></nav><div className="lr-product-layout"><article className="lr-card"><div className="lr-course-cover"><span>{service?'LAYANAN STIFIN':statusLabel(p.kind).toUpperCase()}</span><b aria-hidden="true">◌</b></div><span className="lr-eyebrow">{legacy?.eyebrow??'PILIHAN KONSEPSTIFIN'}</span><h1>{String(p.title)}</h1><p className="lr-product-description">{currentPublicCopy(String(p.description))}</p>{familyPromo && <section className="lr-inline-notice"><h3>Promo Family Test dari pusat</h3><p>Pilih skema yang tersedia saat mengajukan permintaan. Harga jual minimal Rp{familyPromo.minimumPaidTestPrice.toLocaleString('id-ID')} per tes berbayar. Tim akan mengonfirmasi total pembayaran.</p><ul className="lr-benefits">{familyPromo.schemes.map(item=><li key={item.key}>{item.label} · minimum Rp{(item.paidTests*familyPromo.minimumPaidTestPrice).toLocaleString('id-ID')}</li>)}</ul></section>}{!!legacy?.features.length&&<><h2>Yang Anda dapatkan</h2><ul className="lr-benefits">{legacy.features.map(x=><li key={x}>✓ {x}</li>)}</ul></>}{!!legacy?.bonuses.length&&<section className="lr-inline-notice"><h3>Bonus pilihan</h3><ul className="lr-benefits">{legacy.bonuses.map(x=><li key={x}>{x}</li>)}</ul></section>}<p className="lr-muted">{service?'Jadwal, wilayah layanan, dan nominal final dikonfirmasi pengelola sebelum pembayaran.':p.kind==='ebook'?'File ebook tersedia setelah akses aktif. Unduhan diperiksa berdasarkan akun Anda.':'Materi dan progres belajar tersedia melalui akun Anda setelah akses aktif.'}</p></article><aside className="lr-card lr-product-purchase"><span className="lr-eyebrow">{service?'PILIHAN LAYANAN':'AKSES PRODUK'}</span><div className="lr-price">{familyPromo?'Harga sesuai skema promo':service&&!Number(p.price)&&workshopPromoPrice===null?'Minta penawaran':(workshopPromoPrice!==null || Number(p.price))?price:'Gratis'}</div>{workshopPromoPrice!==null&&<span className="promo-product-badge">PROMO PUSAT</span>}<p>{service?priceNote:p.access_days?`${p.access_days} hari akses`:'Akses tanpa tanggal berakhir'}</p>{service?<><PublicInterestAction linkKey={key as ProductKey} service={String(p.title)} label="Ajukan layanan ini →" className="lr-button" familyPromo={familyPromo}/><p className="lr-muted">Tidak perlu membuat akun untuk mengajukan layanan. Permintaan diteruskan ke pengelola untuk koordinasi.</p></>:<ProductCheckout product={p} signedIn={signedIn} owned={owned} path={productPath(p)}/>}</aside></div></main>;
}

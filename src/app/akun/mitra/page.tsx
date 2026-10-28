import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import PartnerHub from './hub';
import '../../belajar/learning.css';
export const dynamic='force-dynamic';
export const metadata={title:'Pusat Produk & Affiliate | KonsepSTIFIn'};
export default async function Page({searchParams}:{searchParams:Promise<{tab?:string}>}){const p=await getAccountPrincipal();if(!p?.active||!p.sessionValid)redirect('/akun/login?next=%2Fakun%2Fmitra');if(!p.roles.some(r=>['promoter','affiliate'].includes(r)))return <main className="learning-app"><h1>Akses mitra diperlukan</h1><Link href="/akun">Kembali ke akun</Link></main>;const tab=(await searchParams).tab;return <PartnerHub key={tab} roles={p.roles} initialTab={tab}/>;}

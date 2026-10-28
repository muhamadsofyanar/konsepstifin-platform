import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import MemberMenu from '../components/member-menu';
import PromotionList from './promotion-list';
import '../../belajar/learning.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Produk Promosi | KonsepSTIFIn' };
export default async function Page() {
  const p = await getAccountPrincipal();
  if (!p?.active || !p.sessionValid) redirect('/akun/login');
  if (!p.roles.some(r => ['promoter', 'affiliate'].includes(r))) return <main className="learning-app"><h1>Akses mitra diperlukan</h1><Link href="/akun">Kembali ke akun</Link></main>;
  return <main className="learning-app"><header className="lr-topbar"><Link className="lr-brand" href="/">KonsepSTIFIn</Link><Link href="/akun">Akun saya</Link></header><MemberMenu roles={p.roles} active="/akun/produk"/><header className="lr-heading"><div><span className="lr-eyebrow">KATALOG MITRA</span><h1>Produk pilihan. Peluang bersama.</h1><p>Pilih produk dan bagikan tautan Anda. Pantau komisi dari menu Komisi.</p></div><Link className="lr-button" href="/akun/komisi">Komisi saya →</Link></header><PromotionList/></main>;
}

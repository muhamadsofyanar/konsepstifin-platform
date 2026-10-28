import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import { getReferralService } from '@/lib/referral-store';
import MemberMenu from '../components/member-menu';
import ReferralForm from './referral-form';
export const dynamic='force-dynamic';
export default async function ReferralPage() {
 let principal;
 try {principal=await getAccountPrincipal();}catch{return unavailable();}
 if(!principal?.active||!principal.sessionValid)redirect('/akun/login');
 if(!principal.roles.includes('promoter'))return <main className="portal-shell"><section className="portal-card"><h1>Akses promotor diperlukan</h1><Link href="/akun">Kembali ke akun</Link></section></main>;
 let portal;
 try {portal=await getReferralService().getPortal(principal.userId);}catch{return unavailable();}
 return <main className="portal-shell"><header className="portal-header"><Link className="portal-brand" href="/">KonsepSTIFIn</Link><Link href="/akun">Akun saya ↗</Link></header><MemberMenu roles={principal.roles} active="/akun/tautan"/><section className="portal-card"><span className="portal-eyebrow">TAUTAN REFERRAL</span><h1>Tautan Anda, nama pilihan Anda.</h1><p>Kode resmi: <strong>{portal.promoterCode}</strong>. Kode resmi tetap berlaku meskipun alias diubah.</p><ReferralForm initial={portal}/><p>Tautan lama tetap milik Anda dan tetap dapat digunakan. Referral pertama berlaku 30 hari. Data hanya dibagikan setelah pengunjung menyetujui pembagian kepada promotor.</p><p>Referral mencatat asal pendaftaran dan penugasan awal; tidak menetapkan komisi seumur hidup atau pembayaran otomatis.</p></section></main>;
}
function unavailable(){return <main className="portal-shell"><section className="portal-card"><h1>Tautan belum tersedia</h1><p>Periksa keanggotaan cabang Anda atau coba kembali nanti.</p><Link href="/akun">Kembali ke akun</Link></section></main>;}

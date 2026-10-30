import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import ChatWorkspace from '@/app/components/dashboard-chat/chat-workspace';
export const dynamic='force-dynamic';
export const metadata={title:'Pesan Member & Promotor | KonsepSTIFIn'};
export default async function AdminMessages(){
 const p=await getAccountPrincipal();if(!p?.active||!p.sessionValid)redirect('/akun/login');
 if(!p.roles.some(r=>r==='admin'||r==='super_admin'))redirect('/akun/pesan');
 return <main className="dc-page"><div className="dc-page-heading"><span className="dc-eyebrow">KOMUNIKASI INTERNAL</span><h1>Pesan Member &amp; Promotor</h1><p>Satu ruang untuk menghubungi akun dan menindaklanjuti pertanyaan mereka. Semua admin aktif dapat melayani pesan di sini.</p></div><ChatWorkspace isAdmin userId={p.userId}/></main>;
}

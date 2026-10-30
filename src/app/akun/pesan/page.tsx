import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import MemberMenu from '../components/member-menu';
import LogoutButton from '../logout-button';
import ChatWorkspace from '@/app/components/dashboard-chat/chat-workspace';
export const dynamic='force-dynamic';
export const metadata={title:'Pesan Admin | KonsepSTIFIn'};
export default async function MemberMessages(){
 const p=await getAccountPrincipal();if(!p?.active||!p.sessionValid)redirect('/akun/login');
 if(p.roles.some(r=>r==='admin'||r==='super_admin'))redirect('/admin/pesan');
 return <main className="dc-page"><header className="portal-header"><Link className="portal-brand" href="/akun">KonsepSTIFIn</Link><LogoutButton/></header><MemberMenu roles={p.roles} active="/akun/pesan"/><div className="dc-page-heading"><span className="dc-eyebrow">KOMUNIKASI AKUN</span><h1>Pesan Admin</h1><p>Hubungi tim pengelola mengenai akun, layanan, atau aktivitas Anda. Balasan tersedia di halaman ini.</p></div><ChatWorkspace isAdmin={false} userId={p.userId}/></main>;
}

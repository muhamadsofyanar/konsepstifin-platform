import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getAdminPrincipal} from '@/lib/admin-auth';
import {getCrmLeads} from '@/lib/interest-store';
import {getDatabaseClient} from '@/lib/article-store';
import {getCommerceSummary} from '@/lib/commerce-store';
export const dynamic='force-dynamic';
export const metadata={title:'Ringkasan Admin | Konsep STIFIn'};
const money=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export default async function Overview(){
 const actor=await getAdminPrincipal();if(!actor)redirect('/admin/login');
 const [crmResult,commerceResult]=await Promise.allSettled([getCrmLeads({pageSize:5}),getCommerceSummary()]);
 const crm=crmResult.status==='fulfilled'?crmResult.value:null,commerce=commerceResult.status==='fulfilled'?commerceResult.value:null;
 let schedules:Record<string,unknown>[]=[],scheduleError=false;
 if(crm)try{schedules=[...await getDatabaseClient()`SELECT id,name,service,scheduled_at FROM public_interest_leads WHERE status='dijadwalkan' AND scheduled_at IS NOT NULL ORDER BY scheduled_at ASC,id LIMIT 6`];}catch{scheduleError=true;}
 return <main className="portal-page"><header className="portal-heading"><div><span className="portal-eyebrow">RUANG KERJA KONSEP STIFIn</span><h1>Ringkasan hari ini</h1><p>Pantau permintaan, jadwal layanan, dan pembayaran dalam satu tempat.</p></div><Link className="portal-primary" href="/admin/leads">Buka CRM →</Link></header>
 {(!crm||!commerce)&&<div className="portal-error" role="alert">{!crm?'Data CRM belum tersedia. ':''}{!commerce?'Data pesanan belum tersedia. ':''}Periksa koneksi database dan jalankan migrasi sebelum mulai bekerja. <Link href="/admin/pengaturan">Periksa pengaturan</Link></div>}
 <section className="portal-stats" aria-label="Angka ringkasan">{[
  ['Calon klien',crm?.groups.prospect,'/admin/leads'],['Klien',crm?.groups.client,'/admin/leads'],['Calon promotor',crm?.groups.candidate,'/admin/leads'],['Promotor jaringan',crm?.groups.promoter,'/admin/leads'],['Pesanan belum lunas',commerce?.awaitingPayment,'/admin/pesanan'],['Pembayaran bersih tercatat',commerce?money(commerce.received):undefined,'/admin/pesanan'],
 ].map(([label,value,href])=><Link className="portal-stat" key={label} href={String(href)}><small>{label}</small><strong>{value??'Belum tersedia'}</strong><span>Lihat detail ↗</span></Link>)}</section>
 <div className="portal-columns"><section className="portal-card"><div className="portal-card-heading"><h2>Calon klien terbaru</h2><Link href="/admin/leads">Semua lead →</Link></div>{crm?.items.length?<ul className="portal-records">{crm.items.map(lead=><li key={lead.id}><div><b>{lead.name}</b><span>{lead.service} · {lead.city}</span></div><Link href="/admin/leads">Tindak lanjuti →</Link></li>)}</ul>:<p className="portal-empty">{crm?'Belum ada calon klien. Formulir website akan masuk ke CRM.':'Data belum dapat dimuat.'}</p>}</section>
 <section className="portal-card"><div className="portal-card-heading"><h2>Jadwal layanan</h2><Link href="/admin/leads">Kelola →</Link></div>{schedules.length?<ul className="portal-records">{schedules.map(row=><li key={String(row.id)}><div><b>{String(row.name)}</b><span>{String(row.service)}</span><time>{new Date(row.scheduled_at as string).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'})} WIB</time></div></li>)}</ul>:<p className="portal-empty">{scheduleError||!crm?'Jadwal belum dapat dimuat.':'Belum ada layanan berstatus dijadwalkan.'}</p>}</section></div>
 <section className="portal-card portal-start"><div><h2>Mulai dari kebutuhan hari ini</h2><p>Catat kontak di CRM, buat pesanan setelah harga disepakati, lalu verifikasi transfer sebelum mencatat pembayaran.</p>{commerce&&<p>Sisa tagihan pesanan terbit: <b>{money(commerce.outstanding)}</b></p>}</div><div className="portal-shortcuts"><Link href="/admin/leads">Tambah kontak</Link><Link href="/admin/pesanan">Buat pesanan</Link><Link href="/admin/artikel">Tulis artikel</Link><Link href="/admin/pengaturan">Atur rekening</Link></div></section></main>;
}

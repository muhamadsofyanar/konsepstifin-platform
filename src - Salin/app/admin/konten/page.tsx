import Link from 'next/link';
import {redirect} from 'next/navigation';
import {isAdminAuthenticated} from '@/lib/admin-auth';
export const metadata={title:'Konten & Layanan | Konsep STIFIn'};
export default async function ContentHub(){if(!await isAdminAuthenticated())redirect('/admin/login');return <main className="portal-page"><header className="portal-heading"><div><span className="portal-eyebrow">KONTEN & LAYANAN</span><h1>Kelola materi dan penawaran</h1><p>Gunakan pustaka sebagai referensi. Tinjau artikel sebelum menerbitkan.</p></div></header><section className="portal-hub">{[
 ['/admin/artikel','01','Artikel & AI','Tulis artikel, buat draf berbantuan AI, tinjau, dan terbitkan.'],['/admin/pustaka','02','Pustaka STIFIn','Simpan dokumen sumber dan tentukan materi yang boleh dipakai.'],['/admin/intelligence','03','Pemeriksaan SEO','Periksa struktur, keyword, sumber, dan tautan antarkonten.'],['/admin/produk','04','Layanan & Harga','Perbarui nama layanan, harga tampilan, manfaat, dan ketersediaan.'],
 ].map(([href,no,title,description])=><Link className="portal-card portal-hub-item" key={href} href={href}><span>{no}</span><h2>{title}</h2><p>{description}</p><b>Buka →</b></Link>)}</section></main>;}

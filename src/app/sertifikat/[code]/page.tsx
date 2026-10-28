import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getLearningService} from '@/lib/learning-store';
import '../../belajar/learning.css';
export const dynamic='force-dynamic';
export const metadata={title:'Verifikasi Sertifikat Penyelesaian | KonsepSTIFIn',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{code:string}>}){const {code}=await params;let c;try{c=await getLearningService().verifyCertificate(code);}catch{return <main className="learning-app"><h1>Verifikasi sementara tidak tersedia</h1><p>Coba kembali nanti.</p></main>;}if(!c)notFound();return <main className="learning-app"><nav><strong>KonsepSTIFIn</strong><Link href="/belajar">Ruang belajar</Link></nav><section className="lr-card"><span className="lr-eyebrow">Sertifikat penyelesaian e-course</span><h1>{c.revoked_at?'Sertifikat dicabut':'Sertifikat terverifikasi'}</h1><p>Diberikan kepada</p><h2>{String(c.participant_name)}</h2><p>untuk menyelesaikan program</p><h2>{String(c.program_name)}</h2><p>Nomor: {String(c.code)}</p><p>Terbit: {new Date(String(c.issued_at)).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'long'})}</p><p className="lr-muted">Sertifikat ini mencatat penyelesaian materi e-course. Gunakan menu cetak browser dan pilih Simpan sebagai PDF.</p></section></main>;}

import Link from 'next/link';
import { safeReturnPath } from '@/lib/product-links';
import LoginForm from './login-form';
export default async function AccountLoginPage({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const next=safeReturnPath((await searchParams).next);
  return <main className="portal-auth"><Link className="portal-brand" href="/">Konsep STIFIn</Link><section className="portal-card"><span className="portal-eyebrow">SATU AKUN KONSEPSTIFIn</span><h1>Selamat datang kembali.</h1><p>Masuk untuk membuka kelas, memeriksa pembelian, atau mengelola aktivitas promotor.</p><p className="portal-auth-context">Satu akun digunakan bersama. Menu yang tersedia menyesuaikan peran dan akses yang diberikan kepada Anda.</p><LoginForm next={next}/><p className="portal-muted">Belum punya kata sandi? Minta tautan aktivasi pribadi kepada kepala cabang.</p><p className="portal-muted">Belum punya akun peserta? <Link href={'/akun/daftar?next='+encodeURIComponent(next)}>Daftar di sini</Link>.</p><Link href="/">← Kembali ke website</Link></section></main>;
}

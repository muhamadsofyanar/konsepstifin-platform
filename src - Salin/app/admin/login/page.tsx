import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import LoginForm from './login-form';

export const metadata = { title: 'Login Tim | Konsep STIFIn' };

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect('/admin');
  return <main className="admin-login-page">
    <section className="admin-login-brand">
      <Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link>
      <div><span>PORTAL TIM</span><h1>Kelola layanan dalam satu ruang kerja.</h1><p>Pantau klien, promotor, konten, pesanan, dan pembayaran Konsep STIFIn.</p></div>
      <small>Area ini hanya untuk pengelola yang memiliki akses.</small>
    </section>
    <section className="admin-login-panel"><div><span>AKSES PENGELOLA</span><h2>Masuk ke dashboard</h2><p>Gunakan akun admin yang telah disiapkan untuk platform ini.</p><LoginForm/><Link href="/">← Kembali ke website</Link></div></section>
  </main>;
}


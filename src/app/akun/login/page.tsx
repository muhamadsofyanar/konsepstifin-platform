import Link from 'next/link';
import LoginForm from './login-form';
export default function AccountLoginPage() {
  return <main className="portal-auth"><Link className="portal-brand" href="/">Konsep STIFIn</Link><section className="portal-card"><span className="portal-eyebrow">SATU AKUN KONSEPSTIFIn</span><h1>Selamat datang kembali.</h1><p>Masuk untuk membuka kelas, melihat pembelian, atau mengelola aktivitas promotor.</p><LoginForm/><p className="portal-muted">Belum punya kata sandi? Minta tautan aktivasi pribadi kepada kepala cabang.</p><p className="portal-muted">Belum punya akun peserta? <Link href="/akun/daftar">Daftar di sini</Link>.</p><Link href="/">← Kembali ke website</Link></section></main>;
}

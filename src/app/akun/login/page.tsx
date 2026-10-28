import Link from 'next/link';
import LoginForm from './login-form';
export default function AccountLoginPage() {
  return <main className="portal-auth"><Link className="portal-brand" href="/">Konsep STIFIn</Link><section className="portal-card"><span className="portal-eyebrow">AKUN PROMOTOR</span><h1>Selamat datang di ruang cabang.</h1><p>Masuk dengan akun promotor yang telah diaktifkan oleh cabang Anda.</p><LoginForm/><p className="portal-muted">Belum punya kata sandi? Minta tautan aktivasi pribadi kepada kepala cabang.</p><Link href="/">← Kembali ke website</Link></section></main>;
}

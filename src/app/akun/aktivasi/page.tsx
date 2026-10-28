import Link from 'next/link';
import ActivationForm from './activation-form';
export default function ActivationPage() {
  return <main className="portal-auth"><Link className="portal-brand" href="/">Konsep STIFIn</Link><section className="portal-card"><span className="portal-eyebrow">AKTIVASI PRIBADI</span><h1>Siapkan akun promotor Anda.</h1><p>Buat kata sandi pribadi untuk akun yang telah disiapkan kepala cabang. Jangan bagikan tautan aktivasi Anda.</p><ActivationForm/></section></main>;
}

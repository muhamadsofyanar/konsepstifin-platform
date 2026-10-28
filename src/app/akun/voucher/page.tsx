import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import { getVoucherPortal } from '@/lib/voucher-store';
import VoucherClient from './voucher-client';
export const dynamic = 'force-dynamic';
export default async function VoucherPage() {
  let principal; try { principal = await getAccountPrincipal(); } catch { return <main className="portal-shell"><h1>Layanan akun belum tersedia</h1></main>; }
  if (!principal || !principal.active || !principal.sessionValid) redirect('/akun/login');
  if (!principal.roles.some(role => ['promoter', 'admin', 'super_admin'].includes(role))) return <main className="portal-shell"><h1>Akses promotor diperlukan</h1></main>;
  let portal; try { portal = await getVoucherPortal(principal.userId); } catch { return <main className="portal-shell"><Link href="/akun">← Akun promotor</Link><section className="portal-card"><h1>Voucher belum tersedia</h1><p>Keanggotaan promotor cabang dan konfigurasi voucher harus aktif. Hubungi kepala cabang.</p></section></main>; }
  return <main className="portal-shell"><header className="portal-header"><Link href="/akun">← Akun promotor</Link></header><section className="portal-welcome"><span className="portal-eyebrow">VOUCHER TES STIFIn</span><h1>Voucher promotor</h1><p>Saldo resmi dan pembelian untuk kode promotor Anda sendiri.</p></section><VoucherClient portal={portal}/></main>;
}

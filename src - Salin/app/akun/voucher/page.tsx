import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import { getVoucherPortal } from '@/lib/voucher-store';
import { getPublicIntegrationSettings } from '@/lib/integration-settings';
import MemberMenu from '../components/member-menu';
import VoucherClient from './voucher-client';
export const dynamic = 'force-dynamic';
export default async function VoucherPage() {
  let principal; try { principal = await getAccountPrincipal(); } catch { return <main className="portal-shell"><h1>Layanan akun belum tersedia</h1></main>; }
  if (!principal || !principal.active || !principal.sessionValid) redirect('/akun/login');
  if (!principal.roles.some(role => ['promoter', 'admin', 'super_admin'].includes(role))) return <main className="portal-shell"><h1>Akses promotor diperlukan</h1></main>;
  let portal; try { portal = await getVoucherPortal(principal.userId); let whatsappContact=''; try { whatsappContact=(await getPublicIntegrationSettings()).starsender.businessNumber || ''; } catch { /* Keep portal available if public contact settings are unavailable. */ } portal = { ...portal, whatsappContact }; } catch { return <main className="portal-shell"><Link href="/akun">← Akun promotor</Link><section className="portal-card"><h1>Voucher belum tersedia</h1><p>Keanggotaan promotor cabang dan konfigurasi voucher harus aktif. Hubungi kepala cabang.</p></section></main>; }
  return <main className="portal-shell"><header className="portal-header"><Link className="portal-brand" href="/">KonsepSTIFIn</Link><Link href="/akun">Akun saya ↗</Link></header><MemberMenu roles={principal.roles} active="/akun/voucher"/><section className="portal-welcome"><span className="portal-eyebrow">VOUCHER TES STIFIn</span><h1>Voucher promotor</h1><p>Saldo resmi dan pembelian untuk kode promotor Anda sendiri.</p></section><VoucherClient portal={portal}/></main>;
}

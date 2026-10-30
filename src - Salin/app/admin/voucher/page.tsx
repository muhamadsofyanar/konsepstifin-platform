import { redirect } from 'next/navigation';
import { getAdminPrincipal } from '@/lib/admin-auth';
import { getAdminVouchers } from '@/lib/voucher-store';
import VoucherManager from './voucher-manager';
export const dynamic = 'force-dynamic';
export default async function AdminVoucherPage() {
  if (!await getAdminPrincipal()) redirect('/admin/login');
  let data;
  try { data = await getAdminVouchers(); } catch { return <main className="portal-page"><h1>Voucher promotor</h1><p role="alert">Data voucher belum dapat dibaca. Periksa konfigurasi dan migrasi database.</p></main>; }
  return <VoucherManager initial={data}/>;
}

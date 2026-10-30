import type { Metadata } from 'next';
import PortalNavigation from './portal-navigation';
import './crm.css';
import { getAccountPrincipal } from '@/lib/identity/server';

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let principal: Awaited<ReturnType<typeof getAccountPrincipal>> = null;
  try { principal = await getAccountPrincipal(); } catch { /* Layout remains renderable; protected pages enforce their own access checks. */ }
  return <><PortalNavigation email={principal?.email??''} roles={principal?.roles??[]} />{children}</>;
}

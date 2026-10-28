import type { Metadata } from 'next';
import PortalNavigation from './portal-navigation';
import './crm.css';
import { getAdminPrincipal } from '@/lib/admin-auth';

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const principal=await getAdminPrincipal();
  return <><PortalNavigation email={principal?.email??''} />{children}</>;
}

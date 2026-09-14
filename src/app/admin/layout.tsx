import type { Metadata } from 'next';
import PortalNavigation from './portal-navigation';
import './crm.css';

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><PortalNavigation />{children}</>;
}

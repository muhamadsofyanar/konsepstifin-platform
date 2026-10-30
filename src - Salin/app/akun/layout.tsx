import type { Metadata } from 'next';
import './portal.css';
export const metadata: Metadata = { title: 'Akun Saya | Konsep STIFIn', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export const dynamic = 'force-dynamic';
export default function AccountLayout({ children }: { children: React.ReactNode }) { return <div className="promoter-portal">{children}</div>; }

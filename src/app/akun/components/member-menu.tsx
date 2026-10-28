import Link from 'next/link';
import { memberLinks } from '@/lib/portal-ui';
export default function MemberMenu({ roles, active }: {
    roles: readonly string[];
    active?: string;
}) { return <nav className="lr-member-menu" aria-label="Menu akun">{memberLinks(roles).map(l => <Link key={l.href} href={l.href} aria-current={l.href === active ? 'page' : undefined}>{l.label}</Link>)}</nav>; }

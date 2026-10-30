import Link from 'next/link';
import ChatUnreadBadge from '@/app/components/dashboard-chat/unread-badge';
import { memberLinks } from '@/lib/portal-ui';
export default function MemberMenu({ roles, active, compact = false }: {
    roles: readonly string[];
    active?: string;
    compact?: boolean;
}) { return <nav className="lr-member-menu" aria-label="Menu akun">{memberLinks(roles).filter(l=>!compact||!l.href.startsWith('/belajar')).map(l => <Link key={l.href} href={l.href} aria-current={l.href === active ? 'page' : undefined}>{l.label}{l.href==='/akun/pesan'&&<ChatUnreadBadge/>}</Link>)}</nav>; }

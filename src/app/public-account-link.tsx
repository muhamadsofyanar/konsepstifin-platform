'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type AccountLinkState = { href: string; label: string };
const guest: AccountLinkState = { href: '/akun/login?next=%2Fakun', label: 'Masuk' };

export default function PublicAccountLink() {
  const [account, setAccount] = useState<AccountLinkState>(guest);

  useEffect(() => {
    let active = true;
    fetch('/api/account/me', { cache: 'no-store' }).then(async response => {
      if (!response.ok) return null;
      return await response.json() as { accountType?: string };
    }).then(data => {
      if (!active || !data?.accountType) return;
      const next = data.accountType === 'admin'
        ? { href: '/admin', label: 'Ruang admin' }
        : data.accountType === 'branch_manager'
          ? { href: '/akun', label: 'Pusat cabang' }
          : data.accountType === 'promoter'
            ? { href: '/akun', label: 'Pusat promotor' }
            : data.accountType === 'affiliate'
              ? { href: '/akun/mitra', label: 'Pusat mitra' }
              : data.accountType === 'instructor'
                ? { href: '/akun', label: 'Akun pengajar' }
                : { href: '/akun', label: 'Akun peserta' };
      setAccount(next);
    }).catch(() => {
      // Keep the guest link if the optional account endpoint is temporarily unavailable.
    });
    return () => { active = false; };
  }, []);

  if (account.href === guest.href) return <><Link className="text-button" href={account.href}>Masuk</Link><Link className="text-button public-register-link" href="/akun/daftar">Daftar akun</Link></>;

  return <Link className="text-button" href={account.href}>{account.label}</Link>;
}

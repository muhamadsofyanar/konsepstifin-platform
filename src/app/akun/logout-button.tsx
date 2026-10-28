'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function LogoutButton() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function logout() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account/logout', { method: 'POST', cache: 'no-store' });
      if (!response.ok) throw new Error('Keluar belum berhasil. Silakan coba lagi.');
      router.replace('/akun/login'); router.refresh();
    } catch { setMessage('Keluar belum berhasil. Silakan coba lagi.'); setBusy(false); }
  }
  return <div><button className="portal-secondary" onClick={logout} disabled={busy}>{busy ? 'Keluar…' : 'Keluar'}</button>{message && <p role="alert">{message}</p>}</div>;
}

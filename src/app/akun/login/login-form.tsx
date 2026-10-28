'use client';
import { safeReturnPath } from '@/lib/product-links';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function LoginForm({next}:{next?:string}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Masuk belum berhasil.');
      router.replace(safeReturnPath(next)); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Layanan akun belum tersedia.'); }
    finally { setBusy(false); }
  }
  return <form className="portal-form" onSubmit={submit}>
    <label>Email<input type="email" name="email" autoComplete="username" required maxLength={254}/></label>
    <label>Kata sandi<input type="password" name="password" autoComplete="current-password" required maxLength={1024}/></label>
    {message && <p role="alert" className="portal-error">{message}</p>}
    <button disabled={busy} type="submit">{busy ? 'Memeriksa…' : 'Masuk'}</button>
  </form>;
}

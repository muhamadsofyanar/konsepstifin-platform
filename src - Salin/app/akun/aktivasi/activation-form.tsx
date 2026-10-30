'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
export default function ActivationForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    setMessage('');
    if (password !== form.get('confirmation')) { setMessage('Kata sandi tidak sama. Periksa kembali.'); return; }
    if (password.length < 12 || password.length > 1024) { setMessage('Gunakan kata sandi 12–1024 karakter.'); return; }
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    if (!/^[a-f0-9]{64}$/.test(token)) { setMessage('Tautan aktivasi tidak lengkap. Minta tautan baru kepada kepala cabang.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/account/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Aktivasi belum berhasil.');
      window.history.replaceState(null, '', window.location.pathname);
      setDone(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Layanan akun belum tersedia.'); }
    finally { setBusy(false); }
  }
  if (done) return <div role="status"><h2>Akun berhasil diaktifkan.</h2><p>Gunakan email terdaftar dan kata sandi baru untuk masuk.</p><Link className="portal-link-button" href="/akun/login">Masuk ke akun</Link></div>;
  return <form className="portal-form" onSubmit={submit}>
    <label>Kata sandi baru<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required/></label>
    <label>Ulangi kata sandi<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required/></label>
    <p className="portal-muted">Minimal 12 karakter. Tautan berlaku 7 hari dan hanya dapat digunakan sekali.</p>
    {message && <p role="alert" className="portal-error">{message}</p>}
    <button type="submit" disabled={busy}>{busy ? 'Mengaktifkan…' : 'Aktifkan akun'}</button>
  </form>;
}

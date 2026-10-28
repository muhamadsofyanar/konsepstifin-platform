'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Input, Notice } from '../../belajar/ui';
import '../../belajar/learning.css';
export default function Page() { const [busy, setBusy] = useState(false), [message, setMessage] = useState(''); return <main className="learning"><nav><strong>KonsepSTIFIn</strong><Link href="/belajar">Katalog kelas</Link><Link href="/akun/login">Masuk</Link></nav><section className="card"><h1>Daftar peserta.</h1><p>Sudah punya akun promotor atau peserta? Gunakan akun yang sama melalui halaman masuk.</p><form onSubmit={async (e) => { e.preventDefault(); if (busy)
    return; const d = Object.fromEntries(new FormData(e.currentTarget)); setBusy(true); try {
    const r = await fetch('/api/account/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    setMessage((await r.json()).message);
}
catch {
    setMessage('Pendaftaran belum berhasil.');
}
finally {
    setBusy(false);
} }}><Input name="email" label="Email" type="email" maxLength={254}/><label>Kata sandi (minimal 12 karakter)<input type="password" name="password" minLength={12} maxLength={1024} required autoComplete="new-password"/></label><Notice message={message}/><button disabled={busy}>{busy ? 'Menyimpan…' : 'Daftar'}</button></form><p><Link href="/akun/login">Masuk ke akun →</Link></p></section></main>; }

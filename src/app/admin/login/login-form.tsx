'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Login gagal.');
      router.replace('/admin/artikel');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login gagal.');
    } finally {
      setLoading(false);
    }
  }

  return <form className="admin-login-form" onSubmit={submit}>
    <label>Email admin<input name="email" type="email" autoComplete="username" placeholder="admin@konsepstifin.com" required /></label>
    <label>Kata sandi<input name="password" type="password" autoComplete="current-password" placeholder="Masukkan kata sandi" minLength={8} required /></label>
    {message && <p className="admin-form-error">{message}</p>}
    <button type="submit" disabled={loading}>{loading ? 'Memeriksa…' : 'Masuk ke dashboard →'}</button>
  </form>;
}


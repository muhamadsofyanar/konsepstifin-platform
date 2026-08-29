'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { validateAndGetClaimLink } from '@/lib/interest-store';

type SafeClaimData = {
  refCode: string;
  regencyName?: string;
  provinceName?: string;
  service: string;
  scheduleSafe: string;
  expiresAt?: string;
  active: boolean;
};

function formatDate(value?: string) {
  if (!value) return '';
  try { return new Date(value).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }); } catch { return value; }
}

export default function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('');
  const [data, setData] = useState<SafeClaimData | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [promoterCode, setPromoterCode] = useState('');
  const [state, setState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const check = await fetch(`/api/claim?token=${encodeURIComponent(token)}`, { method: 'GET' });
        if (check.ok) {
          const json = await check.json() as SafeClaimData & { error?: string };
          if (json.error) { setInvalid(true); return; }
          setData(json);
        } else {
          setInvalid(true);
        }
      } catch {
        setInvalid(true);
      }
    }
    void load();
  }, [token]);

  async function submit() {
    setState('submitting'); setMessage('');
    const code = promoterCode.trim().toUpperCase();
    if (code.length < 2) {
      setState('error'); setMessage('Masukkan Kode ID promotor yang benar.');
      return;
    }
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, promoterCode: code }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setState('error'); setMessage(json.error || 'Klaim gagal. Hubungi admin jika ini berlanjut.');
        return;
      }
      setState('submitted');
    } catch (e) {
      setState('error'); setMessage('Jaringan atau server belum merespons. Coba sebentar lagi.');
    }
  }

  if (invalid) {
    return (
      <main className="claim-page invalid">
        <div className="claim-card">
          <span className="eyebrow">TAUTAN KLAIM</span>
          <h1>Tautan tidak valid</h1>
          <p>Tautan klaim ini tidak sesuai, sudah kedaluwarsa, atau telah dinonaktifkan. Untuk menanyakan lead yang tersedia, hubungi admin Konsep STIFIn melalui grup resmi.</p>
          <Link href="/wilayah" className="public-cta">Kembali ke halaman wilayah →</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="claim-page"><div className="claim-card"><p>Memuat tautan klaim…</p></div></main>;
  }

  const wilayah = [data.regencyName, data.provinceName].filter(Boolean).join(', ') || 'sesuai permintaan';

  return (
    <main className="claim-page">
      <div className="claim-card">
        <span className="eyebrow">TAUTAN KLAIM LEAD · {data.refCode}</span>
        <h1>Ajukan klaim layanan</h1>
        <p>Tautan ini hanya untuk promotor dalam jaringan STIFIn Genetic. Data calon konsumen tidak ditampilkan di halaman ini. Admin Konsep STIFIn akan menetapkan satu promotor dan membagikan data secara pribadi setelah klaim disetujui.</p>

        <dl className="claim-safe-info">
          <div><dt>Referensi</dt><dd><b>{data.refCode}</b></dd></div>
          <div><dt>Wilayah</dt><dd>{wilayah}</dd></div>
          <div><dt>Jenis layanan</dt><dd>{data.service}</dd></div>
          <div><dt>Kebutuhan jadwal</dt><dd>{data.scheduleSafe}</dd></div>
          {data.expiresAt && (
            <div><dt>Tautan ini berlaku hingga</dt><dd className={!data.active ? 'expired' : ''}>{formatDate(data.expiresAt)}</dd></div>
          )}
        </dl>

        {!data.active ? (
          <div className="claim-inactive">
            <h3>Tautan ini sudah tidak aktif.</h3>
            <p>Hubungi admin jika Anda berminat menangani lead serupa di wilayah {wilayah}.</p>
          </div>
        ) : state === 'submitted' ? (
          <div className="claim-submitted">
            <h3>Klaim Anda telah tercatat</h3>
            <p>Terima kasih, Kode ID <b>{promoterCode.trim().toUpperCase()}</b>. Admin akan meninjau semua pengajuan dan menetapkan satu promotor untuk lead ini. Jika Anda ditetapkan, data calon konsumen akan dibagikan melalui WhatsApp. Pantau grup resmi untuk informasi selengkapnya.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <label>
              Kode ID promotor
              <input
                type="text"
                placeholder="Contoh: ABC123"
                value={promoterCode}
                onChange={(e) => setPromoterCode(e.target.value)}
                autoCapitalize="characters"
                autoCorrect="off"
                required
                minLength={2}
              />
              <small>Masukkan Kode ID Anda sesuai data pada pusat STIFIn. Sistem akan memvalidasi bahwa kode ini tercatat aktif pada sumber promotor nasional.</small>
            </label>
            {state === 'error' && <p className="claim-error" role="alert">{message}</p>}
            <button
              className="public-cta big"
              type="submit"
              disabled={state === 'submitting'}
            >
              {state === 'submitting' ? 'Memvalidasi…' : 'Ajukan klaim →'}
            </button>
            <p className="privacy-note">
              Dengan mengajukan klaim, Anda menyatakan bahwa Kode ID ini adalah milik Anda dan bersedia mengikuti ketentuan koordinasi Konsep STIFIn.
              Jangan membagikan data calon konsumen di grup atau publik.
            </p>
          </form>
        )}
        <Link href="/" className="claim-home">← Kembali ke beranda Konsep STIFIn</Link>
      </div>
    </main>
  );
}

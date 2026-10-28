'use client';
import { useState } from 'react';
type Invite = { activationUrl: string; expiresAt: string };
export default function InviteButton({ userId }: { userId: string }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function issue() {
    if (busy) return; setBusy(true); setMessage(''); setInvite(null);
    try {
      const response = await fetch('/api/admin/network', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ userId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Tautan belum dapat diterbitkan.');
      setInvite(data);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Layanan belum tersedia.'); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(invite!.activationUrl); setMessage('Tautan disalin. Bagikan hanya kepada pemilik akun ini.'); }
    catch { setMessage('Pilih tautan di atas lalu salin secara manual.'); }
  }
  return <div className="network-invite"><button type="button" disabled={busy} onClick={issue}>{busy ? 'Menerbitkan…' : invite ? 'Terbitkan ulang tautan' : 'Terbitkan tautan aktivasi'}</button>
    {invite && <div className="network-secret"><p>Tautan sebelumnya tidak berlaku. Tautan baru ini hanya untuk pemilik akun dan berlaku hingga {new Date(invite.expiresAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.</p><label>Tautan aktivasi pribadi<input readOnly value={invite.activationUrl} onFocus={event => event.currentTarget.select()}/></label><button type="button" onClick={copy}>Salin tautan pribadi</button><button className="network-secondary" type="button" onClick={() => { setInvite(null); setMessage(''); }}>Tutup tautan</button><small>Tidak ada email yang dikirim otomatis. Menutup tampilan tidak membatalkan tautan.</small></div>}
    {message && <p role="status">{message}</p>}
  </div>;
}

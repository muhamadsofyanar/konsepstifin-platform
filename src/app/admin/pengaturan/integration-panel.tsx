'use client';
import { useState } from 'react';
type UnmatchedEvent = { event_id: string; event_type: string; amount: number | null; reference: string; processing_note: string; received_at: string; order_id: number | null };
type Props = { moota: { apiConfigured: boolean; webhookConfigured: boolean; receiveMoneyPathConfigured: boolean; bankAccountConfigured: boolean }; starsender: { configured: boolean; endpoint: string }; webhookUrl: string };
export default function IntegrationPanel({ moota, starsender, webhookUrl }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState<UnmatchedEvent[]>([]);
  const [eventsOpen, setEventsOpen] = useState(false);
  async function test() {
    setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/admin/integrations/moota/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Tes koneksi Moota gagal.');
      setMessage(data.message || 'Moota terhubung.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Tes koneksi Moota gagal.'); }
    finally { setBusy(false); }
  }
  async function loadUnmatched() {
    setError('');
    try { const response = await fetch('/api/admin/integrations/moota/events', { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Riwayat webhook gagal dibaca.'); setEvents(data.events || []); setEventsOpen(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Riwayat webhook gagal dibaca.'); }
  }
  async function reconcileEvent(event: UnmatchedEvent) {
    const value = window.prompt(`Masukkan ID pesanan KonsepSTIFIn untuk webhook ${event.event_id}:`);
    if (value === null) return;
    const orderId = Number(value.trim());
    if (!Number.isSafeInteger(orderId) || orderId < 1) { setError('ID pesanan tidak valid.'); return; }
    setError(''); setMessage('');
    try { const response = await fetch('/api/admin/integrations/moota/events/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: event.event_id, orderId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Rekonsiliasi gagal.'); setMessage(data.message || 'Rekonsiliasi berhasil.'); await loadUnmatched(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Rekonsiliasi gagal.'); }
  }
  const status = (ready: boolean) => <span className={ready ? 'portal-success' : 'portal-error'}>{ready ? 'Terkonfigurasi' : 'Belum diatur'}</span>;
  return <section className="portal-card" style={{ marginBottom: 20 }}>
    <h2>Integrasi eksternal</h2>
    <p>Token disimpan hanya di environment server Coolify. Nilai rahasia tidak ditampilkan pada dashboard.</p>
    <div className="portal-columns">
      <div><h3>Moota API V2 / Terima Uang</h3><ul>
        <li>API token: {status(moota.apiConfigured)}</li>
        <li>Secret webhook: {status(moota.webhookConfigured)}</li>
        <li>Path create Terima Uang: {status(moota.receiveMoneyPathConfigured)}</li>
        <li>ID rekening Moota: {status(moota.bankAccountConfigured)}</li>
      </ul><p><strong>URL webhook:</strong><br /><code>{webhookUrl}</code></p><button type="button" onClick={test} disabled={busy || !moota.apiConfigured}>{busy ? 'Menguji koneksi…' : 'Tes koneksi Moota'}</button></div>
      <div><h3>StarSender WhatsApp</h3><p>API key: {status(starsender.configured)}</p><p>Endpoint: <code>{starsender.endpoint}</code></p><p>Dipakai untuk notifikasi link pembayaran, konfirmasi pembayaran, dan kampanye marketing dengan persetujuan eksplisit.</p><a href="https://docs.starsender.online/docs/message-api/kirim-pesan/" target="_blank" rel="noopener noreferrer">Dokumentasi API StarSender ↗</a></div>
    </div>
    <div style={{ marginTop: 16 }}><button type="button" onClick={() => void loadUnmatched()}>Lihat webhook yang perlu rekonsiliasi</button></div>
    {eventsOpen && <div style={{ marginTop: 12 }}><h3>Webhook Moota belum cocok ({events.length})</h3>{events.length ? <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Waktu</th><th>Nominal</th><th>Referensi</th><th>Catatan</th><th>Tindakan</th></tr></thead><tbody>{events.map(event => <tr key={event.event_id}><td>{new Date(event.received_at).toLocaleString('id-ID')}</td><td>{event.amount === null ? '—' : `Rp${Number(event.amount).toLocaleString('id-ID')}`}</td><td>{event.reference || event.event_id}</td><td>{event.processing_note}</td><td><button type="button" onClick={() => void reconcileEvent(event)}>Cocokkan ke pesanan</button></td></tr>)}</tbody></table></div> : <p>Tidak ada webhook yang perlu rekonsiliasi.</p>}</div>}
    {message && <p className="portal-success" role="status">{message}</p>}{error && <p className="portal-error" role="alert">{error}</p>}
  </section>;
}

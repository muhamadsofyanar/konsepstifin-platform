'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
type UnmatchedEvent = { event_id: string; event_type: string; amount: number | null; reference: string; processing_note: string; received_at: string; order_id: number | null };
type PublicSettings = {
  moota: { baseUrl: string; apiTokenConfigured: boolean; webhookSecretConfigured: boolean; bankAccountId: string; receiveMoneyCreatePath: string; bankAccountField: string; timeoutMs: number };
  starsender: { apiKeyConfigured: boolean; apiUrl: string };
};
type Props = { moota: { apiConfigured: boolean; webhookConfigured: boolean; receiveMoneyPathConfigured: boolean; bankAccountConfigured: boolean }; starsender: { configured: boolean; endpoint: string }; settings: PublicSettings; isOwner: boolean; webhookUrl: string };
export default function IntegrationPanel({ moota, starsender, settings: initial, isOwner, webhookUrl }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [apiToken, setApiToken] = useState(''), [webhookSecret, setWebhookSecret] = useState(''), [senderKey, setSenderKey] = useState('');
  const [clearSecrets, setClearSecrets] = useState<string[]>([]);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [events, setEvents] = useState<UnmatchedEvent[]>([]), [eventsOpen, setEventsOpen] = useState(false);
  const status = (ready: boolean) => <span className={ready ? 'portal-success' : 'portal-error'}>{ready ? 'Terkonfigurasi' : 'Belum diatur'}</span>;
  function toggleClear(key: string, checked: boolean) { setClearSecrets(old => checked ? [...new Set([...old, key])] : old.filter(item => item !== key)); }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/admin/integrations/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        moota: { ...settings.moota, apiToken, webhookSecret }, starsender: { ...settings.starsender, apiKey: senderKey }, clearSecrets,
      }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Pengaturan integrasi gagal disimpan.');
      setSettings(data.settings); setApiToken(''); setWebhookSecret(''); setSenderKey(''); setClearSecrets([]);
      setMessage('Pengaturan integrasi tersimpan. Perubahan berlaku tanpa redeploy.'); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Pengaturan integrasi gagal disimpan.'); }
    finally { setBusy(false); }
  }
  async function test() {
    setBusy(true); setMessage(''); setError('');
    try { const response = await fetch('/api/admin/integrations/moota/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Tes koneksi Moota gagal.'); setMessage(data.message || 'Moota terhubung.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Tes koneksi Moota gagal.'); } finally { setBusy(false); }
  }
  async function loadUnmatched() {
    setError('');
    try { const response = await fetch('/api/admin/integrations/moota/events', { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Riwayat webhook gagal dibaca.'); setEvents(data.events || []); setEventsOpen(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Riwayat webhook gagal dibaca.'); }
  }
  async function reconcileEvent(event: UnmatchedEvent) {
    const value = window.prompt(`Masukkan ID pesanan KonsepSTIFIn untuk webhook ${event.event_id}:`); if (value === null) return;
    const orderId = Number(value.trim()); if (!Number.isSafeInteger(orderId) || orderId < 1) { setError('ID pesanan tidak valid.'); return; }
    setError(''); setMessage('');
    try { const response = await fetch('/api/admin/integrations/moota/events/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: event.event_id, orderId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Rekonsiliasi gagal.'); setMessage(data.message || 'Rekonsiliasi berhasil.'); await loadUnmatched(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Rekonsiliasi gagal.'); }
  }
  return <section className="portal-card" style={{ marginBottom: 20 }}>
    <h2>Integrasi eksternal</h2>
    <p>API key dan secret dapat diubah dari halaman ini tanpa redeploy. Nilai rahasia tidak pernah ditampilkan kembali setelah disimpan. Kosongkan kolom secret untuk mempertahankan nilai lama.</p>
    {!isOwner && <p className="portal-error">Hanya akun pemilik platform yang dapat mengubah kredensial integrasi.</p>}
    <div className="portal-columns"><div><h3>Moota API V2 / Terima Uang</h3><ul><li>API token: {status(moota.apiConfigured)}</li><li>Secret webhook: {status(moota.webhookConfigured)}</li><li>Path Create Terima Uang: {status(moota.receiveMoneyPathConfigured)}</li><li>ID rekening Moota: {status(moota.bankAccountConfigured)}</li></ul><p><strong>URL webhook:</strong><br/><code>{webhookUrl || 'PLATFORM_ORIGIN belum diatur'}</code></p><button type="button" onClick={test} disabled={busy || !moota.apiConfigured}>Tes koneksi Moota</button></div>
      <div><h3>StarSender WhatsApp</h3><p>API key: {status(starsender.configured)}</p><p>Endpoint: <code>{settings.starsender.apiUrl}</code></p><p>Dipakai untuk notifikasi transaksi dan kampanye marketing sesuai persetujuan kontak.</p><a href="https://docs.starsender.online/docs/message-api/kirim-pesan/" target="_blank" rel="noopener noreferrer">Dokumentasi StarSender ↗</a></div></div>
    <form className="portal-form" onSubmit={save} style={{ marginTop: 18 }}><fieldset disabled={busy || !isOwner}>
      <h3>Konfigurasi Moota</h3>
      <label>URL dasar API<input type="url" required value={settings.moota.baseUrl} onChange={e => setSettings({ ...settings, moota: { ...settings.moota, baseUrl: e.target.value } })} placeholder="https://app.moota.co" /></label>
      <label>API token<input type="password" autoComplete="new-password" value={apiToken} onChange={e => { setApiToken(e.target.value); toggleClear('moota.apiToken', false); }} placeholder={settings.moota.apiTokenConfigured ? 'Sudah tersimpan. Kosongkan untuk mempertahankan.' : 'Tempel API token Moota'} /></label>
      {settings.moota.apiTokenConfigured && <label><input type="checkbox" checked={clearSecrets.includes('moota.apiToken')} onChange={e => toggleClear('moota.apiToken', e.target.checked)} /> Hapus token Moota yang tersimpan</label>}
      <label>Secret webhook<input type="password" autoComplete="new-password" value={webhookSecret} onChange={e => { setWebhookSecret(e.target.value); toggleClear('moota.webhookSecret', false); }} placeholder={settings.moota.webhookSecretConfigured ? 'Sudah tersimpan. Kosongkan untuk mempertahankan.' : 'Secret untuk validasi webhook'} /></label>
      {settings.moota.webhookSecretConfigured && <label><input type="checkbox" checked={clearSecrets.includes('moota.webhookSecret')} onChange={e => toggleClear('moota.webhookSecret', e.target.checked)} /> Hapus secret webhook yang tersimpan</label>}
      <label>ID rekening Moota<input value={settings.moota.bankAccountId} maxLength={200} onChange={e => setSettings({ ...settings, moota: { ...settings.moota, bankAccountId: e.target.value } })} /></label>
      <label>Path Create Terima Uang<input value={settings.moota.receiveMoneyCreatePath} maxLength={300} onChange={e => setSettings({ ...settings, moota: { ...settings.moota, receiveMoneyCreatePath: e.target.value } })} placeholder="Isi persis sesuai dokumentasi API aktif" /></label>
      <label>Nama field ID rekening<input value={settings.moota.bankAccountField} maxLength={80} onChange={e => setSettings({ ...settings, moota: { ...settings.moota, bankAccountField: e.target.value } })} /></label>
      <label>Timeout API (milidetik)<input type="number" min={3000} max={30000} value={settings.moota.timeoutMs} onChange={e => setSettings({ ...settings, moota: { ...settings.moota, timeoutMs: Number(e.target.value) } })} /></label>
      <h3>Konfigurasi StarSender</h3>
      <label>Endpoint API<input type="url" required value={settings.starsender.apiUrl} onChange={e => setSettings({ ...settings, starsender: { ...settings.starsender, apiUrl: e.target.value } })} /></label>
      <label>API key StarSender<input type="password" autoComplete="new-password" value={senderKey} onChange={e => { setSenderKey(e.target.value); toggleClear('starsender.apiKey', false); }} placeholder={settings.starsender.apiKeyConfigured ? 'Sudah tersimpan. Kosongkan untuk mempertahankan.' : 'Tempel Device API key StarSender'} /></label>
      {settings.starsender.apiKeyConfigured && <label><input type="checkbox" checked={clearSecrets.includes('starsender.apiKey')} onChange={e => toggleClear('starsender.apiKey', e.target.checked)} /> Hapus API key StarSender yang tersimpan</label>}
      <button className="portal-primary" type="submit">{busy ? 'Menyimpan…' : 'Simpan integrasi tanpa redeploy'}</button>
    </fieldset></form>
    <div style={{ marginTop: 16 }}><button type="button" onClick={() => void loadUnmatched()}>Lihat webhook yang perlu rekonsiliasi</button></div>
    {eventsOpen && <div style={{ marginTop: 12 }}><h3>Webhook Moota belum cocok ({events.length})</h3>{events.length ? <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Waktu</th><th>Nominal</th><th>Referensi</th><th>Catatan</th><th>Tindakan</th></tr></thead><tbody>{events.map(event => <tr key={event.event_id}><td>{new Date(event.received_at).toLocaleString('id-ID')}</td><td>{event.amount === null ? '—' : `Rp${Number(event.amount).toLocaleString('id-ID')}`}</td><td>{event.reference || event.event_id}</td><td>{event.processing_note}</td><td><button type="button" onClick={() => void reconcileEvent(event)}>Cocokkan ke pesanan</button></td></tr>)}</tbody></table></div> : <p>Tidak ada webhook yang perlu rekonsiliasi.</p>}</div>}
    {message && <p className="portal-success" role="status">{message}</p>}{error && <p className="portal-error" role="alert">{error}</p>}
  </section>;
}

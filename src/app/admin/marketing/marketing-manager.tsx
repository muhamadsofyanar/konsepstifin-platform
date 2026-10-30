'use client';
import { AttachmentInput, ContentPicker } from '@/components/whatsapp/content-tools';
import { useMemo, useState, type FormEvent } from 'react';

type Contact = { id: number; name: string; phone: string; service: string; status: string; whatsapp_marketing_consent: boolean; whatsapp_marketing_consent_at: string | null };
type Campaign = { scheduled_at: string; send_mode: string; id: string; title: string; recipient_count: number; created_at: string; pending_count: number; sending_count: number; sent_count: number; failed_count: number; unknown_count: number; awaiting_inbound_count: number };
function mapCampaign(row: Record<string, unknown>): Campaign { return { scheduled_at: String(row.scheduled_at ?? ''), send_mode: String(row.send_mode ?? 'inbound_first'), id: String(row.id ?? ''), title: String(row.title ?? ''), recipient_count: Number(row.recipient_count ?? 0), created_at: String(row.created_at ?? ''), pending_count: Number(row.pending_count ?? 0), sending_count: Number(row.sending_count ?? 0), sent_count: Number(row.sent_count ?? 0), failed_count: Number(row.failed_count ?? 0), unknown_count: Number(row.unknown_count ?? 0), awaiting_inbound_count: Number(row.awaiting_inbound_count ?? 0) }; }
export default function MarketingManager({ initialContacts, initialCampaigns }: { initialContacts: Array<Record<string, unknown>>; initialCampaigns: Array<Record<string, unknown>> }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts.map(row => ({ id: Number(row.id), name: String(row.name ?? ''), phone: String(row.phone ?? ''), service: String(row.service ?? ''), status: String(row.status ?? ''), whatsapp_marketing_consent: row.whatsapp_marketing_consent === true, whatsapp_marketing_consent_at: row.whatsapp_marketing_consent_at ? String(row.whatsapp_marketing_consent_at) : null })));
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns.map(mapCampaign));
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl,setMediaUrl] = useState('');
  const [uploading,setUploading] = useState(false);
  const [timing, setTiming] = useState<'now' | 'scheduled'>('scheduled');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [sendMode, setSendMode] = useState('consented_outbound');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => { const q = search.trim().toLocaleLowerCase('id-ID'); return contacts.filter(c => !q || `${c.name} ${c.phone} ${c.service}`.toLocaleLowerCase('id-ID').includes(q)); }, [contacts, search]);
  const consented = filtered.filter(c => c.whatsapp_marketing_consent);
  async function refreshCampaigns() {
    const response = await fetch('/api/admin/marketing', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Riwayat kampanye belum dapat dimuat.');
    setCampaigns(Array.isArray(result.campaigns) ? result.campaigns.map(mapCampaign) : []);
  }
  async function post(body: Record<string, unknown>) {
    const response = await fetch('/api/admin/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Permintaan gagal.');
    return result;
  }
  async function toggleConsent(contact: Contact) {
    const enabled = !contact.whatsapp_marketing_consent;
    if (enabled && !window.confirm(`Aktifkan promosi WhatsApp untuk ${contact.name}? Lanjutkan hanya jika persetujuan promosi eksplisit sudah diperoleh dan tercatat.`)) return;
    setBusy(`consent-${contact.id}`); setError(''); setNotice('');
    try {
      const result = await post({ action: 'consent', leadId: contact.id, enabled, confirmation: enabled });
      setContacts(current => current.map(c => c.id === contact.id ? { ...c, whatsapp_marketing_consent: enabled, whatsapp_marketing_consent_at: enabled ? String(result.lead.whatsapp_marketing_consent_at) : null } : c));
      setSelected(current => enabled ? current : current.filter(id => id !== contact.id));
      setNotice(enabled ? 'Persetujuan marketing diaktifkan.' : 'Persetujuan marketing dicabut.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Persetujuan gagal diperbarui.'); }
    finally { setBusy(''); }
  }
  function toggleSelected(id: number, checked: boolean) { setSelected(current => checked ? [...new Set([...current, id])].slice(0,100) : current.filter(value => value !== id)); }
  async function sendCampaign(event: FormEvent) {
    event.preventDefault(); setBusy('campaign'); setError(''); setNotice('');
    try {
      const scheduledAt = timing === 'now' ? new Date().toISOString() : new Date(`${scheduledLocal}:00+07:00`).toISOString();
      const result = await post({ action: 'campaign', title, message, leadIds: selected, scheduledAt, sendMode, mediaUrl });
      setNotice(result.message); setTitle(''); setMessage(''); setMediaUrl(''); setSelected([]);
      try { await refreshCampaigns(); }
      catch { setError('Kampanye berhasil masuk antrean, tetapi riwayat belum dapat diperbarui. Gunakan tombol Perbarui status.'); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Kampanye gagal dimasukkan ke antrean.'); }
    finally { setBusy(''); }
  }
  return <div className="portal-columns" style={{ alignItems: 'start' }}>
    <section className="portal-card">
      <h2>Kontak dan persetujuan</h2>
      <p>Persetujuan promosi terpisah dari izin menghubungi prospek untuk layanan. Aktifkan hanya setelah pelanggan menyetujui pesan promosi WhatsApp. Pencabutan persetujuan langsung mengecualikan kontak dari kampanye berikutnya.</p>
      <label className="portal-form">Cari kontak<input value={search} maxLength={120} onChange={e => setSearch(e.target.value)} placeholder="Nama, nomor, atau layanan" /></label>
      <p>{filtered.length} kontak ditampilkan, maksimal 200 kontak terbaru. {consented.length} memiliki persetujuan aktif.</p>
      <div className="wa-bulk-tools"><button type="button" disabled={Boolean(busy)} onClick={()=>setSelected(consented.slice(0,100).map(c=>c.id))}>Pilih semua kontak berizin (maks. 100)</button><button type="button" onClick={()=>setSelected([])}>Kosongkan pilihan kontak</button><small>Pilihan mengikuti hasil pencarian. Persetujuan kontak tetap dikelola per orang.</small></div>
      <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Pilih</th><th>Kontak</th><th>Layanan</th><th>Persetujuan promosi</th></tr></thead><tbody>
        {filtered.map(contact => <tr key={contact.id}><td><input aria-label={`Pilih ${contact.name}`} type="checkbox" disabled={!contact.whatsapp_marketing_consent} checked={selected.includes(contact.id)} onChange={e => toggleSelected(contact.id, e.target.checked)} /></td><td><strong>{contact.name}</strong><br /><small>{contact.phone}</small><br /><small>#{contact.id}</small></td><td>{contact.service || 'Belum diisi'}</td><td><label><input type="checkbox" checked={contact.whatsapp_marketing_consent} disabled={Boolean(busy)} onChange={() => void toggleConsent(contact)} /> {contact.whatsapp_marketing_consent ? 'Aktif' : 'Belum ada'}</label><br /><small>{contact.whatsapp_marketing_consent_at ? new Date(contact.whatsapp_marketing_consent_at).toLocaleDateString('id-ID') : 'Belum tercatat'}</small></td></tr>)}
        {!filtered.length && <tr><td colSpan={4}>Kontak tidak ditemukan.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="portal-card">
      <h2>Buat kampanye</h2>
      <p>Pilih satu kontak untuk pesan personal atau maksimal 100 kontak untuk kampanye. Tentukan tanggal dan jam dalam WIB. Persetujuan promosi aktif tetap diperlukan.</p>
      <form className="portal-form" onSubmit={sendCampaign}>
        <label>Judul internal<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label>
        <ContentPicker onSelect={t=>{setMessage(t.body);setMediaUrl(t.media_url || '');}}/>
        <AttachmentInput value={mediaUrl} onChange={setMediaUrl} onBusyChange={setUploading}/>
        <label>Isi pesan<textarea required={!mediaUrl} maxLength={4000} rows={8} value={message} onChange={e => setMessage(e.target.value)} placeholder="Gunakan {{nama}} untuk personalisasi nama penerima." /></label>
        <label>Waktu pengiriman<select value={timing} onChange={e => setTiming(e.target.value as 'now' | 'scheduled')}><option value="scheduled">Jadwalkan tanggal dan jam</option><option value="now">Kirim secepatnya</option></select></label>
        {timing === 'scheduled' && <label>Tanggal dan jam (WIB)<input type="datetime-local" required value={scheduledLocal} onChange={e => setScheduledLocal(e.target.value)} /></label>}
        <label>Mode pengiriman<select value={sendMode} onChange={e => setSendMode(e.target.value)}><option value="consented_outbound">Kirim ke kontak berizin tanpa menunggu chat masuk</option><option value="inbound_first">Tunggu chat pelanggan dalam 24 jam terakhir</option></select></label>
        <small>{sendMode === 'consented_outbound' ? 'Pesan dikirim melalui StarSender Device API sesuai jadwal, termasuk kepada kontak berizin yang belum pernah mengirim chat. Perintah STOP tetap berlaku.' : 'Jika jendela 24 jam belum tersedia, pesan menunggu chat pelanggan.'}</small>
        <p>{selected.length} penerima dipilih. Gunakan pesan yang relevan, tidak menyesatkan, dan sesuai persetujuan pelanggan.</p>
        <button className="portal-primary" type="submit" disabled={Boolean(busy) || uploading || selected.length === 0 || (!message.trim() && !mediaUrl)}>{busy === 'campaign' ? 'Memasukkan ke antrean…' : timing === 'scheduled' ? 'Simpan jadwal pengiriman' : 'Masukkan ke antrean kirim'}</button>
      </form>
      {error && <p className="portal-error" role="alert">{error}</p>}{notice && <p className="portal-success" role="status">{notice}</p>}
      <p><small>Pengiriman diproses worker. Pesan dengan hasil jaringan ambigu tidak dikirim ulang otomatis untuk mengurangi risiko duplikasi.</small></p>
      <h3 style={{ marginTop: 24 }}>Riwayat kampanye</h3>
      <p><small>Menampilkan 20 kampanye terakhir. Status dapat diperbarui setelah worker memproses antrean.</small></p>
      <button type="button" onClick={() => void refreshCampaigns().catch(e => setError(e instanceof Error ? e.message : 'Riwayat kampanye gagal dimuat.'))}>Perbarui status</button>
      <div style={{ overflowX: 'auto', marginTop: 12 }}><table><thead><tr><th>Kampanye</th><th>Jadwal (WIB)</th><th>Antrean</th><th>Terkirim</th><th>Gagal</th><th>Menunggu chat</th><th>Perlu cek</th></tr></thead><tbody>
        {campaigns.map(campaign => <tr key={campaign.id}><td><strong>{campaign.title}</strong><br /><small>{campaign.recipient_count} penerima</small></td><td>{campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '—'}<br /><small>{campaign.send_mode === 'consented_outbound' ? 'Kontak berizin' : 'Menunggu chat masuk'}</small></td><td>{campaign.pending_count + campaign.sending_count}<br /><small>{campaign.pending_count} menunggu · {campaign.sending_count} diproses</small></td><td>{campaign.sent_count}</td><td>{campaign.failed_count}</td><td>{campaign.awaiting_inbound_count}</td><td>{campaign.unknown_count}</td></tr>)}
        {!campaigns.length && <tr><td colSpan={7}>Belum ada kampanye.</td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}

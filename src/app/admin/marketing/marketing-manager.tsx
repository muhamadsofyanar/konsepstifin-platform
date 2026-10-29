'use client';
import { useMemo, useState, type FormEvent } from 'react';

type Contact = { id: number; name: string; phone: string; service: string; status: string; whatsapp_marketing_consent: boolean; whatsapp_marketing_consent_at: string | null };
export default function MarketingManager({ initialContacts }: { initialContacts: Array<Record<string, unknown>> }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts.map(row => ({ id: Number(row.id), name: String(row.name ?? ''), phone: String(row.phone ?? ''), service: String(row.service ?? ''), status: String(row.status ?? ''), whatsapp_marketing_consent: row.whatsapp_marketing_consent === true, whatsapp_marketing_consent_at: row.whatsapp_marketing_consent_at ? String(row.whatsapp_marketing_consent_at) : null })));
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => { const q = search.trim().toLocaleLowerCase('id-ID'); return contacts.filter(c => !q || `${c.name} ${c.phone} ${c.service}`.toLocaleLowerCase('id-ID').includes(q)); }, [contacts, search]);
  const consented = filtered.filter(c => c.whatsapp_marketing_consent);
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
  function toggleSelected(id: number, checked: boolean) { setSelected(current => checked ? [...new Set([...current, id])] : current.filter(value => value !== id)); }
  async function sendCampaign(event: FormEvent) {
    event.preventDefault(); setBusy('campaign'); setError(''); setNotice('');
    try {
      const result = await post({ action: 'campaign', title, message, leadIds: selected });
      setNotice(result.message); setTitle(''); setMessage(''); setSelected([]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Kampanye gagal dimasukkan ke antrean.'); }
    finally { setBusy(''); }
  }
  return <div className="portal-columns" style={{ alignItems: 'start' }}>
    <section className="portal-card">
      <h2>Kontak dan persetujuan</h2>
      <p>Persetujuan promosi terpisah dari izin menghubungi prospek untuk layanan. Aktifkan hanya setelah pelanggan menyetujui pesan promosi WhatsApp. Pencabutan persetujuan langsung mengecualikan kontak dari kampanye berikutnya.</p>
      <label className="portal-form">Cari kontak<input value={search} maxLength={120} onChange={e => setSearch(e.target.value)} placeholder="Nama, nomor, atau layanan" /></label>
      <p>{filtered.length} kontak ditampilkan, maksimal 200 kontak terbaru. {consented.length} memiliki persetujuan aktif.</p>
      <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Pilih</th><th>Kontak</th><th>Layanan</th><th>Persetujuan promosi</th></tr></thead><tbody>
        {filtered.map(contact => <tr key={contact.id}><td><input aria-label={`Pilih ${contact.name}`} type="checkbox" disabled={!contact.whatsapp_marketing_consent} checked={selected.includes(contact.id)} onChange={e => toggleSelected(contact.id, e.target.checked)} /></td><td><strong>{contact.name}</strong><br /><small>{contact.phone}</small><br /><small>#{contact.id}</small></td><td>{contact.service || 'Belum diisi'}</td><td><label><input type="checkbox" checked={contact.whatsapp_marketing_consent} disabled={Boolean(busy)} onChange={() => void toggleConsent(contact)} /> {contact.whatsapp_marketing_consent ? 'Aktif' : 'Belum ada'}</label><br /><small>{contact.whatsapp_marketing_consent_at ? new Date(contact.whatsapp_marketing_consent_at).toLocaleDateString('id-ID') : 'Belum tercatat'}</small></td></tr>)}
        {!filtered.length && <tr><td colSpan={4}>Kontak tidak ditemukan.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="portal-card">
      <h2>Buat kampanye</h2>
      <p>Pesan hanya masuk antrean untuk kontak terpilih yang masih memiliki persetujuan promosi aktif. Batas 100 penerima per kampanye.</p>
      <form className="portal-form" onSubmit={sendCampaign}>
        <label>Judul internal<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label>Isi pesan<textarea required maxLength={2000} rows={8} value={message} onChange={e => setMessage(e.target.value)} placeholder="Gunakan {{nama}} untuk personalisasi nama penerima." /></label>
        <p>{selected.length} penerima dipilih. Gunakan pesan yang relevan, tidak menyesatkan, dan sesuai persetujuan pelanggan.</p>
        <button className="portal-primary" type="submit" disabled={Boolean(busy) || selected.length === 0}>{busy === 'campaign' ? 'Memasukkan ke antrean…' : 'Jadwalkan pengiriman sekarang'}</button>
      </form>
      {error && <p className="portal-error" role="alert">{error}</p>}{notice && <p className="portal-success" role="status">{notice}</p>}
      <p><small>Pengiriman diproses worker. Status kirim dapat dilihat pada tabel notification_outbox di database. Pesan dengan hasil jaringan ambigu tidak dikirim ulang otomatis untuk mengurangi risiko duplikasi.</small></p>
    </section>
  </div>;
}

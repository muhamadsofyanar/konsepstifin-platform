'use client';
import { useRef, useState, type FormEvent } from 'react';
import { crmGroups, crmLabels, crmType, type CrmGroup } from '@/lib/crm-domain';
import type { StoredLead } from '@/lib/interest-store';

export default function ContactCreate({ onCreated, onClose }: { onCreated: (lead: StoredLead) => void; onClose: () => void }) {
  const [group, setGroup] = useState<CrmGroup>('prospect');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const key = useRef('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!key.current) key.current = crypto.randomUUID();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        ...Object.fromEntries(form), group, idempotencyKey: key.current,
        consentToContact: form.get('consentToContact') === 'on', consentToShare: form.get('consentToShare') === 'on',
      }) });
      const result = await response.json();
      if (!response.ok || !result.lead) throw new Error(result.error || 'Data belum tersimpan.');
      onCreated(result.lead);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Data belum tersimpan.'); }
    finally { setBusy(false); }
  }
  return <form className="crm-create" onSubmit={submit}>
    <h2>Tambah data CRM</h2>
    <fieldset disabled={busy}>
      <div className="crm-form-grid">
        <label>Kelompok<select value={group} onChange={event => setGroup(event.target.value as CrmGroup)}>{crmGroups.map(value => <option key={value} value={value}>{crmLabels[value]}</option>)}</select></label>
        <label>Nama lengkap<input name="name" required minLength={3} maxLength={120} /></label>
        <label>Nomor WhatsApp<input name="phone" type="tel" required maxLength={32} /></label>
        <label>Email<input name="email" type="email" maxLength={160} /></label>
        <label>Domisili<input name="city" required minLength={2} maxLength={100} /></label>
        <label>Layanan / program<input name="service" required minLength={3} maxLength={120} placeholder="Contoh: Tes personal / WSL 1" /></label>
      </div>
      <label>Catatan awal<textarea name="notes" maxLength={600} /></label>
      <label className="crm-consent"><input name="consentToContact" type="checkbox" required />Saya telah memperoleh persetujuan orang ini untuk dihubungi dan dicatat dalam CRM.</label>
      {crmType(group) === 'test_service' && <label className="crm-consent"><input name="consentToShare" type="checkbox" required />Persetujuan berbagi data terbatas kepada promotor pelaksana sudah diperoleh.</label>}
      <p className="lead-note">Pilih Klien hanya untuk layanan yang sudah selesai. Pilih Promotor Jaringan hanya setelah aktivasi terverifikasi; pencatatan ini tidak mengaktifkan ID resmi STIFIn.</p>
      {error && <p role="alert">{error}</p>}
      <div className="crm-actions"><button type="submit">{busy ? 'Menyimpan…' : 'Simpan data baru'}</button><button type="button" onClick={onClose}>Batal</button></div>
    </fieldset>
  </form>;
}

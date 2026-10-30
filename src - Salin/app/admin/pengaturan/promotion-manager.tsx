'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { PromotionSettings } from '@/lib/promotion-store';
const money = (value: number) => `Rp${value.toLocaleString('id-ID')}`;
export default function PromotionManager({ initialSettings, isOwner }: { initialSettings: PromotionSettings; isOwner: boolean }) {
  const router = useRouter(); const [settings, setSettings] = useState(initialSettings), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [newPaidTests, setNewPaidTests] = useState(3), [newFreeTests, setNewFreeTests] = useState(1);
  function addScheme() {
    const key = `family-${newPaidTests}-${newFreeTests}`;
    if (!Number.isSafeInteger(newPaidTests) || !Number.isSafeInteger(newFreeTests) || newPaidTests < 1 || newPaidTests > 1000 || newFreeTests < 1 || newFreeTests > 1000) { setError('Jumlah tes berbayar dan gratis harus 1 sampai 1.000.'); return; }
    if (settings.familySchemes.some(s => s.key === key)) { setError('Skema tersebut sudah ada.'); return; }
    setError(''); setSettings({ ...settings, familySchemes: [...settings.familySchemes, { key, paidTests: newPaidTests, freeTests: newFreeTests, label: `${newPaidTests} tes + ${newFreeTests} gratis` }] });
  }
  function removeScheme(key: string) { setSettings({ ...settings, familySchemes: settings.familySchemes.filter(s => s.key !== key) }); }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/admin/promotions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...settings, familySchemes: settings.familySchemes.map(s => s.key) }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Promo belum tersimpan.');
      setSettings(result.settings); setMessage('Promo pusat berhasil disimpan. Halaman publik memakai konfigurasi baru tanpa redeploy.'); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Promo belum tersimpan.'); }
    finally { setBusy(false); }
  }
  return <section className="portal-card" style={{ marginBottom: 20 }}>
    <div className="portal-heading"><div><span className="portal-eyebrow">PROGRAM DARI PUSAT</span><h2>Promo Family Test & Year-End Workshop</h2><p>Atur periode, skema promo keluarga, dan harga workshop. Harga jual minimal per tes berbayar tidak dapat diturunkan di bawah Rp500.000.</p></div><span className="portal-version">2026</span></div>
    {!isOwner && <p className="portal-error">Hanya pemilik platform yang dapat mengubah ketentuan promo pusat.</p>}
    <form className="portal-form" onSubmit={save}><fieldset disabled={busy || !isOwner}>
      <div className="editor-grid">
        <label>Tanggal mulai<input type="date" required value={settings.startDate} onChange={e => setSettings({ ...settings, startDate: e.target.value })} /></label>
        <label>Tanggal berakhir<input type="date" required value={settings.endDate} onChange={e => setSettings({ ...settings, endDate: e.target.value })} /></label>
      </div>
      <label><input type="checkbox" checked={settings.familyEnabled} onChange={e => setSettings({ ...settings, familyEnabled: e.target.checked })} /> Aktifkan Promo Family Test</label>
      <div className="portal-columns" style={{ marginTop: 8 }}><div><h3>Skema Family Test</h3><p>Jumlah tes berbayar menentukan batas minimum total pembayaran. Tes gratis adalah bonus, bukan tes berbayar.</p>{settings.familySchemes.map(s => <div key={s.key} className="promo-scheme-row"><span><b>{s.label}</b><small>Minimum {money(s.paidTests * settings.minimumPaidTestPrice)}</small></span><button type="button" onClick={() => removeScheme(s.key)} aria-label={`Hapus skema ${s.label}`}>Hapus</button></div>)}
          <div className="editor-grid"><label>Tes berbayar<input type="number" min={1} max={1000} value={newPaidTests} onChange={e => setNewPaidTests(Number(e.target.value))} /></label><label>Tes gratis<input type="number" min={1} max={1000} value={newFreeTests} onChange={e => setNewFreeTests(Number(e.target.value))} /></label></div><button type="button" onClick={addScheme}>Tambah skema promo</button><label>Harga jual minimal per tes berbayar<input value={money(settings.minimumPaidTestPrice)} readOnly /></label></div>
        <div><label><input type="checkbox" checked={settings.workshopEnabled} onChange={e => setSettings({ ...settings, workshopEnabled: e.target.checked })} /> Aktifkan promo Year-End Workshop</label><h3>Harga workshop selama promo</h3>
          <label>WSL 1 (Rp)<input type="number" min={0} step={50000} required value={settings.workshopPrices.wsl1} onChange={e => setSettings({ ...settings, workshopPrices: { ...settings.workshopPrices, wsl1: Number(e.target.value) } })} /></label>
          <label>WSL 2 (Rp)<input type="number" min={0} step={50000} required value={settings.workshopPrices.wsl2} onChange={e => setSettings({ ...settings, workshopPrices: { ...settings.workshopPrices, wsl2: Number(e.target.value) } })} /></label>
          <label>WST (Rp)<input type="number" min={0} step={50000} required value={settings.workshopPrices.wst} onChange={e => setSettings({ ...settings, workshopPrices: { ...settings.workshopPrices, wst: Number(e.target.value) } })} /></label>
        </div></div>
      {message && <p className="portal-success" role="status">{message}</p>}{error && <p className="portal-error" role="alert">{error}</p>}
      <button className="portal-primary" type="submit">{busy ? 'Menyimpan…' : 'Simpan promo pusat'}</button>
    </fieldset></form>
  </section>;
}

'use client';

import { FormEvent, useState } from 'react';
import { isOfficialSejoliUrl, sejoliLinks, type SejoliLinkKey } from './site-config';

const services = ['Tes STIFIn Personal', 'Paket Tes Keluarga', 'Sekolah & Komunitas', 'Bantuan memilih layanan STIFIn', 'Preview Calon Promotor', 'WSL 1', 'WSL 2', 'Informasi ID & Alat', 'Affiliate Umum', 'Affiliate Promotor Resmi'];
type Region = { code: string; name: string };
type SubmissionResult = {
  reference: string; status: 'ditawarkan' | 'mencari_promotor';
  match: { method: 'manual_region' | 'area' | 'province' | 'none'; promoter: { code: string; name: string; area: string; province: string } | null };
  checkoutUrl: string;
};

export default function PublicInterestAction({
  linkKey, label, service, className = '', checkoutUrl = '', trackLead = false, preserveCampaignParams = false,
  requirePrecheckout = false, provinceCode = '', provinceName = '', regencyCode = '', regencyName = '', navigateToCheckout,
}: {
  linkKey: SejoliLinkKey; label: string; service: string; className?: string; checkoutUrl?: string; trackLead?: boolean;
  preserveCampaignParams?: boolean; requirePrecheckout?: boolean; provinceCode?: string; provinceName?: string;
  regencyCode?: string; regencyName?: string; navigateToCheckout?: (url: string) => void;
}) {
  const [open, setOpen] = useState(false), [startedAt, setStartedAt] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle'), [error, setError] = useState('');
  const [result, setResult] = useState<SubmissionResult | null>(null), [idempotencyKey, setIdempotencyKey] = useState('');
  const [provinces, setProvinces] = useState<Region[]>([]), [regencies, setRegencies] = useState<Region[]>([]);
  const [selectedProvince, setSelectedProvince] = useState(provinceCode), [selectedRegency, setSelectedRegency] = useState(regencyCode);

  function withCampaignParams(target: string) {
    const url = new URL(target);
    if (preserveCampaignParams) new URLSearchParams(window.location.search).forEach((value, key) => {
      if (key.toLowerCase().startsWith('utm_') || key.toLowerCase() === 'fbclid') url.searchParams.set(key, value);
    });
    return url.toString();
  }
  function go(target: string) { (navigateToCheckout ?? ((url) => window.location.assign(url)))(target); }
  async function loadProvinces() {
    if (provinceCode || provinces.length) return;
    try {
      const response = await fetch('/api/wilayah/provinces'); const body = await response.json() as { data?: Region[] };
      if (response.ok) setProvinces(body.data ?? []);
    } catch { setError('Daftar wilayah belum dapat dimuat.'); }
  }
  async function loadRegencies(code: string) {
    setSelectedProvince(code); setSelectedRegency(''); setRegencies([]);
    if (!code) return;
    try {
      const response = await fetch('/api/wilayah/regencies?parent=' + encodeURIComponent(code)); const body = await response.json() as { data?: Region[] };
      if (response.ok) setRegencies(body.data ?? []); else setError('Daftar kabupaten/kota belum dapat dimuat.');
    } catch { setError('Daftar kabupaten/kota belum dapat dimuat.'); }
  }
  function start() {
    const target = checkoutUrl || sejoliLinks[linkKey];
    if (!requirePrecheckout && target && isOfficialSejoliUrl(target)) {
      if (trackLead) window.fbq?.('track', 'Lead', { content_name: service, content_category: 'Promotor STIFIn' });
      window.open(withCampaignParams(target), '_blank', 'noopener,noreferrer'); return;
    }
    setStartedAt(Date.now()); setState('idle'); setError(''); setResult(null);
    setIdempotencyKey(crypto.randomUUID()); setSelectedProvince(provinceCode); setSelectedRegency(regencyCode); setOpen(true);
    if (requirePrecheckout) void loadProvinces();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState('sending'); setError(''); setResult(null);
    const form = new FormData(event.currentTarget);
    const finalProvinceCode = provinceCode || selectedProvince;
    const finalProvinceName = provinceName || provinces.find((item) => item.code === finalProvinceCode)?.name || '';
    const finalRegencyCode = regencyCode || selectedRegency;
    const finalRegencyName = regencyName || regencies.find((item) => item.code === finalRegencyCode)?.name || '';
    try {
      const response = await fetch('/api/interests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: form.get('name'), phone: form.get('phone'), email: form.get('email'), city: requirePrecheckout ? finalRegencyName : form.get('city'), service: form.get('service'),
        productKey: linkKey, notes: form.get('notes'), website: form.get('website'), provinceCode: finalProvinceCode,
        provinceName: finalProvinceName, regencyCode: finalRegencyCode, regencyName: finalRegencyName,
        consentToContact: form.get('consentToContact') === 'on', consentToShare: form.get('consentToShare') === 'on',
        sourcePath: window.location.pathname, startedAt, idempotencyKey, requirePrecheckout,
      }) });
      const body = await response.json() as SubmissionResult & { error?: string };
      if (!response.ok) { setError(body.error || 'Formulir belum dapat disimpan.'); setState('idle'); return; }
      if (!requirePrecheckout) { setState('sent'); return; }
      if (!isOfficialSejoliUrl(body.checkoutUrl)) { setError('Checkout produk belum tersedia.'); setState('idle'); return; }
      const safeResult = { ...body, checkoutUrl: withCampaignParams(body.checkoutUrl) };
      setResult(safeResult); setState('sent');
      if (trackLead) window.fbq?.('track', 'Lead', { content_name: service, content_category: 'Tes STIFIn' });
      window.setTimeout(() => go(safeResult.checkoutUrl), 900);
    } catch { setError('Formulir belum dapat disimpan.'); setState('idle'); }
  }
  const serviceOptions = services.includes(service) ? services : [service, ...services];
  return <>
    <button className={className} type="button" onClick={start}>{label}</button>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><div className="modal interest-modal" role="dialog" aria-modal="true" aria-labelledby="interest-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" type="button" aria-label="Tutup formulir" onClick={() => setOpen(false)}>×</button>
      {state === 'sent' ? result ? <div className="interest-success"><span>✓</span><h2 id="interest-title">Data tersimpan.</h2><p className="interest-reference">Referensi: <b>{result.reference}</b></p>
        {result.match.promoter ? <div className="promoter-result"><small>KANDIDAT PROMOTOR BERDASARKAN WILAYAH</small><h3>{result.match.promoter.name}</h3><p>{[result.match.promoter.area, result.match.promoter.province].filter(Boolean).join(', ')}</p><span>Jadwal dikonfirmasi setelah pembayaran.</span></div>
          : <p className="promoter-fallback">Belum ada kandidat otomatis untuk wilayah ini. Checkout tetap tersedia dan tim akan mengatur promotor setelah order.</p>}
        <a className="public-cta big checkout-link" href={result.checkoutUrl}>Lanjut ke pembayaran →</a></div> : <div className="interest-success"><span>✓</span><h2 id="interest-title">Permintaan sudah tersimpan.</h2><p>Tim dapat melihat data Anda dan akan menindaklanjuti pilihan layanan ini.</p><button className="public-cta" type="button" onClick={() => setOpen(false)}>Selesai</button></div> : <><div className="modal-head"><span>{requirePrecheckout ? 'PRA-CHECKOUT TES STIFIn' : 'FORMULIR MINAT'}</span><h2 id="interest-title">{requirePrecheckout ? 'Pilih wilayah sebelum membayar.' : 'Mulai dari kebutuhan Anda.'}</h2><p>{requirePrecheckout ? 'Data disimpan agar tim dapat menghubungkan order dengan kandidat promotor berdasarkan wilayah. Jadwal tetap dikonfirmasi setelah pembayaran.' : 'Isi data singkat agar tim dapat membantu memilih layanan, kota, jadwal, atau tahapan yang sesuai.'}</p></div>
        <form onSubmit={submit}><label>Nama lengkap<input name="name" required minLength={3} placeholder="Nama Anda" /></label>
          {requirePrecheckout ? <><div className="form-row"><label>Nomor WhatsApp<input name="phone" required inputMode="tel" placeholder="08xx xxxx xxxx" /></label><label>Email<input name="email" type="email" required placeholder="nama@email.com" /></label></div>
          {provinceCode ? <div className="selected-region"><b>Wilayah layanan</b><span>{regencyName}, {provinceName}</span></div> : <div className="form-row region-fields"><label>Provinsi<select aria-label="Provinsi" required value={selectedProvince} onChange={(event) => void loadRegencies(event.target.value)}><option value="">Pilih provinsi</option>{provinces.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label><label>Kabupaten/Kota<select aria-label="Kabupaten/Kota" required disabled={!selectedProvince} value={selectedRegency} onChange={(event) => setSelectedRegency(event.target.value)}><option value="">Pilih kabupaten/kota</option>{regencies.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label></div>}</> : <div className="form-row"><label>Nomor WhatsApp<input name="phone" required inputMode="tel" placeholder="08xx xxxx xxxx" /></label><label>Kota/domisili<input name="city" required placeholder="Contoh: Bandung" /></label></div>}
          <label>Pilihan layanan<select name="service" defaultValue={service}>{serviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Jadwal atau kebutuhan tambahan<textarea name="notes" rows={3} placeholder="Opsional" /></label>
          <label className="interest-consent"><input type="checkbox" name="consentToContact" required /> Saya setuju {requirePrecheckout ? 'WhatsApp dan email' : 'nomor WhatsApp'} digunakan tim untuk menindaklanjuti permintaan.</label>
          <label className="interest-consent"><input type="checkbox" name="consentToShare" required /> Saya setuju data kontak dibagikan secara terbatas kepada promotor yang ditugaskan.</label>
          <label className="interest-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <div className="privacy-note">Jangan kirim sidik jari, kata sandi, dokumen identitas, atau informasi rahasia melalui formulir ini.</div>
          {error && <p className="interest-error" role="alert">{error}</p>}
          <button className="public-cta big" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Menyimpan…' : requirePrecheckout ? 'Cari promotor & lanjut bayar' : 'Kirim permintaan →'}</button>
        </form></>}
    </div></div>}
  </>;
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { isOfficialSejoliUrl, sejoliLinks, type SejoliLinkKey } from './site-config';

const services = [
  'Tes STIFIn Personal', 'Paket Tes Keluarga', 'Sekolah & Komunitas',
  'Bantuan memilih layanan STIFIn',
  'Preview Calon Promotor', 'WSL 1', 'WSL 2', 'Informasi ID & Alat',
  'Affiliate Umum', 'Affiliate Promotor Resmi',
];

type WilayahOption = { code: string; name: string };

export default function PublicInterestAction({
  linkKey,
  label,
  service,
  className = '',
  checkoutUrl = '',
  trackLead = false,
  preserveCampaignParams = false,
  defaultProvinceCode,
  defaultProvinceName,
  defaultRegencyCode,
  defaultRegencyName,
}: {
  linkKey: SejoliLinkKey;
  label: string;
  service: string;
  className?: string;
  checkoutUrl?: string;
  trackLead?: boolean;
  preserveCampaignParams?: boolean;
  defaultProvinceCode?: string;
  defaultProvinceName?: string;
  defaultRegencyCode?: string;
  defaultRegencyName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const [provinces, setProvinces] = useState<WilayahOption[]>([]);
  const [regencies, setRegencies] = useState<WilayahOption[]>([]);
  const [provinceCode, setProvinceCode] = useState(defaultProvinceCode || '');
  const [regencyCode, setRegencyCode] = useState(defaultRegencyCode || '');
  const [provinceName, setProvinceName] = useState(defaultProvinceName || '');
  const [regencyName, setRegencyName] = useState(defaultRegencyName || '');
  const [waConsent, setWaConsent] = useState(false);
  const [wilayahError, setWilayahError] = useState('');
  const [loadingWilayah, setLoadingWilayah] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoadingWilayah(true);
      try {
        const res = await fetch('/api/wilayah/provinces');
        const json = await res.json() as { data?: WilayahOption[] };
        if (!cancelled) setProvinces(json.data || []);
      } finally {
        if (!cancelled) setLoadingWilayah(false);
      }
    }
    if (!provinces.length) load();
    return () => { cancelled = true; };
  }, [open, provinces.length]);

  useEffect(() => {
    if (!provinceCode) {
      setRegencies([]); setRegencyCode(''); setRegencyName('');
      return;
    }
    const prov = provinces.find((p) => p.code === provinceCode);
    if (prov) setProvinceName(prov.name);
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/wilayah/regencies?parentCode=${encodeURIComponent(provinceCode)}`);
        const json = await res.json() as { data?: WilayahOption[] };
        if (!cancelled) setRegencies(json.data || []);
      } catch {
        if (!cancelled) setRegencies([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [provinceCode, provinces]);

  useEffect(() => {
    if (!regencyCode) { setRegencyName(''); return; }
    const reg = regencies.find((r) => r.code === regencyCode);
    if (reg) setRegencyName(reg.name);
  }, [regencyCode, regencies]);

  function start() {
    const target = checkoutUrl || sejoliLinks[linkKey];
    if (target && isOfficialSejoliUrl(target)) {
      const checkoutTarget = new URL(target);
      if (preserveCampaignParams) {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.forEach((value, key) => {
          if (key.toLowerCase().startsWith('utm_') || key.toLowerCase() === 'fbclid') {
            checkoutTarget.searchParams.set(key, value);
          }
        });
      }
      if (trackLead) {
        window.fbq?.('track', 'Lead', {
          content_name: service,
          content_category: 'Promotor STIFIn',
        });
      }
      window.open(checkoutTarget.toString(), '_blank', 'noopener,noreferrer');
      return;
    }
    setStartedAt(Date.now());
    setState('idle');
    setError('');
    setWilayahError('');
    if (defaultProvinceCode) setProvinceCode(defaultProvinceCode);
    if (defaultProvinceName) setProvinceName(defaultProvinceName);
    if (defaultRegencyCode) setRegencyCode(defaultRegencyCode);
    if (defaultRegencyName) setRegencyName(defaultRegencyName);
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setWilayahError('');

    if (!provinceCode && !regencyCode) {
      const manualCity = new FormData(event.currentTarget).get('city');
      if (!String(manualCity || '').trim()) {
        setWilayahError('Pilih provinsi dan kabupaten/kota, atau isi domisili secara manual.');
        return;
      }
    }
    if (!waConsent) {
      setError('Persetujuan penggunaan WhatsApp wajib untuk tindak lanjut.');
      return;
    }

    setState('sending');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        phone: form.get('phone'),
        city: form.get('city'),
        service: form.get('service'),
        notes: form.get('notes'),
        website: form.get('website'),
        sourcePath: window.location.pathname,
        startedAt,
        provinceCode,
        provinceName,
        regencyCode,
        regencyName,
        waConsent,
        waConsentAt: new Date().toISOString(),
      }),
    });
    const result = await response.json() as { error?: string; status?: string };
    if (!response.ok) {
      setError(result.error || 'Formulir belum dapat disimpan.');
      setState('idle');
      return;
    }
    setState('sent');
    if (result.status === 'mencari_promotor') {
      setTimeout(() => {
        const p = document.getElementById('post-submit-note');
        if (p) p.style.display = 'block';
      }, 10);
    }
  }

  const serviceOptions = services.includes(service) ? services : [service, ...services];

  return <>
    <button className={className} type="button" onClick={start}>{label}</button>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="modal interest-modal" role="dialog" aria-modal="true" aria-labelledby="interest-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Tutup formulir" onClick={() => setOpen(false)}>×</button>
        {state === 'sent' ? <div className="interest-success">
          <span>✓</span><h2 id="interest-title">Permintaan sudah tersimpan.</h2>
          <p>Tim dapat melihat data Anda dan akan menindaklanjuti pilihan layanan ini. Jangan mengirim sidik jari, kata sandi, atau data rahasia melalui formulir.</p>
          <p id="post-submit-note" style={{ display: 'none' }} className="privacy-note"><b>Catatan:</b> Saat ini belum ada promotor aktif yang terdata di wilayah Anda. Tim Konsep STIFIn akan membantu mencari jalur layanan dan menghubungi Anda kembali.</p>
          <button className="public-cta" type="button" onClick={() => setOpen(false)}>Selesai</button>
        </div> : <>
          <div className="modal-head"><span>FORMULIR MINAT</span><h2 id="interest-title">Mulai dari kebutuhan &amp; wilayah Anda.</h2><p>Pilih wilayah domisili agar tim dapat mencocokkan dengan promotor terdekat. Jika wilayah Anda belum memiliki promotor aktif, tim akan membantu mencari jalur layanan melalui koordinasi nasional.</p></div>
          <form onSubmit={submit}>
            <label>Nama lengkap<input name="name" required minLength={3} placeholder="Nama Anda" /></label>
            <label>Nomor WhatsApp<input name="phone" required inputMode="tel" placeholder="08xx xxxx xxxx" /></label>

            <div className="form-row wilayah-row">
              <label>Provinsi
                <select
                  name="province"
                  value={provinceCode}
                  onChange={(e) => setProvinceCode(e.target.value)}
                  disabled={loadingWilayah}
                >
                  <option value="">{loadingWilayah ? 'Memuat…' : 'Pilih provinsi'}</option>
                  {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </label>
              <label>Kabupaten/Kota
                <select
                  name="regency"
                  value={regencyCode}
                  onChange={(e) => setRegencyCode(e.target.value)}
                  disabled={!provinceCode}
                >
                  <option value="">{provinceCode ? 'Pilih kabupaten/kota' : 'Pilih provinsi dulu'}</option>
                  {regencies.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              </label>
            </div>

            <label style={{ opacity: 0.85 }}>Atau isi domisili manual (jika memilih wilayah belum memungkinkan)<input name="city" placeholder="Contoh: Kota Bandung, Jawa Barat" /></label>
            {wilayahError && <p className="interest-error" role="alert">{wilayahError}</p>}

            <div className="form-row"><label>Pilihan layanan<select name="service" defaultValue={service}>{serviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label></div>
            <label>Jadwal atau kebutuhan tambahan<textarea name="notes" rows={3} placeholder="Contoh: Sabtu pagi / ingin informasi WSL 1 / butuh pendampingan anak" /></label>

            <label className="consent-checkbox">
              <input
                type="checkbox"
                name="waConsent"
                checked={waConsent}
                onChange={(e) => setWaConsent(e.target.checked)}
                required
              />
              <span>Saya menyetujui nomor WhatsApp ini digunakan oleh Konsep STIFIn untuk menindaklanjuti permintaan layanan dan hanya dibagikan kepada promotor yang secara resmi ditugaskan. Saya mengerti tidak akan diminta mengirim sidik jari, dokumen identitas, atau kata sandi melalui formulir ini.</span>
            </label>

            <label className="interest-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <div className="privacy-note">Tes STIFIn dilakukan offline bersama promotor. Jangan kirim data sidik jari, kata sandi, dokumen identitas, atau informasi rahasia melalui formulir ini.</div>
            {error && <p className="interest-error" role="alert">{error}</p>}
            <button className="public-cta big" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Menyimpan…' : 'Kirim permintaan →'}</button>
          </form>
        </>}
      </div>
    </div>}
  </>;
}

'use client';

import { FormEvent, useState } from 'react';
import type { LeadType } from '@/lib/interest-store';
import { isOfficialSejoliUrl, sejoliLinks, type SejoliLinkKey } from './site-config';

const testServices = [
  { key: 'tesPersonal', label: 'Tes STIFIn Personal' },
  { key: 'tesPasangan', label: 'Tes STIFIn Pasangan' },
  { key: 'paketKeluarga', label: 'Paket Tes Keluarga' },
  { key: 'paketKeluargaPlus', label: 'Paket Tes Keluarga Plus' },
  { key: 'sekolahKomunitas', label: 'Sekolah & Komunitas' },
  { key: 'bantuanTes', label: 'Bantuan memilih layanan STIFIn' },
] as const;

const promoterServices = [
  { key: 'previewPromotor', label: 'Preview Calon Promotor' },
  { key: 'wsl1', label: 'WSL 1' },
  { key: 'wsl2', label: 'WSL 2' },
  { key: 'idDanAlat', label: 'Informasi ID & Alat' },
  { key: 'paketPromotor', label: 'Paket Promotor' },
  { key: 'bantuanPromotor', label: 'Bantuan memahami tahapan promotor' },
] as const;

type SubmissionResult = {
  error?: string;
  reference?: string;
  status?: string;
  match?: {
    method?: string;
    promoter?: { code: string; name: string; branchCode: string; area: string; province: string } | null;
  } | null;
  checkoutUrl?: string;
};

function inferredLeadType(linkKey: SejoliLinkKey): LeadType {
  return ['previewPromotor', 'wsl1', 'wsl2', 'idDanAlat', 'paketPromotor'].includes(linkKey)
    ? 'promoter_candidate'
    : 'test_service';
}

function defaultProductKey(leadType: LeadType, linkKey: SejoliLinkKey, service: string) {
  const options = leadType === 'test_service' ? testServices : promoterServices;
  const matchingLabel = options.find((item) => item.label === service);
  const matchingKey = options.find((item) => item.key === linkKey);
  return matchingLabel?.key ?? matchingKey?.key ?? options[options.length - 1].key;
}

function campaignAttribution() {
  const params = new URLSearchParams(window.location.search);
  const value = (key: string) => (params.get(key) || '').trim().slice(0, 120);
  return {
    utmSource: value('utm_source'),
    utmMedium: value('utm_medium'),
    utmCampaign: value('utm_campaign'),
    utmContent: value('utm_content'),
    utmTerm: value('utm_term'),
    referrer: document.referrer.slice(0, 240),
  };
}

export default function PublicInterestAction({
  linkKey,
  label,
  service,
  leadType,
  className = '',
  checkoutUrl = '',
  trackLead = false,
  preserveCampaignParams = false,
  requirePrecheckout = false,
  captureLead = false,
  navigateToCheckout,
  provinceCode = '',
  provinceName = '',
  regencyCode = '',
  regencyName = '',
}: {
  linkKey: SejoliLinkKey;
  label: string;
  service: string;
  leadType?: LeadType;
  className?: string;
  checkoutUrl?: string;
  trackLead?: boolean;
  preserveCampaignParams?: boolean;
  requirePrecheckout?: boolean;
  captureLead?: boolean;
  navigateToCheckout?: (url: string) => void;
  provinceCode?: string;
  provinceName?: string;
  regencyCode?: string;
  regencyName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const effectiveLeadType = leadType ?? inferredLeadType(linkKey);
  const selectedDefault = defaultProductKey(effectiveLeadType, linkKey, service);

  function navigate(url: string) {
    if (navigateToCheckout) navigateToCheckout(url);
    else window.location.assign(url);
  }

  function start() {
    const target = checkoutUrl || sejoliLinks[linkKey];
    const shouldCapture = Boolean(leadType) || captureLead || requirePrecheckout || !target;
    if (!shouldCapture && target && isOfficialSejoliUrl(target)) {
      const checkoutTarget = new URL(target);
      if (preserveCampaignParams) {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.forEach((value, key) => {
          if (key.toLowerCase().startsWith('utm_') || key.toLowerCase() === 'fbclid') {
            checkoutTarget.searchParams.set(key, value.slice(0, 120));
          }
        });
      }
      if (trackLead) window.fbq?.('track', 'Lead', { content_name: service, content_category: 'Konsep STIFIn' });
      navigate(checkoutTarget.toString());
      return;
    }
    setStartedAt(Date.now());
    setIdempotencyKey(crypto.randomUUID());
    setState('idle');
    setError('');
    setResult(null);
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setError('');
    const form = new FormData(event.currentTarget);
    const productKey = String(form.get('productKey') || selectedDefault);
    const options = effectiveLeadType === 'test_service' ? testServices : promoterServices;
    const selectedService = options.find((item) => item.key === productKey)?.label || service;
    const response = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadType: effectiveLeadType,
        productKey,
        name: form.get('name'),
        phone: form.get('phone'),
        email: form.get('email'),
        city: form.get('city'),
        service: selectedService,
        notes: form.get('notes'),
        website: form.get('website'),
        provinceCode,
        provinceName,
        regencyCode,
        regencyName,
        consentToContact: form.get('consentToContact') === 'on',
        consentToShare: effectiveLeadType === 'test_service' && form.get('consentToShare') === 'on',
        sourcePath: window.location.pathname,
        startedAt,
        idempotencyKey,
        ...campaignAttribution(),
      }),
    });
    const responseResult = await response.json() as SubmissionResult;
    if (!response.ok) {
      setError(responseResult.error || 'Formulir belum dapat disimpan.');
      setState('idle');
      return;
    }
    if (responseResult.checkoutUrl && !isOfficialSejoliUrl(responseResult.checkoutUrl)) {
      setError('URL pembayaran tidak valid. Hubungi tim layanan.');
      setState('idle');
      return;
    }
    if (trackLead) window.fbq?.('track', 'Lead', { content_name: selectedService, content_category: effectiveLeadType });
    setResult(responseResult);
    setState('sent');
  }

  const serviceOptions = effectiveLeadType === 'test_service' ? testServices : promoterServices;
  const safeCheckout = effectiveLeadType === 'test_service' && result?.checkoutUrl && isOfficialSejoliUrl(result.checkoutUrl)
    ? result.checkoutUrl
    : '';

  return <>
    <button className={className} type="button" onClick={start}>{label}</button>
    {open ? <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="modal interest-modal" role="dialog" aria-modal="true" aria-labelledby="interest-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Tutup formulir" onClick={() => setOpen(false)}>×</button>
        {state === 'sent' ? <div className="interest-success">
          <span>✓</span>
          <h2 id="interest-title">Permintaan sudah tersimpan.</h2>
          <p>Referensi <b>{result?.reference}</b>. Tim akan menindaklanjuti sesuai jalur yang Anda pilih.</p>
          {effectiveLeadType === 'test_service' && result?.match?.promoter ? <article className="interest-match-card">
            <small>PROMOTOR YANG DICOCOKKAN</small><b>{result.match.promoter.name}</b><span>{result.match.promoter.area}, {result.match.promoter.province}</span>
          </article> : null}
          {safeCheckout ? <a className="public-cta big" href={safeCheckout}>Lanjut ke pembayaran →</a> : null}
          <button className="interest-secondary-action" type="button" onClick={() => setOpen(false)}>Selesai</button>
        </div> : <>
          <div className="modal-head">
            <span>{effectiveLeadType === 'test_service' ? 'LAYANAN TES STIFIn' : 'JALUR CALON PROMOTOR'}</span>
            <h2 id="interest-title">Mulai dari kebutuhan Anda.</h2>
            <p>{effectiveLeadType === 'test_service' ? 'Data ini dipakai untuk mencari promotor, mengonfirmasi jadwal, lalu mengarahkan Anda ke checkout resmi.' : 'Data ini masuk ke antrean konsultasi calon promotor dan tidak diarahkan ke checkout.'}</p>
          </div>
          <form onSubmit={submit}>
            <label>Nama lengkap<input name="name" required minLength={3} placeholder="Nama Anda" /></label>
            <div className="form-row"><label>Nomor WhatsApp<input name="phone" required inputMode="tel" placeholder="08xx xxxx xxxx" /></label><label>Email<input name="email" type="email" placeholder="nama@email.com" /></label></div>
            <div className="form-row"><label>Kota/domisili<input name="city" required defaultValue={regencyName} placeholder="Contoh: Bandung" /></label><label>Pilihan layanan<select name="productKey" defaultValue={selectedDefault}>{serviceOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label></div>
            <label>Jadwal atau kebutuhan tambahan<textarea name="notes" rows={3} placeholder={effectiveLeadType === 'test_service' ? 'Contoh: Sabtu pagi' : 'Contoh: ingin memahami tahapan WSL'} /></label>
            <label className="interest-consent"><input type="checkbox" name="consentToContact" required /> Saya setuju nomor WhatsApp digunakan tim untuk menindaklanjuti permintaan ini.</label>
            {effectiveLeadType === 'test_service' ? <label className="interest-consent"><input type="checkbox" name="consentToShare" required /> Saya setuju nomor WhatsApp dibagikan kepada promotor yang ditugaskan untuk melayani permintaan ini.</label> : null}
            <label className="interest-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <div className="privacy-note">Jangan kirim data sidik jari, kata sandi, dokumen identitas, atau informasi rahasia melalui formulir ini.</div>
            {error ? <p className="interest-error" role="alert">{error}</p> : null}
            <button className="public-cta big" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Menyimpan…' : effectiveLeadType === 'test_service' ? 'Cari promotor & lanjut bayar' : 'Kirim permintaan →'}</button>
          </form>
        </>}
      </div>
    </div> : null}
  </>;
}

'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import type { LeadType } from '@/lib/interest-store';
import { type ProductKey } from './site-config';

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
  { key: 'wst', label: 'WST' },
  { key: 'idDanAlat', label: 'Informasi ID & Alat' },
  { key: 'paketPromotor', label: 'Paket Promotor' },
  { key: 'bantuanPromotor', label: 'Bantuan memahami tahapan promotor' },
] as const;

type AccountInfo = {
  email: string;
  displayName: string | null;
  roles: string[];
  promoterCode: string | null;
  accountType: 'admin' | 'branch_manager' | 'promoter' | 'affiliate' | 'instructor' | 'member';
  accountLabel: string;
  isBranchManager: boolean;
  registered: true;
};

type SubmissionResult = {
  error?: string;
  reference?: string;
  referralRecorded?: boolean;
  referralAlias?: string;
  status?: string;
  whatsappContact?: string;
  match?: {
    method?: string;
    promoter?: { code: string; name: string; branchCode: string; area: string; province: string } | null;
  } | null;
};

function inferredLeadType(linkKey: ProductKey): LeadType {
  return ['previewPromotor', 'wsl1', 'wsl2', 'wst', 'idDanAlat', 'paketPromotor'].includes(linkKey)
    ? 'promoter_candidate'
    : 'test_service';
}

function defaultProductKey(leadType: LeadType, linkKey: ProductKey, service: string) {
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
  trackLead = false,
  provinceCode = '',
  provinceName = '',
  regencyCode = '',
  regencyName = '',
  familyPromo,
}: {
  linkKey: ProductKey;
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
  familyPromo?: { minimumPaidTestPrice: number; schemes: Array<{ key: string; paidTests: number; freeTests: number; label: string }> };
}) {
  const [open, setOpen] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [accountCheckUnavailable, setAccountCheckUnavailable] = useState(false);
  const [requestMode, setRequestMode] = useState<'self' | 'client'>('self');
  const [startedAt, setStartedAt] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const effectiveLeadType = leadType ?? inferredLeadType(linkKey);
  const selectedDefault = defaultProductKey(effectiveLeadType, linkKey, service);
  const [selectedProductKey, setSelectedProductKey] = useState<string>(selectedDefault);
  const [selectedPromoKey, setSelectedPromoKey] = useState(familyPromo?.schemes[0]?.key || '');
  const canSubmitForClient = accountInfo?.accountType === 'promoter' || accountInfo?.accountType === 'branch_manager' || accountInfo?.accountType === 'affiliate';

  async function start() {
    if (checkingAccount) return;
    setCheckingAccount(true);
    let detectedAccount: AccountInfo | null = null;
    let checkUnavailable = false;
    try {
      const response = await fetch('/api/account/me', { cache: 'no-store' });
      if (response.ok) detectedAccount = await response.json() as AccountInfo;
      else if (response.status !== 401) checkUnavailable = true;
    } catch {
      checkUnavailable = true;
    }
    setAccountInfo(detectedAccount);
    setAccountCheckUnavailable(checkUnavailable);
    setRequestMode('self');
    setStartedAt(Date.now());
    setIdempotencyKey(crypto.randomUUID());
    setState('idle');
    setError('');
    setResult(null);
    setSelectedProductKey(selectedDefault);
    setSelectedPromoKey(familyPromo?.schemes[0]?.key || '');
    setOpen(true);
    setCheckingAccount(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setError('');
    const form = new FormData(event.currentTarget);
    const productKey = String(form.get('productKey') || selectedProductKey || selectedDefault);
    const options = effectiveLeadType === 'test_service' ? testServices : promoterServices;
    const selectedService = options.find((item) => item.key === productKey)?.label || service;
    const extraNotes = String(form.get('notes') || '').trim();
    const notes = [
      requestMode === 'client' ? 'PENGAJUAN OLEH PROMOTOR/AFILIATE ATAS NAMA CALON KLIEN.' : '',
      extraNotes,
    ].filter(Boolean).join(' ').slice(0, 600);
    try {
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
          notes,
          familyPromoKey: form.get('familyPromoKey'),
          website: form.get('website'),
          provinceCode,
          provinceName,
          regencyCode,
          regencyName,
          consentToContact: form.get('consentToContact') === 'on',
          consentToShare: form.get('consentToShare') === 'on',
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
      if (!responseResult.reference || !/^KSF-[0-9]+$/.test(responseResult.reference)) {
        setError('Permintaan belum mendapat nomor referensi. Muat ulang halaman dan coba kembali.');
        setState('idle');
        return;
      }
      if (trackLead) window.fbq?.('track', 'Lead', { content_name: selectedService, content_category: effectiveLeadType });
      setResult(responseResult);
      setState('sent');
    } catch {
      setError('Permintaan belum dapat disimpan. Periksa koneksi dan coba kembali.');
      setState('idle');
    }
  }

  const serviceOptions = effectiveLeadType === 'test_service' ? testServices : promoterServices;
  const showServicePicker = selectedDefault === 'bantuanTes' || selectedDefault === 'bantuanPromotor';
  const selectedPromo = familyPromo?.schemes.find(item => item.key === selectedPromoKey);
  const selectedIsFamily = selectedProductKey === 'paketKeluarga' || selectedProductKey === 'paketKeluargaPlus';
  const roleMessage = accountInfo?.accountType === 'branch_manager'
    ? 'Akun kepala cabang terdeteksi. Anda dapat mengajukan untuk diri sendiri atau membantu mencatat kebutuhan calon klien.'
    : accountInfo?.accountType === 'promoter'
      ? 'Akun promotor terdeteksi. Anda dapat mengajukan untuk diri sendiri atau mencatat kebutuhan calon klien dengan persetujuan mereka.'
      : accountInfo?.accountType === 'affiliate'
        ? 'Akun affiliate terdeteksi. Pilih apakah permintaan untuk diri sendiri atau calon klien yang telah memberi persetujuan.'
        : accountInfo?.accountType === 'admin'
          ? 'Akun administrator terdeteksi. Formulir ini tetap mencatat permintaan layanan melalui jalur publik.'
          : accountInfo?.accountType === 'instructor'
            ? 'Akun pengajar terdeteksi. Email akun sudah disiapkan untuk membantu tindak lanjut.'
            : 'Akun peserta terdeteksi. Email sudah disiapkan; nama dan WhatsApp tetap diminta karena profil akun peserta belum menyimpan data kontak tersebut.';

  return <>
    <button className={className} type="button" onClick={start} disabled={checkingAccount}>
      {checkingAccount ? 'Memeriksa akun…' : label}
    </button>
    {open ? <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="modal interest-modal" role="dialog" aria-modal="true" aria-labelledby="interest-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Tutup formulir" onClick={() => setOpen(false)}>×</button>
        {state === 'sent' ? <div className="interest-success">
          <span>✓</span>
          <h2 id="interest-title">Permintaan sudah tersimpan.</h2>
          <p>Nomor referensi <b>{result?.reference}</b>. Simpan nomor ini untuk tindak lanjut. Tim akan mengonfirmasi kebutuhan, harga, jadwal, dan instruksi pembayaran. Pengiriman formulir belum berarti pembayaran lunas.</p>
          {result?.whatsappContact ? <div className="interest-whatsapp-next"><b>Agar instruksi bisa dikirim melalui WhatsApp</b><p>Mulai chat dengan nomor resmi KonsepSTIFIn terlebih dahulu. Tekan tombol di bawah, lalu kirim pesan yang sudah disiapkan. Setelah chat masuk, instruksi layanan dapat dikirim dalam jendela percakapan WhatsApp.</p><a className="public-cta" href={`https://wa.me/${result.whatsappContact}?text=${encodeURIComponent(`Assalamu'alaikum, saya sudah mengajukan permintaan ${result.reference}. Mohon instruksi selanjutnya.`)}`} target="_blank" rel="noopener noreferrer">Mulai chat WhatsApp ↗</a></div> : <p className="interest-referral-status">Untuk menerima instruksi WhatsApp, hubungi nomor resmi yang tercantum di halaman Kontak dan kirim nomor referensi ini terlebih dahulu.</p>}
          <p className="interest-referral-status">{result?.referralRecorded ? `Asal referral tercatat: /r/${result.referralAlias}. Pengajuan dapat diperiksa di Aktivitas referral mitra.` : 'Jika Anda datang melalui undangan mitra, asal referral akan mengikuti data atribusi yang berhasil diverifikasi sistem.'}</p>
          {effectiveLeadType === 'test_service' && result?.match?.promoter ? <article className="interest-match-card">
            <small>PROMOTOR YANG DICOCOKKAN</small><b>{result.match.promoter.name}</b><span>{result.match.promoter.area}, {result.match.promoter.province}</span>
          </article> : null}
          <button className="interest-secondary-action" type="button" onClick={() => setOpen(false)}>Selesai</button>
        </div> : <>
          <div className="modal-head">
            <span>{effectiveLeadType === 'test_service' ? 'PERMINTAAN LAYANAN STIFIN' : 'JALUR CALON PROMOTOR'}</span>
            <h2 id="interest-title">{requestMode === 'client' ? 'Catat kebutuhan calon klien.' : 'Mulai dari kebutuhan Anda.'}</h2>
            <p>{effectiveLeadType === 'test_service' ? 'Isi data inti saja. Tim akan mengonfirmasi lokasi, jadwal, biaya, dan langkah berikutnya sebelum pembayaran.' : 'Tim akan menjelaskan tahapan, persyaratan, biaya, dan jadwal sebelum Anda memutuskan.'}</p>
          </div>

          {accountInfo ? <div className="interest-account-context">
            <div><small>STATUS AKUN</small><b>{accountInfo.accountLabel}</b></div>
            <p>{roleMessage}</p>
            <span>{accountInfo.email}</span>
            {canSubmitForClient && effectiveLeadType === 'test_service' ? <fieldset className="interest-request-mode"><legend>Permintaan ini untuk siapa?</legend>
              <label><input type="radio" name="requestMode" checked={requestMode === 'self'} onChange={() => setRequestMode('self')} /> Untuk saya sendiri</label>
              <label><input type="radio" name="requestMode" checked={requestMode === 'client'} onChange={() => setRequestMode('client')} /> Atas nama calon klien</label>
            </fieldset> : null}
          </div> : accountCheckUnavailable ? <div className="interest-account-context guest">
            <b>Status akun belum dapat diperiksa.</b>
            <p>Anda boleh melanjutkan permintaan tanpa akun. Jika sudah terdaftar, coba masuk kembali setelah layanan akun tersedia.</p>
            <div><Link href={'/akun/login?next=' + encodeURIComponent(window.location.pathname)}>Masuk</Link><Link href={'/akun/daftar?next=' + encodeURIComponent(window.location.pathname)}>Daftar akun</Link></div>
          </div> : <div className="interest-account-context guest">
            <b>Anda belum masuk ke akun.</b>
            <p>Anda tetap bisa mengajukan layanan tanpa membuat akun. Jika sudah terdaftar, masuk agar pengalaman akun dan referral lebih mudah dikenali.</p>
            <div><Link href={'/akun/login?next=' + encodeURIComponent(window.location.pathname)}>Masuk</Link><Link href={'/akun/daftar?next=' + encodeURIComponent(window.location.pathname)}>Daftar akun</Link></div>
          </div>}

          <form key={accountInfo?.email || 'guest-form'} onSubmit={submit}>
            <div className="interest-core-fields">
              <label>{requestMode === 'client' ? 'Nama calon klien' : 'Nama lengkap'}<input key={requestMode} name="name" required minLength={3} maxLength={120} defaultValue={requestMode === 'self' ? accountInfo?.displayName || '' : ''} placeholder={requestMode === 'client' ? 'Nama calon klien' : 'Nama Anda'} autoComplete="name" /></label>
              <label>{requestMode === 'client' ? 'WhatsApp calon klien' : 'Nomor WhatsApp'}<input name="phone" required inputMode="tel" maxLength={32} placeholder="08xx xxxx xxxx" autoComplete="tel" /></label>
              <label>{requestMode === 'client' ? 'Kota calon klien' : 'Kota/domisili'}<input name="city" required minLength={2} maxLength={100} defaultValue={regencyName} placeholder="Contoh: Bandung" autoComplete="address-level2" /></label>
            </div>
            {showServicePicker ? <label>Pilih kebutuhan<select name="productKey" value={selectedProductKey} onChange={(event) => { setSelectedProductKey(event.target.value); if (familyPromo?.schemes[0]) setSelectedPromoKey(familyPromo.schemes[0].key); }} required>{serviceOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label> : <><input type="hidden" name="productKey" value={selectedProductKey} /><div className="interest-fixed-service"><small>LAYANAN YANG DIPILIH</small><b>{serviceOptions.find(item => item.key === selectedProductKey)?.label || service}</b><span>Anda tidak perlu memilih layanan lagi.</span></div></>}
            {familyPromo && familyPromo.schemes.length > 0 && effectiveLeadType === 'test_service' && selectedIsFamily ? <div className="interest-promo-choice"><label>Skema Promo Family Test<select name="familyPromoKey" value={selectedPromoKey} onChange={event => setSelectedPromoKey(event.target.value)}>{familyPromo.schemes.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>{selectedPromo && <p>{selectedPromo.paidTests} tes berbayar + {selectedPromo.freeTests} tes gratis, untuk {selectedPromo.paidTests + selectedPromo.freeTests} peserta. Minimum pembayaran <b>Rp{(selectedPromo.paidTests * familyPromo.minimumPaidTestPrice).toLocaleString('id-ID')}</b>.</p>}</div> : null}
            <details className="interest-optional-fields"><summary>Tambah detail opsional</summary><label>Email<input key={accountInfo?.email || 'email-blank'} name="email" type="email" maxLength={160} defaultValue={accountInfo?.email || ''} placeholder={accountInfo ? accountInfo.email : 'nama@email.com'} autoComplete="email" /></label><label>Jadwal atau kebutuhan tambahan (opsional)<textarea name="notes" rows={2} maxLength={500} placeholder="Contoh: Sabtu pagi atau tes untuk 4 anggota keluarga" /></label></details>
            <label className="interest-consent"><input type="checkbox" name="consentToContact" required /> {requestMode === 'client' ? 'Saya telah memperoleh persetujuan calon klien agar nomor WhatsApp-nya digunakan tim untuk menindaklanjuti permintaan.' : 'Saya setuju nomor WhatsApp saya digunakan tim untuk menindaklanjuti permintaan ini.'}</label>
            <label className="interest-consent"><input type="checkbox" name="consentToShare" required={effectiveLeadType === 'test_service'} /> {requestMode === 'client' ? 'Saya telah memperoleh persetujuan calon klien agar kontaknya dibagikan secara terbatas kepada promotor yang ditugaskan.' : effectiveLeadType === 'test_service' ? 'Saya setuju nomor WhatsApp dibagikan hanya kepada promotor yang ditugaskan untuk melayani permintaan ini.' : 'Opsional: Saya setuju data kontak dibagikan kepada mitra pengundang untuk mendampingi pendaftaran ini.'}</label>
            <label className="interest-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <div className="privacy-note">Data digunakan hanya untuk menindaklanjuti permintaan sesuai persetujuan. Harga, jadwal, cakupan layanan, dan instruksi pembayaran dikonfirmasi sebelum transaksi. Jangan kirim data sidik jari, kata sandi, atau dokumen identitas. <Link href="/privasi">Baca kebijakan privasi</Link>.</div>
            {error ? <p className="interest-error" role="alert">{error}</p> : null}
            <button className="public-cta big" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Menyimpan permintaan…' : 'Kirim permintaan →'}</button>
          </form>
        </>}
      </div>
    </div> : null}
  </>;
}

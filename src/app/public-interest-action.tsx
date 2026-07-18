'use client';

import { FormEvent, useState } from 'react';
import { isOfficialSejoliUrl, sejoliLinks, type SejoliLinkKey } from './site-config';

const services = [
  'Tes STIFIn Personal', 'Paket Tes Keluarga', 'Sekolah & Komunitas',
  'Bantuan memilih layanan STIFIn',
  'Preview Calon Promotor', 'WSL 1', 'WSL 2', 'Informasi ID & Alat',
  'Affiliate Umum', 'Affiliate Promotor Resmi',
];

export default function PublicInterestAction({
  linkKey,
  label,
  service,
  className = '',
  checkoutUrl = '',
}: {
  linkKey: SejoliLinkKey;
  label: string;
  service: string;
  className?: string;
  checkoutUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  function start() {
    const target = checkoutUrl || sejoliLinks[linkKey];
    if (target && isOfficialSejoliUrl(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    setStartedAt(Date.now());
    setState('idle');
    setError('');
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'), phone: form.get('phone'), city: form.get('city'),
        service: form.get('service'), notes: form.get('notes'), website: form.get('website'),
        sourcePath: window.location.pathname, startedAt,
      }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setError(result.error || 'Formulir belum dapat disimpan.');
      setState('idle');
      return;
    }
    setState('sent');
  }

  const serviceOptions = services.includes(service) ? services : [service, ...services];

  return <>
    <button className={className} type="button" onClick={start}>{label}</button>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="modal interest-modal" role="dialog" aria-modal="true" aria-labelledby="interest-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Tutup formulir" onClick={() => setOpen(false)}>×</button>
        {state === 'sent' ? <div className="interest-success">
          <span>✓</span><h2 id="interest-title">Permintaan sudah tersimpan.</h2><p>Tim dapat melihat data Anda dan akan menindaklanjuti pilihan layanan ini. Jangan mengirim sidik jari, kata sandi, atau data rahasia melalui formulir.</p><button className="public-cta" type="button" onClick={() => setOpen(false)}>Selesai</button>
        </div> : <>
          <div className="modal-head"><span>FORMULIR MINAT</span><h2 id="interest-title">Mulai dari kebutuhan Anda.</h2><p>Isi data singkat agar tim dapat membantu memilih layanan, kota, jadwal, atau tahapan yang sesuai. Tombol pada kartu produk yang sudah aktif tetap membuka checkout SEJOLI secara langsung.</p></div>
          <form onSubmit={submit}>
            <label>Nama lengkap<input name="name" required minLength={3} placeholder="Nama Anda" /></label>
            <label>Nomor WhatsApp<input name="phone" required inputMode="tel" placeholder="08xx xxxx xxxx" /></label>
            <div className="form-row"><label>Kota/domisili<input name="city" required placeholder="Contoh: Bandung" /></label><label>Pilihan layanan<select name="service" defaultValue={service}>{serviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label></div>
            <label>Jadwal atau kebutuhan tambahan<textarea name="notes" rows={3} placeholder="Contoh: Sabtu pagi / ingin informasi WSL 1" /></label>
            <label className="interest-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <div className="privacy-note">Tes STIFIn dilakukan offline. Jangan kirim data sidik jari, kata sandi, dokumen identitas, atau informasi rahasia melalui formulir ini.</div>
            {error && <p className="interest-error" role="alert">{error}</p>}
            <button className="public-cta big" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Menyimpan…' : 'Kirim permintaan →'}</button>
          </form>
        </>}
      </div>
    </div>}
  </>;
}

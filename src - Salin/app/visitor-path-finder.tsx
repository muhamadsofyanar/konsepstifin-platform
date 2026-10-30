'use client';

import Link from 'next/link';
import { useState } from 'react';

type PathKey = 'personal' | 'family' | 'group' | 'promoter' | 'find' | 'learn';

const paths: Array<{
  key: PathKey;
  number: string;
  label: string;
  title: string;
  description: string;
  href: string;
  action: string;
  next: string;
}> = [
  {
    key: 'personal', number: '01', label: 'Untuk diri sendiri', title: 'Saya ingin memahami diri',
    description: 'Mulai dari layanan personal. Pelajari proses tes, pembahasan hasil, dan cara mengajukan jadwal.',
    href: '/produk/layanan/tesPersonal', action: 'Lihat Tes Personal', next: 'Anda akan melihat informasi layanan sebelum mengirim permintaan.'
  },
  {
    key: 'family', number: '02', label: 'Pasangan & keluarga', title: 'Saya ingin memahami keluarga',
    description: 'Lihat pilihan pasangan dan keluarga, termasuk informasi Family Test jika program promo sedang aktif.',
    href: '/produk/layanan/paketKeluarga', action: 'Lihat layanan keluarga', next: 'Anda dapat mempelajari pilihan paket dan mengajukan kebutuhan keluarga.'
  },
  {
    key: 'group', number: '03', label: 'Sekolah & organisasi', title: 'Saya mewakili kelompok',
    description: 'Untuk sekolah, komunitas, lembaga, atau perusahaan yang membutuhkan layanan bagi beberapa peserta.',
    href: '/produk/layanan/sekolahKomunitas', action: 'Ajukan kebutuhan kelompok', next: 'Siapkan kota, perkiraan peserta, dan kebutuhan utama. Detail peserta dapat menyusul.'
  },
  {
    key: 'find', number: '04', label: 'Cari layanan terdekat', title: 'Saya ingin mencari promotor',
    description: 'Cari informasi promotor dan wilayah layanan sebelum menentukan lokasi dan jadwal tes.',
    href: '/promotor', action: 'Cari promotor', next: 'Cakupan wilayah tidak selalu berarti jadwal tersedia. Konfirmasi sebelum memesan.'
  },
  {
    key: 'promoter', number: '05', label: 'Peluang kemitraan', title: 'Saya ingin menjadi promotor',
    description: 'Pelajari peran, persyaratan, tahapan workshop, dukungan, dan perbedaan promotor dengan affiliate.',
    href: '/jadi-promotor', action: 'Pelajari jalur promotor', next: 'Anda bisa mempelajari tahapan terlebih dahulu tanpa langsung mendaftar.'
  },
  {
    key: 'learn', number: '06', label: 'Belajar dahulu', title: 'Saya ingin memahami STIFIn',
    description: 'Mulai dari artikel dan penjelasan dasar untuk memahami konsep sebelum memilih layanan.',
    href: '/edukasi', action: 'Baca artikel edukasi', next: 'Pilih topik yang paling dekat dengan kebutuhan Anda, lalu lanjutkan saat siap.'
  },
];

export default function VisitorPathFinder() {
  const [selected, setSelected] = useState<PathKey>('personal');
  const current = paths.find((path) => path.key === selected) ?? paths[0];

  function choosePath(key: PathKey) {
    setSelected(key);
    window.fbq?.('trackCustom', 'VisitorPathSelected', { path: key });
  }

  return (
    <section className="visitor-path-finder" aria-labelledby="visitor-path-title">
      <div className="visitor-path-heading">
        <span className="section-kicker">MULAI DARI KEBUTUHAN ANDA</span>
        <h2 id="visitor-path-title">Apa yang ingin Anda lakukan hari ini?</h2>
        <p>Pilih satu tujuan. Kami arahkan ke halaman yang paling relevan, tanpa mengharuskan Anda memahami semua layanan sekaligus.</p>
      </div>
      <div className="visitor-path-layout">
        <div className="visitor-path-options" role="group" aria-label="Pilih kebutuhan utama">
          {paths.map((path) => (
            <button
              className={`visitor-path-option${selected === path.key ? ' is-selected' : ''}`}
              type="button"
              key={path.key}
              onClick={() => choosePath(path.key)}
              aria-pressed={selected === path.key}
            >
              <span className="visitor-path-number">{path.number}</span>
              <span className="visitor-path-label">{path.label}</span>
              <span className="visitor-path-chevron" aria-hidden="true">{selected === path.key ? '✓' : '↗'}</span>
            </button>
          ))}
        </div>
        <article className="visitor-path-result" aria-live="polite" aria-atomic="true" key={current.key}>
          <div className="visitor-path-result-top"><span>JALUR YANG DISARANKAN</span><span className="visitor-path-result-number">{current.number}</span></div>
          <h3>{current.title}</h3>
          <p>{current.description}</p>
          <div className="visitor-path-next"><span aria-hidden="true">✓</span><p>{current.next}</p></div>
          <Link className="public-cta big visitor-path-cta" href={current.href} onClick={() => window.fbq?.('trackCustom', 'VisitorPathCTA', { path: current.key })}>{current.action}<span aria-hidden="true"> →</span></Link>
          <small>Belum perlu membuat akun untuk mulai mempelajari layanan.</small>
        </article>
      </div>
    </section>
  );
}

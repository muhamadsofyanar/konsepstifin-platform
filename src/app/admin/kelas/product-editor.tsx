'use client';
import { useState } from 'react';
import { productSlug } from '@/lib/slug';
import { Form, Input, Notice, type DataRow } from '../../belajar/ui';

export default function ProductEditor({ product: p, lessons, onDone, onCancel }: { product: DataRow | null; lessons: DataRow[]; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(String(p?.title ?? ''));
  const [slug, setSlug] = useState(String(p?.slug ?? ''));
  const [manual, setManual] = useState(Boolean(p));
  const [kind, setKind] = useState(String(p?.kind ?? 'course'));
  const [file, setFile] = useState(String(lessons.find(l => l.kind === 'file')?.file_path ?? ''));
  const [uploading, setUploading] = useState(false), [error, setError] = useState('');
  const service = Boolean(p?.source_product_key);
  const details=(p?.serviceDetails??{}) as DataRow;
  async function upload(selected?: File) {
    if (!selected) return;
    if (selected.size > 20 * 1024 * 1024) { setError('Ukuran file maksimal 20 MB.'); return; }
    setUploading(true); setError('');
    try {
      const body = new FormData(); body.set('file', selected);
      const r = await fetch('/api/learning/upload', { method: 'POST', body });
      const d = await r.json(); if (!r.ok) throw new Error(d.message || 'Unggah gagal.');
      setFile(d.filePath);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unggah gagal.'); }
    finally { setUploading(false); }
  }
  return <Form title={p ? 'Edit produk #' + p.id : 'Tambah produk'} actionName="product.save" disabled={uploading} onDone={onDone} transform={d => ({ ...d, ...(p ? { id: p.id } : {}), slug: manual ? slug : '', price: Number(d.price), accessDays: d.accessDays ? Number(d.accessDays) : null, commissionBps: Math.round(Number(d.commissionPercent) * 100), attributionEnabled: d.attributionEnabled === 'true', ...(kind === 'ebook' && file ? { ebookFilePath: file } : {}) })}>
    <div className="lr-section-title"><p className="lr-muted">{service ? 'Layanan ini terhubung dengan halaman publik, CRM, pesanan, dan komisi.' : 'Sesuaikan jenis produk. Setiap jenis mempunyai cara akses tersendiri.'}</p>{p && <button type="button" className="lr-secondary" onClick={onCancel}>Batal edit</button>}</div>
    <div className="lr-fields">
      <label>Nama produk<input name="title" required maxLength={200} value={title} onChange={e => { setTitle(e.target.value); if (!manual) setSlug(productSlug(e.target.value)); }}/></label>
      <label>Slug otomatis<input name="slug" maxLength={100} placeholder="Dibuat dari nama produk" value={slug} onChange={e => { setManual(Boolean(e.target.value)); setSlug(e.target.value); }}/><small className="lr-muted">{manual ? 'Slug khusus. Kosongkan untuk kembali otomatis.' : 'Server membuat slug unik saat disimpan, termasuk jika nama sama.'}</small></label>
      <label>Jenis<select name="kind" value={kind} disabled={service} onChange={e => setKind(e.target.value)}><option value="course">E-course</option><option value="ebook">Ebook</option><option value="webinar">Webinar</option><option value="consultation">{service ? 'Layanan tes / promotor' : 'Konsultasi'}</option><option value="bundle">Bundel (draft saja)</option></select>{service && <input type="hidden" name="kind" value="consultation"/>}</label>
      <label>Status<select name="state" defaultValue={String(p?.state ?? 'draft')}><option value="draft">Draf</option><option value="published">Terbit</option><option value="archived">Arsip</option></select></label>
      <Input name="price" label="Harga Rupiah (0 untuk gratis / penawaran layanan)" type="number" defaultValue={Number(p?.price ?? 0)}/>
      <Input name="accessDays" label="Masa akses hari (kosong = tanpa batas)" type="number" required={false} defaultValue={String(p?.access_days ?? '')}/>
    </div>
    <label>Deskripsi<textarea name="description" defaultValue={String(p?.description ?? '')} maxLength={20000}/></label>
    {service && <><div className="lr-fields"><Input name="eyebrow" label="Label layanan" defaultValue={String(details.eyebrow??'')}/><Input name="priceNote" label="Catatan harga / jumlah peserta" defaultValue={String(details.priceNote??p?.price_note??'')} required={false} maxLength={500}/></div><label>Manfaat layanan (satu per baris)<textarea name="featuresText" maxLength={20000} defaultValue={Array.isArray(details.features)?details.features.join('\n'):''}/></label><label>Bonus (satu per baris)<textarea name="bonusesText" maxLength={20000} defaultValue={Array.isArray(details.bonuses)?details.bonuses.join('\n'):''}/></label></>}
    {kind === 'ebook' ? <section className="lr-upload"><span className="lr-eyebrow">FILE EBOOK PRIVAT</span><h3>Unggah buku yang diterima pembeli</h3><p>PDF atau EPUB, maksimal 20 MB. Pembeli mendapat tombol unduh setelah akses aktif.</p><label>File ebook<input type="file" accept=".pdf,.epub" disabled={uploading} onChange={e => void upload(e.target.files?.[0])}/></label>{uploading && <p role="status">Mengunggah ebook…</p>}{file && <p role="status">✓ File siap: {file.split('/').pop()}</p>}<Notice message={error} error/><p className="lr-muted">File perlu diunggah sebelum produk diterbitkan. Simpan perubahan untuk menghubungkan file ke produk.</p></section> : <p className="lr-inline-notice">{kind === 'course' ? 'Setelah disimpan, susun modul, video, teks, dan latihan di menu Modul & materi.' : kind === 'bundle' ? 'Bundel hanya bisa disimpan sebagai draf pada rilis ini.' : 'Koordinasi jadwal dan pelaksanaan dilakukan pengelola. Produk ini tidak otomatis memberikan sertifikat kelas.'}</p>}
    <div className="lr-fields"><label>Kebijakan atribusi<select name="attributionEnabled" defaultValue={p?.attribution_enabled ? 'true' : 'false'}><option value="false">Nonaktif</option><option value="true">Aktifkan referral dan komisi produk</option></select></label><label>Komisi penjualan (%)<input name="commissionPercent" type="number" min="0" max="100" step="0.01" defaultValue={Number(p?.commission_bps ?? 0) / 100} required/></label></div>
    <p className="lr-muted">Komisi mengikuti pembayaran lunas, bukan sekadar klik. Aturan disimpan saat pesanan dibuat. Refund dicatat sebagai koreksi komisi.</p>
  </Form>;
}

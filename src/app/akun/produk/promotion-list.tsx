'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { query, Notice, rupiah, type DataRow } from '../../belajar/ui';
import { statusLabel } from '@/lib/portal-ui';
export default function PromotionList() {
  const [products, setProducts] = useState<DataRow[]>([]), [aliasUrl, setAliasUrl] = useState(''), [error, setError] = useState(''), [message, setMessage] = useState(''), [search, setSearch] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; Promise.allSettled([query('view=catalog'), fetch('/api/account/referral', { cache: 'no-store' }).then(async r => { if (!r.ok) throw new Error('Tautan referral belum aktif.'); return r.json(); })]).then(results => { if (!active) return;
    if (results[0].status === 'fulfilled') setProducts(results[0].value.products); else setError('Katalog belum dapat dimuat. Coba muat ulang halaman.');
    if (results[1].status === 'fulfilled') setAliasUrl(results[1].value.url); else setError('Tautan referral belum tersedia. Hubungi admin untuk memeriksa keanggotaan mitra.');
    setLoading(false);
  }); return () => { active = false; }; }, []);
  return <section><div className="lr-section-title"><div><h2>Produk yang bisa dipromosikan</h2><p className="lr-muted">Layanan personal, keluarga, pelatihan, dan produk digital dalam satu daftar.</p></div><Link href="/belajar?tab=catalog">Lihat katalog →</Link></div><Notice message={error} error/><Notice message={message}/><label>Cari produk promosi<input type="search" placeholder="Personal, keluarga, ebook…" value={search} onChange={e => setSearch(e.target.value)}/></label>{loading && <p role="status">Memuat produk…</p>}<div className="lr-grid">{products.filter(p => String(p.title).toLowerCase().includes(search.toLowerCase())).map(p => {
    const identifier = String(p.source_product_key || p.slug), target = '/belajar?tab=catalog&product=' + encodeURIComponent(identifier);
    const link = aliasUrl ? aliasUrl + '?to=/belajar&product=' + encodeURIComponent(identifier) : '';
    const enabled = p.attribution_enabled === true && Number(p.commission_bps) > 0;
    return <article className="lr-card" key={String(p.id)}><span className="lr-tag">{p.source_product_key ? 'Layanan STIFIn' : statusLabel(p.kind)}</span><h3 style={{ marginTop: 16 }}>{String(p.title)}</h3><p>{String(p.description)}</p><div className="lr-price">{p.source_product_key && !Number(p.price) ? 'Minta penawaran' : rupiah(p.price)}</div><p className="lr-inline-notice">{enabled ? `Komisi ${Number(p.commission_bps) / 100}% dari nilai pesanan yang lunas. Menunggu persetujuan sebelum pencairan.` : 'Komisi belum diaktifkan admin untuk produk ini.'}</p><div className="lr-actions"><Link className="lr-button lr-secondary" href={target}>Lihat produk</Link><button disabled={!link} onClick={async () => { try { await navigator.clipboard.writeText(link); setMessage('Tautan ' + p.title + ' disalin.'); } catch { setMessage('Salin tautan produk yang tampil di kartu.'); } }}>Salin tautan promosi</button></div>{link && <label className="lr-share-link">Tautan promosi<input readOnly value={link} onFocus={e => e.target.select()}/></label>}</article>;
  })}</div>{!loading && !products.length && !error && <p>Belum ada produk yang diterbitkan.</p>}</section>;
}

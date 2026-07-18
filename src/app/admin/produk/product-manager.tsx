'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ManagedProduct, ProductGroup } from '@/lib/product-store';

const groupLabels: Record<ProductGroup, string> = { test: 'Layanan Tes', promoter: 'Jalur Promotor', affiliate: 'Program Affiliate' };

export default function ProductManager({ databaseReady, initialProducts, initialError }: { databaseReady: boolean; initialProducts: ManagedProduct[]; initialError: string }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<ManagedProduct | null>(initialProducts[0] ?? null);
  const [group, setGroup] = useState<ProductGroup>('test');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(initialError);
  const visible = useMemo(() => products.filter((item) => item.groupName === group), [products, group]);

  function selectGroup(value: ProductGroup) { setGroup(value); setEditing(products.find((item) => item.groupName === value) ?? null); setMessage(''); setError(''); }
  function update<K extends keyof ManagedProduct>(key: K, value: ManagedProduct[K]) { setEditing((current) => current ? { ...current, [key]: value } : current); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!editing) return; setSaving(true); setMessage(''); setError('');
    const response = await fetch(`/api/admin/products/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    const result = await response.json(); setSaving(false);
    if (response.status === 401) { router.replace('/admin/login'); return; }
    if (!response.ok) { setError(result.message ?? 'Produk gagal disimpan.'); return; }
    setProducts((current) => current.map((item) => item.id === result.product.id ? result.product : item)); setEditing(result.product); setMessage('Produk, harga, dan tautan berhasil diperbarui.'); router.refresh();
  }
  async function logout() { await fetch('/api/admin/logout', { method: 'POST' }); router.replace('/admin/login'); router.refresh(); }

  return <div className="article-admin product-admin"><header className="article-admin-header"><Link href="/"><Image src="/stifin-konsep-wordmark.png" alt="STIFIn Konsep" width={419} height={168} priority /></Link><nav><span>Portal Tim</span><b>Produk & Harga</b></nav><div><Link href="/admin/artikel">Artikel</Link><Link href="/admin/pustaka">Pustaka</Link><Link href="/" target="_blank">Lihat website ↗</Link><button onClick={logout}>Keluar</button></div></header><main>
    <section className="article-admin-title"><div><span>PUSAT PRODUK</span><h1>Kelola produk, harga, dan checkout</h1><p>Satu perubahan di sini digunakan oleh homepage dan landing page terkait.</p></div><div className="article-admin-metrics"><span><small>Total produk</small><b>{products.length}</b></span><span><small>Aktif</small><b>{products.filter((item) => item.active).length}</b></span><span><small>Checkout aktif</small><b>{products.filter((item) => item.checkoutUrl).length}</b></span></div></section>
    {!databaseReady && <section className="admin-setup-warning"><b>Database belum dihubungkan</b><p>Tambahkan DATABASE_URL agar pengaturan dapat disimpan.</p></section>}
    <div className="product-admin-tabs">{(Object.keys(groupLabels) as ProductGroup[]).map((key) => <button key={key} className={group === key ? 'active' : ''} onClick={() => selectGroup(key)}>{groupLabels[key]}</button>)}</div>
    <div className="product-admin-layout"><aside>{visible.map((item) => <button key={item.id} className={editing?.id === item.id ? 'active' : ''} onClick={() => setEditing(item)}><span>{item.eyebrow}</span><b>{item.title}</b><small>{item.price} · {item.active ? 'Tampil' : 'Disembunyikan'}</small></button>)}</aside>
      {editing && <form className="product-admin-form" onSubmit={save}><header><div><span>{groupLabels[editing.groupName]}</span><h2>{editing.title}</h2></div><label className="product-toggle"><input type="checkbox" checked={editing.active} onChange={(event) => update('active', event.target.checked)} /> Tampilkan</label></header>
        <div className="editor-grid"><label>Label/kategori<input value={editing.eyebrow} onChange={(event) => update('eyebrow', event.target.value)} /></label><label>Urutan<input type="number" min="0" value={editing.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} /></label><label className="wide">Nama produk<input value={editing.title} onChange={(event) => update('title', event.target.value)} required /></label><label>Harga tampil<input value={editing.price} onChange={(event) => update('price', event.target.value)} required placeholder="Rp650.001" /></label><label>Catatan harga<input value={editing.priceNote} onChange={(event) => update('priceNote', event.target.value)} placeholder="per peserta" /></label><label className="wide">Deskripsi<textarea rows={3} value={editing.description} onChange={(event) => update('description', event.target.value)} /></label><label className="wide">Benefit/manfaat<textarea rows={7} value={editing.features.join('\n')} onChange={(event) => update('features', event.target.value.split('\n'))} /><small>Satu benefit per baris.</small></label><label className="wide">Bonus<textarea rows={4} value={editing.bonuses.join('\n')} onChange={(event) => update('bonuses', event.target.value.split('\n'))} /><small>Satu bonus per baris.</small></label><label>Teks tombol<input value={editing.action} onChange={(event) => update('action', event.target.value)} /></label><label>Produk unggulan<select value={editing.featured ? 'yes' : 'no'} onChange={(event) => update('featured', event.target.value === 'yes')}><option value="no">Tidak</option><option value="yes">Ya</option></select></label><label className="wide">URL checkout SEJOLI<input type="url" value={editing.checkoutUrl} onChange={(event) => update('checkoutUrl', event.target.value)} placeholder="https://app.konsepstifin.com/product/.../" /><small>Wajib memakai app.konsepstifin.com. Kosongkan jika produk belum dibuat; tombol akan membuka formulir minat.</small></label></div>
        {message && <p className="admin-success">{message}</p>}{error && <p className="interest-error">{error}</p>}<footer><button type="submit" disabled={saving || !databaseReady}>{saving ? 'Menyimpan…' : 'Simpan perubahan →'}</button></footer></form>}
    </div>
  </main></div>;
}

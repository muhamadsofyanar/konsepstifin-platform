'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { query, action, rupiah, date, Notice, Form, Input, type DataRow } from './ui';
export default function LearningPortal({ signedIn }: {
    signedIn: boolean;
}) {
    const [products, setProducts] = useState<DataRow[]>([]), [data, setData] = useState<Record<string, DataRow[]>>({}), [message, setMessage] = useState(''), [error, setError] = useState(''), [selected, setSelected] = useState<DataRow | null>(null), [lessons, setLessons] = useState<DataRow[]>([]), [material, setMaterial] = useState<DataRow | null>(null), [buy, setBuy] = useState<DataRow | null>(null), [busy, setBusy] = useState(false), [key, setKey] = useState(''), [bank, setBank] = useState<DataRow | null>(null);
    async function load() { try {
        setProducts((await query('view=catalog')).products);
        if (signedIn)
            setData(await query('view=dashboard'));
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal memuat.');
    } }
    useEffect(() => { let active = true; query('view=catalog').then(d => { if (active)
        setProducts(d.products); }).catch(e => { if (active)
        setError(e instanceof Error ? e.message : 'Gagal memuat.'); }); if (signedIn) {
        query('view=dashboard').then(d => { if (active)
            setData(d); }).catch(e => { if (active)
            setError(e instanceof Error ? e.message : 'Gagal memuat.'); });
        fetch('/api/learning/payment').then(r => r.ok ? r.json() : null).then(d => { if (active)
            setBank(d?.settings ?? null); }).catch(() => { });
    } return () => { active = false; }; }, [signedIn]);
    async function open(p: DataRow) { setSelected(p); setMaterial(null); setError(''); try {
        setLessons((await query('view=syllabus&id=' + p.product_id)).lessons);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal memuat.');
    } }
    async function read(l: DataRow) { try {
        setMaterial((await query('view=material&id=' + l.id)).material);
        setError('');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal membuka.');
    } }
    async function checkout(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); if (busy || !buy)
        return; setBusy(true); setError(''); const f = Object.fromEntries(new FormData(e.currentTarget)); try {
        const result = await action({ action: 'checkout', productId: buy.id, key, ...f });
        setMessage(result.free ? 'Pendaftaran berhasil. Kelas sudah tersedia.' : `Pesanan ${result.number} dibuat. Total ${rupiah(result.total)}. Transfer sesuai rekening di bawah, lalu hubungi admin dengan nomor pesanan agar diverifikasi.`);
        setBuy(null);
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Checkout gagal.');
    }
    finally {
        setBusy(false);
    } }
    return <main className="learning"><nav><Link href="/"><strong>KonsepSTIFIn</strong></Link><Link href="/belajar">Katalog</Link><Link href="/akun">Akun saya</Link>{signedIn ? <Link href="/akun/komisi">Komisi mitra</Link> : <><Link href="/akun/login">Masuk</Link><Link href="/akun/daftar">Daftar peserta</Link></>}</nav><header className="hero"><span className="eyebrow">Ruang belajar</span><h1>Pelajari materi.<br />Lanjutkan dari progres Anda.</h1><p>Kelas, materi, dan pembelian tersimpan dalam akun yang sama.</p></header><Notice message={error} error/><Notice message={message}/>
 {bank && String(bank.accountNumber ?? '') && <details open={!!message}><summary>Informasi transfer</summary><p>{String(bank.bankName)} · {String(bank.accountNumber)}<br />Atas nama {String(bank.accountHolder)}</p><p>{String(bank.instructions)}</p><p className="muted">Akses berbayar aktif setelah admin mencocokkan dan mencatat pelunasan. Jangan transfer bila rekening belum dikonfirmasi pengelola.</p></details>}
 {signedIn && <section><h2>Kelas dan akses saya</h2><div className="cards">{(data.grants ?? []).map(g => { const required = Array.isArray(g.required_lessons) ? g.required_lessons : [], done = (data.progress ?? []).filter(p => Number(p.product_id) === Number(g.product_id) && required.includes(Number(p.lesson_id))).length; return <div className="card" key={String(g.id)}><span className="tag">{String(g.status)}</span><h3>{String(g.title)}</h3><p className="muted">Akses sampai {date(g.expires_at)}</p><progress value={done} max={required.length || 1}/><p>{done}/{required.length} materi wajib selesai</p><button onClick={() => open(g)}>Buka kelas</button></div>; })}</div>{!data.grants?.length && <p className="muted">Belum ada kelas. Pilih produk di katalog untuk mendaftar.</p>}</section>}
 {selected && <section className="card"><h2>{String(selected.title)}</h2><div className="split"><aside>{lessons.map(l => <button className="lesson" key={String(l.id)} onClick={() => read(l)}>{String(l.module)} · {String(l.title)}{Number(l.unlock_days) > 0 && <small> · hari ke-{Number(l.unlock_days) + 1}</small>}</button>)}</aside><div>{material ? <><h3>{String(material.title)}</h3><article>{String(material.body)}</article>{!!material.url && <p><a className="button" href={String(material.url)} target="_blank" rel="noopener noreferrer">Buka {material.kind === 'video' ? 'video' : 'tautan materi'} ↗</a></p>}{!!material.hasFile && <p><a className="button" href={'/api/learning/files/' + material.id}>Unduh file</a></p>}<button disabled={busy} onClick={async () => { setBusy(true); try {
        await action({ action: 'complete', id: material.id });
        setMessage('Progres tersimpan.');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal.');
    }
    finally {
        setBusy(false);
    } }}>Tandai selesai</button></> : <p>Pilih materi untuk mulai atau melanjutkan belajar.</p>}</div></div></section>}
 <h2>Katalog kelas dan produk digital</h2><div className="cards">{products.map(p => <section className="card" key={String(p.id)}><span className="eyebrow">{String(p.kind)}</span><h2>{String(p.title)}</h2><p>{String(p.description)}</p><div className="price">{Number(p.price) === 0 ? 'Gratis' : rupiah(p.price)}</div><p className="muted">{p.access_days ? `${p.access_days} hari akses` : 'Akses tanpa tanggal berakhir'}</p>{signedIn ? <button onClick={() => { setBuy(p); setKey(crypto.randomUUID()); setMessage(''); }}>Daftar / beli</button> : <Link className="button" href="/akun/login">Masuk untuk mendaftar</Link>}</section>)}</div>{!products.length && <section className="card"><h3>Kelas sedang disiapkan</h3><p>Pengelola akan menerbitkan kelas setelah materi, harga, dan masa akses ditentukan.</p></section>}
 {buy && <section className="card"><h2>Daftar: {String(buy.title)}</h2><p>Harga {rupiah(buy.price)}. Kode kupon dihitung saat pesanan dibuat.</p><form onSubmit={checkout}><Input name="name" label="Nama peserta"/><Input name="phone" label="Nomor WhatsApp" maxLength={40}/><Input name="coupon" label="Kode kupon (opsional)" required={false} maxLength={40}/><div className="actions"><button disabled={busy}>{busy ? 'Memproses…' : 'Buat pesanan'}</button><button type="button" onClick={() => setBuy(null)}>Tutup</button></div></form></section>}
 {signedIn && <><h2>Pembelian saya</h2><div className="card">{(data.purchases ?? []).map(p => <p key={String(p.id)}><b>{String((p.snapshot as DataRow).title)}</b><br />{String(p.number ?? 'Pendaftaran gratis')} · Total {rupiah(p.total)} · Tercatat {rupiah(p.balance)}</p>)}</div><h2>Sertifikat</h2>{(data.certificates ?? []).map(c => <p key={String(c.code)}><Link href={'/sertifikat/' + c.code}>{String(c.program_name)} · {c.revoked_at ? 'Dicabut' : 'Lihat sertifikat'}</Link></p>)}<Form title="Ajukan bantuan" actionName="ticket" onDone={load}><Input name="subject" label="Subjek (sertakan nomor pesanan / kelas)"/><label>Pesan<textarea name="message" required maxLength={5000}/></label></Form><div className="card">{(data.tickets ?? []).map(t => <p key={String(t.id)}><b>#{String(t.id)} {String(t.subject)}</b><br />{String(t.message)}<br />Jawaban: {String(t.reply || 'Menunggu pengelola')}</p>)}</div><h2>Pemberitahuan</h2>{(data.notifications ?? []).map((n, i) => <p key={i}>{String(n.message)} · {date(n.created_at)}</p>)}</>}
 </main>;
}

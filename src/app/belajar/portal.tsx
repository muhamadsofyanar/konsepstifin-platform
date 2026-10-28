'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import MemberMenu from '../akun/components/member-menu';
import { learningAccess, statusLabel, purchaseState, groupLearningGrants } from '@/lib/portal-ui';
import { query, action, rupiah, date, Notice, Form, Input, EmptyState, StatusBadge, type DataRow } from './ui';
const tabs = [['classes', 'Kelas saya'], ['catalog', 'Katalog'], ['orders', 'Pembelian'], ['certificates', 'Sertifikat'], ['support', 'Bantuan']];
export default function LearningPortal({ signedIn, roles = [], initialTab }: {
    signedIn: boolean;
    roles?: readonly string[];
    initialTab?: string;
}) {
    const [tab, setTab] = useState(initialTab && tabs.some(([id]) => id === initialTab) ? initialTab : signedIn ? 'classes' : 'catalog');
    const [products, setProducts] = useState<DataRow[]>([]), [data, setData] = useState<Record<string, DataRow[]>>({}), [loading, setLoading] = useState(true), [catalogError, setCatalogError] = useState(''), [accountError, setAccountError] = useState(''), [error, setError] = useState(''), [message, setMessage] = useState('');
    const [selected, setSelected] = useState<DataRow | null>(null), [lessons, setLessons] = useState<DataRow[]>([]), [material, setMaterial] = useState<DataRow | null>(null), [reading, setReading] = useState(false), [buy, setBuy] = useState<DataRow | null>(null), [busy, setBusy] = useState(false), [key, setKey] = useState(''), [search, setSearch] = useState(''), [bank, setBank] = useState<DataRow | null>(null);
    const readerRef = useRef<HTMLElement>(null), checkoutRef = useRef<HTMLElement>(null), requestVersion = useRef(0);
    function navigate(id: string) { setTab(id); setError(''); const u = new URL(window.location.href); u.searchParams.set('tab', id); window.history.replaceState(null, '', u); }
    async function load() { setLoading(true); try {
        const results = await Promise.allSettled([query('view=catalog'), signedIn ? query('view=dashboard') : Promise.resolve(null)]);
        if (results[0].status === 'fulfilled') {
            setProducts(results[0].value.products);
            setCatalogError('');
        }
        else
            setCatalogError('Katalog belum dapat dimuat. Silakan coba kembali.');
        if (signedIn) {
            if (results[1].status === 'fulfilled') {
                setData(results[1].value);
                setAccountError('');
            }
            else
                setAccountError('Data akun belum dapat dimuat. Coba kembali atau masuk ulang.');
        }
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { let active = true; Promise.allSettled([query('view=catalog'), signedIn ? query('view=dashboard') : Promise.resolve(null)]).then(results => { if (!active)
        return; if (results[0].status === 'fulfilled')
        setProducts(results[0].value.products);
    else
        setCatalogError('Katalog belum dapat dimuat. Silakan coba kembali.'); if (signedIn) {
        if (results[1].status === 'fulfilled')
            setData(results[1].value);
        else
            setAccountError('Data akun belum dapat dimuat. Coba kembali atau masuk ulang.');
    } setLoading(false); }); if (signedIn)
        fetch('/api/learning/payment').then(r => r.ok ? r.json() : null).then(d => { if (active)
            setBank(d?.settings ?? null); }).catch(() => { }); return () => { active = false; }; }, [signedIn]);
    async function read(l: DataRow) { const version = ++requestVersion.current; setReading(true); setMaterial(null); setError(''); try {
        const r = await query('view=material&id=' + l.id);
        if (version === requestVersion.current)
            setMaterial(r.material);
    }
    catch (e) {
        if (version === requestVersion.current)
            setError(e instanceof Error ? e.message : 'Materi belum dapat dibuka.');
    }
    finally {
        if (version === requestVersion.current)
            setReading(false);
    } }
    async function open(g: DataRow, resume = false) { const version = ++requestVersion.current; setSelected(g); setLessons([]); setMaterial(null); setReading(true); setError(''); try {
        const r = await query('view=syllabus&id=' + g.product_id);
        if (version !== requestVersion.current)
            return;
        setLessons(r.lessons);
        setReading(false);
        if (resume) {
            const last = r.lessons.find((l: DataRow) => Number(l.id) === Number(g.last_lesson_id)) ?? r.lessons.find((l: DataRow) => l.preview || !learningAccess(g, Number(l.unlock_days)).locked);
            if (last)
                await read(last);
        }
    }
    catch (e) {
        if (version === requestVersion.current) {
            setError(e instanceof Error ? e.message : 'Kelas belum dapat dibuka.');
            setReading(false);
        }
    } readerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    async function checkout(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); if (busy || !buy)
        return; const fields = Object.fromEntries(new FormData(e.currentTarget)); setBusy(true); setError(''); try {
        const r = await action({ action: 'checkout', productId: buy.id, key, ...fields });
        setMessage(r.free ? 'Pendaftaran berhasil. Kelas sudah tersedia di Kelas saya.' : `Pesanan ${r.number} berhasil dibuat. Total ${rupiah(r.total)}. Transfer sesuai rekening pengelola, lalu kirim nomor pesanan kepada admin untuk verifikasi.`);
        setBuy(null);
        navigate(r.free ? 'classes' : 'orders');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Pesanan belum berhasil dibuat.');
    }
    finally {
        setBusy(false);
    } }
    const grants = groupLearningGrants(data.grants ?? []), activeGrants = grants.filter(g => learningAccess(g).active), purchases = data.purchases ?? [], unpaid = purchases.filter(p => ['unpaid', 'partial'].includes(purchaseState(p)));
    const visibleProducts = products.filter(p => (String(p.title) + ' ' + String(p.description)).toLowerCase().includes(search.toLowerCase()));
    return <main className="learning-app"><header className="lr-topbar"><Link href="/" className="lr-brand">KonsepSTIFIn</Link><div className="lr-actions">{signedIn ? <Link href="/akun">Akun saya ↗</Link> : <><Link href="/akun/login">Masuk</Link><Link className="lr-button" href="/akun/daftar">Daftar peserta</Link></>}</div></header>
 {signedIn && <MemberMenu roles={roles} active={'/belajar?tab=' + tab}/>}
 <header className="lr-heading"><div><span className="lr-eyebrow">RUANG BELAJAR ANDA</span><h1>{signedIn ? 'Belajar sesuai langkah Anda.' : 'Temukan kelas dan materi pilihan.'}</h1><p>{signedIn ? 'Lanjutkan materi, pantau pembelian, dan temukan semua akses Anda dalam satu tempat.' : 'Daftar menggunakan satu akun untuk mengakses kelas dan menyimpan progres belajar.'}</p></div>{signedIn && <button className="lr-secondary" onClick={() => navigate(tab === 'catalog' ? 'classes' : 'catalog')}>{tab === 'catalog' ? 'Kelas saya' : 'Jelajahi katalog'} →</button>}</header>
 <Notice message={error} error/><Notice message={message}/>
 {signedIn && <nav className="lr-member-menu" aria-label="Bagian ruang belajar">{tabs.map(([id, label]) => <button key={id} className={tab === id ? '' : 'lr-secondary'} onClick={() => navigate(id)} aria-current={tab === id ? 'page' : undefined}>{label}{id === 'orders' && unpaid.length > 0 ? ' (' + unpaid.length + ')' : ''}</button>)}</nav>}
 {loading && <div className="lr-skeleton" role="status">Memuat kelas dan data akun…</div>}
 {(catalogError || accountError) && <div className="lr-card"><Notice message={tab === 'catalog' ? catalogError : accountError || catalogError} error/><div className="lr-actions"><button className="lr-secondary" disabled={loading} onClick={load}>Coba lagi</button>{signedIn && <Link href="/akun/login">Masuk ulang</Link>}</div></div>}
 <section hidden={!signedIn || tab !== 'classes'}><div className="lr-section-title"><div><h2>Kelas saya</h2><p className="lr-muted">{activeGrants.length} kelas dengan akses aktif{unpaid.length ? ` · ${unpaid.length} pembelian menunggu pelunasan` : ''}</p></div><button className="lr-refresh" onClick={load} disabled={loading}>Perbarui data ↻</button></div>
 {!loading && !accountError && !grants.length && <EmptyState title="Mulai perjalanan belajar Anda" description="Kelas yang Anda daftarkan akan muncul di sini. Pilih kelas di katalog untuk mulai belajar."><button onClick={() => navigate('catalog')}>Lihat katalog kelas →</button></EmptyState>}
 <div className="lr-grid">{grants.map(g => { const required = Array.isArray(g.required_lessons) ? g.required_lessons : [], done = (data.progress ?? []).filter(p => Number(p.product_id) === Number(g.product_id) && required.includes(Number(p.lesson_id))).length; const access = learningAccess(g); return <article className="lr-card" key={String(g.product_id)}><div className="lr-course-cover"><span>E-COURSE</span><b aria-hidden="true">◌</b></div><StatusBadge value={access.active ? 'active' : g.status === 'active' ? 'expired' : g.status}/><h3 style={{ marginTop: 12 }}>{String(g.title)}</h3><p className="lr-muted">{g.expires_at ? 'Akses sampai ' + date(g.expires_at) : 'Akses tanpa tanggal berakhir'}</p><div className="lr-progress-label"><span>{done} dari {required.length} materi wajib</span><b>{required.length ? Math.round(done / required.length * 100) : 0}%</b></div><progress aria-label={'Progres ' + g.title} value={done} max={required.length || 1}/><div className="lr-course-actions"><button disabled={!access.active} onClick={() => open(g, true)}>{done ? 'Lanjutkan belajar' : 'Mulai belajar'} →</button><button className="lr-secondary" disabled={!access.active} onClick={() => open(g)}>Materi</button></div>{!access.active && <p className="lr-budget-note">Akses belum aktif. Hubungi pengelola melalui menu Bantuan.</p>}</article>; })}</div>
 {selected && <section className="lr-card" ref={readerRef} style={{ marginTop: 24, scrollMarginTop: 20 }}><div className="lr-section-title"><div><span className="lr-eyebrow">KELAS YANG DIBUKA</span><h2>{String(selected.title)}</h2></div><button className="lr-secondary" onClick={() => { requestVersion.current++; setSelected(null); setMaterial(null); }}>Tutup materi</button></div><div className="lr-reader"><aside aria-label="Daftar materi">{lessons.map(l => { const access = learningAccess(selected, Number(l.unlock_days)), locked = !l.preview && access.locked, done = (data.progress ?? []).some(p => Number(p.lesson_id) === Number(l.id)); return <button className="lr-lesson" key={String(l.id)} onClick={() => read(l)} disabled={locked} aria-current={Number(material?.id) === Number(l.id)}><span>{done ? '✓ ' : locked ? '▣ ' : ''}{String(l.title)}<small>{String(l.module)}{locked ? ' · Buka ' + date(access.unlockAt) : l.preview ? ' · Pratinjau' : ''}</small></span></button>; })}{!lessons.length && !reading && <p className="lr-muted">Materi belum diterbitkan.</p>}</aside><div>{reading ? <div role="status" className="lr-skeleton">Membuka materi…</div> : material ? <><span className="lr-eyebrow">{String(material.module)}</span><h3>{String(material.title)}</h3><article>{String(material.body)}</article>{!!material.url && <p><a className="lr-button" href={String(material.url)} target="_blank" rel="noopener noreferrer">Buka {material.kind === 'video' ? 'video' : 'tautan materi'} ↗</a></p>}{!!material.hasFile && <p><a className="lr-button" href={'/api/learning/files/' + material.id}>Unduh file materi ↓</a></p>}<button className="lr-secondary" disabled={busy || (data.progress ?? []).some(p => Number(p.lesson_id) === Number(material.id))} onClick={async () => { setBusy(true); try {
        await action({ action: 'complete', id: material.id });
        setMessage('Progres belajar tersimpan.');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Progres belum tersimpan.');
    }
    finally {
        setBusy(false);
    } }}>{(data.progress ?? []).some(p => Number(p.lesson_id) === Number(material.id)) ? '✓ Materi selesai' : 'Tandai materi selesai'}</button></> : <EmptyState title="Pilih materi untuk dibuka" description="Daftar materi ada di sisi kiri. Progres Anda tersimpan setelah menandai materi selesai."/>}</div></div></section>}
 </section>
 <section hidden={signedIn && tab !== 'catalog'}><div className="lr-section-title"><div><h2>Katalog kelas dan produk digital</h2><p className="lr-muted">Pilih materi yang sesuai dengan kebutuhan Anda.</p></div></div><div className="lr-search"><label><span className="lr-eyebrow">CARI KELAS</span><input type="search" placeholder="Ketik nama kelas atau topik…" value={search} onChange={e => setSearch(e.target.value)}/></label></div>
 {!loading && !catalogError && !visibleProducts.length && <EmptyState title={products.length ? 'Kelas tidak ditemukan' : 'Kelas sedang disiapkan'} description={products.length ? 'Coba gunakan kata kunci yang berbeda.' : 'Pengelola akan menerbitkan kelas setelah materi dan pendaftaran siap.'}/>}
 <div className="lr-grid">{visibleProducts.map(p => <article className="lr-card" key={String(p.id)}><div className="lr-course-cover"><span>{statusLabel(p.kind).toUpperCase()}</span><b aria-hidden="true">◌</b></div><h3>{String(p.title)}</h3><p>{String(p.description)}</p><div className="lr-price">{Number(p.price) === 0 ? 'Gratis' : rupiah(p.price)}</div><p className="lr-muted">{p.access_days ? `${p.access_days} hari akses` : 'Akses tanpa tanggal berakhir'}</p>{signedIn ? <button onClick={() => { setBuy(p); setKey(crypto.randomUUID()); setMessage(''); setError(''); requestAnimationFrame(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}>{Number(p.price) ? 'Daftar kelas' : 'Ikuti kelas gratis'} →</button> : <Link className="lr-button" href="/akun/login">Masuk untuk mendaftar →</Link>}</article>)}</div>
 {buy && <section className="lr-card lr-checkout" ref={checkoutRef} style={{ marginTop: 24, scrollMarginTop: 20 }}><span className="lr-eyebrow">KONFIRMASI PENDAFTARAN</span><h2>{String(buy.title)}</h2><div className="lr-checkout-total">Harga kelas <strong>{rupiah(buy.price)}</strong><p className="lr-budget-note">Jika menggunakan kupon, nominal akhir dihitung saat pesanan dibuat. Periksa total pesanan sebelum transfer.</p></div><form onSubmit={checkout}><div className="lr-fields"><Input name="name" label="Nama peserta"/><Input name="phone" label="Nomor WhatsApp" maxLength={40}/></div><Input name="coupon" label="Kode kupon (opsional)" required={false} maxLength={40}/><div className="lr-actions"><button disabled={busy}>{busy ? 'Membuat pesanan…' : Number(buy.price) ? 'Buat pesanan' : 'Daftar gratis'}</button><button className="lr-secondary" type="button" disabled={busy} onClick={() => setBuy(null)}>Batal</button></div></form></section>}
 </section>
 <section hidden={!signedIn || tab !== 'orders'}><div className="lr-section-title"><div><h2>Pembelian saya</h2><p className="lr-muted">Periksa total tagihan dan pembayaran yang sudah diverifikasi admin.</p></div></div>{!loading && !accountError && !purchases.length && <EmptyState title="Belum ada pembelian" description="Pesanan dan pendaftaran gratis Anda akan tercatat di sini."><button onClick={() => navigate('catalog')}>Lihat katalog</button></EmptyState>}
 {purchases.map(p => { const total = Number(p.total), balance = Number(p.balance), remaining = Math.max(0, total - balance), state = purchaseState(p), payable = ['unpaid', 'partial'].includes(state); return <article className="lr-card" key={String(p.id)}><div className="lr-section-title"><div><span className="lr-eyebrow">{String(p.number ?? 'PENDAFTARAN GRATIS')}</span><h3>{String((p.snapshot as DataRow).title)}</h3></div><StatusBadge value={state}/></div><div className="lr-payment"><p>Total <strong>{rupiah(p.total)}</strong></p><p>Terverifikasi <strong>{rupiah(p.balance)}</strong></p>{payable && remaining > 0 && <p>Sisa tagihan <strong>{rupiah(remaining)}</strong></p>}</div>{payable && remaining > 0 && <div className="lr-inline-notice">Transfer sesuai tagihan, lalu hubungi admin dengan nomor pesanan <b>{String(p.number)}</b>. Akses aktif setelah pelunasan diverifikasi.</div>}</article>; })}
 {bank && String(bank.accountNumber ?? '') && <section className="lr-card"><h3>Rekening pembayaran</h3><div className="lr-payment"><div><p>{String(bank.bankName)}</p><strong>{String(bank.accountNumber)}</strong><p>Atas nama {String(bank.accountHolder)}</p></div><button className="lr-secondary" onClick={() => { navigator.clipboard.writeText(String(bank.accountNumber)).then(() => setMessage('Nomor rekening disalin.')).catch(() => setError('Salin nomor rekening yang ditampilkan secara manual.')); }}>Salin nomor rekening</button></div><p>{String(bank.instructions)}</p><p className="lr-budget-note">Gunakan rekening yang sudah dikonfirmasi pengelola.</p></section>}
 </section>
 <section hidden={!signedIn || tab !== 'certificates'}><h2>Sertifikat saya</h2>{!loading && !accountError && !data.certificates?.length && <EmptyState title="Belum ada sertifikat" description="Selesaikan materi wajib kelas. Sertifikat akan muncul setelah diterbitkan pengelola."/>}{(data.certificates ?? []).map(c => <article className="lr-card" key={String(c.code)}><span className="lr-eyebrow">SERTIFIKAT PENYELESAIAN</span><h3>{String(c.program_name)}</h3><p>{String(c.participant_name)}</p><p className="lr-muted">{date(c.issued_at)}</p><Link className="lr-button lr-secondary" href={'/sertifikat/' + c.code}>{c.revoked_at ? 'Lihat status pencabutan' : 'Lihat & cetak sertifikat'} ↗</Link></article>)}</section>
 <section hidden={!signedIn || tab !== 'support'}><h2>Bantuan dan pemberitahuan</h2><Form title="Ajukan bantuan" actionName="ticket" onDone={load}><Input name="subject" label="Subjek (sertakan nomor pesanan atau kelas)"/><label>Ceritakan kendala Anda<textarea name="message" required maxLength={5000}/></label></Form>{!loading && !accountError && !data.tickets?.length && <EmptyState title="Belum ada permintaan bantuan" description="Gunakan formulir di atas jika Anda membutuhkan bantuan terkait kelas atau pembayaran."/>}{(data.tickets ?? []).map(t => <article className="lr-card" key={String(t.id)}><StatusBadge value={t.state}/><h3 style={{ marginTop: 12 }}>#{String(t.id)} · {String(t.subject)}</h3><p>{String(t.message)}</p><div className="lr-inline-notice"><b>Jawaban pengelola</b><p>{String(t.reply || 'Permintaan Anda menunggu jawaban pengelola.')}</p></div></article>)}<h3 style={{ marginTop: 24 }}>Pemberitahuan terbaru</h3>{(data.notifications ?? []).map((n, i) => <div className="lr-card" key={i}><p>{String(n.message)}</p><small className="lr-muted">{date(n.created_at)}</small></div>)}</section>
 </main>;
}

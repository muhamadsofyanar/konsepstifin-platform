'use client';
import Link from 'next/link';
import VideoPlayer from './video-player';
import { productPath } from '@/lib/product-links';
import { useEffect, useRef, useState } from 'react';
import MemberMenu from '../akun/components/member-menu';
import { learningAccess, statusLabel, purchaseState, groupLearningGrants } from '@/lib/portal-ui';
import { query, readLearningJson, action, rupiah, date, Notice, Form, Input, EmptyState, StatusBadge, type DataRow } from './ui';
const tabs = [['classes', 'Akses saya'], ['catalog', 'Katalog'], ['orders', 'Pembelian'], ['certificates', 'Sertifikat'], ['support', 'Bantuan']];
export default function LearningPortal({ signedIn, roles = [], initialTab, initialProduct }: {
    signedIn: boolean;
    roles?: readonly string[];
    initialTab?: string;
    initialProduct?: string;
}) {
    const [tab, setTab] = useState(initialTab && tabs.some(([id]) => id === initialTab) ? initialTab : signedIn ? 'classes' : 'catalog');
    const [products, setProducts] = useState<DataRow[]>([]), [data, setData] = useState<Record<string, DataRow[]>>({}), [loading, setLoading] = useState(true), [catalogError, setCatalogError] = useState(''), [accountError, setAccountError] = useState(''), [error, setError] = useState(''), [message, setMessage] = useState('');
    const [selected, setSelected] = useState<DataRow | null>(null), [lessons, setLessons] = useState<DataRow[]>([]), [material, setMaterial] = useState<DataRow | null>(null), [reading, setReading] = useState(false), [busy, setBusy] = useState(false), [search, setSearch] = useState(''), [kindFilter, setKindFilter] = useState('all'), [productFocus, setProductFocus] = useState(initialProduct ?? ''), [bank, setBank] = useState<DataRow | null>(null), [paymentError, setPaymentError] = useState(''), [paymentRetry, setPaymentRetry] = useState(0);
    const readerRef = useRef<HTMLElement>(null), requestVersion = useRef(0);
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
    } setLoading(false); }); return () => { active = false; }; }, [signedIn]);
    useEffect(() => { if (!signedIn || tab !== 'orders') return; let active=true; readLearningJson('/api/learning/payment').then(d => { if(active){setBank(d.settings ?? {});setPaymentError('');} }).catch(()=>{if(active)setPaymentError('Rekening pembayaran belum dapat dimuat. Coba lagi sebelum melakukan transfer.');});return()=>{active=false;}; }, [signedIn, tab, paymentRetry]);
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
    const grants = groupLearningGrants(data.grants ?? []), activeGrants = grants.filter(g => learningAccess(g).active), purchases = data.purchases ?? [], unpaid = purchases.filter(p => ['unpaid', 'partial'].includes(purchaseState(p)));
    const visibleError = tab === 'catalog' ? catalogError : accountError;
    const visibleProducts = products.filter(p => (!productFocus || p.slug === productFocus || p.source_product_key === productFocus) && (kindFilter === 'all' || (kindFilter === 'service' ? !!p.source_product_key : !p.source_product_key && p.kind === kindFilter)) && (String(p.title) + ' ' + String(p.description)).toLowerCase().includes(search.toLowerCase()));
    return <main className="learning-app"><header className="lr-topbar"><Link href="/" className="lr-brand">KonsepSTIFIn</Link><div className="lr-actions">{signedIn ? <Link href="/akun">Akun saya ↗</Link> : <><Link href="/akun/login">Masuk</Link><Link className="lr-button" href="/akun/daftar">Daftar peserta</Link></>}</div></header>
 {signedIn && <MemberMenu roles={roles} active={'/belajar?tab=' + tab}/>}
 <header className="lr-heading"><div><span className="lr-eyebrow">RUANG BELAJAR ANDA</span><h1>{signedIn ? 'Belajar sesuai langkah Anda.' : 'Layanan dan pengetahuan untuk Anda.'}</h1><p>{signedIn ? 'Lanjutkan materi, pantau pembelian, dan temukan semua akses Anda dalam satu tempat.' : 'Daftar menggunakan satu akun untuk mengakses kelas dan menyimpan progres belajar.'}</p></div>{signedIn && <button className="lr-secondary" onClick={() => navigate(tab === 'catalog' ? 'classes' : 'catalog')}>{tab === 'catalog' ? 'Akses saya' : 'Jelajahi katalog'} →</button>}</header>
 <Notice message={error} error/><Notice message={message}/>
 {signedIn && <nav className="lr-member-menu" aria-label="Bagian ruang belajar">{tabs.map(([id, label]) => <button key={id} className={tab === id ? '' : 'lr-secondary'} onClick={() => navigate(id)} aria-current={tab === id ? 'page' : undefined}>{label}{id === 'orders' && unpaid.length > 0 ? ' (' + unpaid.length + ')' : ''}</button>)}</nav>}
 {loading && <div className="lr-skeleton" role="status">Memuat kelas dan data akun…</div>}
 {visibleError && <div className="lr-card"><Notice message={visibleError} error/><div className="lr-actions"><button className="lr-secondary" disabled={loading} onClick={load}>Coba lagi</button>{signedIn && <Link href="/akun/login">Masuk ulang</Link>}</div></div>}
 <section hidden={!signedIn || tab !== 'classes'}><div className="lr-section-title"><div><h2>Kelas & ebook saya</h2><p className="lr-muted">{activeGrants.length} produk dengan akses aktif{unpaid.length ? ` · ${unpaid.length} pembelian menunggu pelunasan` : ''}</p></div><button className="lr-refresh" onClick={load} disabled={loading}>Perbarui data ↻</button></div>
 {!loading && !accountError && !grants.length && <EmptyState title="Mulai perjalanan belajar Anda" description="Kelas yang Anda daftarkan akan muncul di sini. Pilih kelas di katalog untuk mulai belajar."><button onClick={() => navigate('catalog')}>Lihat katalog kelas →</button></EmptyState>}
 <div className="lr-grid lr-owned-grid">{grants.map(g => { const required = Array.isArray(g.required_lessons) ? g.required_lessons : [], done = (data.progress ?? []).filter(p => Number(p.product_id) === Number(g.product_id) && required.includes(Number(p.lesson_id))).length; const access = learningAccess(g); return <article className="lr-card" key={String(g.product_id)}><div className="lr-course-cover"><span>{statusLabel(g.kind ?? 'course').toUpperCase()}</span><b aria-hidden="true">◌</b></div><StatusBadge value={access.active ? 'active' : g.status === 'active' ? 'expired' : g.status}/><h3 style={{ marginTop: 12 }}>{String(g.title)}</h3><p className="lr-muted">{g.expires_at ? 'Akses sampai ' + date(g.expires_at) : 'Akses tanpa tanggal berakhir'}</p>{g.kind !== 'ebook' && <><div className="lr-progress-label"><span>{done} dari {required.length} materi wajib</span><b>{required.length ? Math.round(done / required.length * 100) : 0}%</b></div><progress aria-label={'Progres ' + g.title} value={done} max={required.length || 1}/></>}<div className="lr-course-actions"><button disabled={!access.active} onClick={() => open(g, true)}>{g.kind === 'ebook' ? 'Buka ebook' : done ? 'Lanjutkan belajar' : 'Mulai belajar'} →</button><button className="lr-secondary" disabled={!access.active} onClick={() => open(g)}>{g.kind === 'ebook' ? 'Unduhan' : 'Materi'}</button></div>{!access.active && <p className="lr-budget-note">Akses belum aktif. Hubungi pengelola melalui menu Bantuan.</p>}</article>; })}</div>
 {selected && <section className="lr-card lr-reader-card" ref={readerRef} style={{ marginTop: 24, scrollMarginTop: 20 }}><div className="lr-section-title"><div><span className="lr-eyebrow">{selected.kind === 'ebook' ? 'EBOOK ANDA' : 'KELAS YANG DIBUKA'}</span><h2>{String(selected.title)}</h2></div><button className="lr-secondary" onClick={() => { requestVersion.current++; setSelected(null); setMaterial(null); }}>Tutup materi</button></div><div className="lr-reader"><aside aria-label="Daftar materi">{lessons.map(l => { const access = learningAccess(selected, Number(l.unlock_days)), locked = !l.preview && access.locked, done = (data.progress ?? []).some(p => Number(p.lesson_id) === Number(l.id)); return <button className="lr-lesson" key={String(l.id)} onClick={() => read(l)} disabled={locked} aria-current={Number(material?.id) === Number(l.id)}><span>{done ? '✓ ' : locked ? '▣ ' : ''}{String(l.title)}<small>{String(l.module)}{locked ? ' · Buka ' + date(access.unlockAt) : l.preview ? ' · Pratinjau' : ''}</small></span></button>; })}{!lessons.length && !reading && <p className="lr-muted">Materi belum diterbitkan.</p>}</aside><div>{reading ? <div role="status" className="lr-skeleton">Membuka materi…</div> : material ? <><span className="lr-eyebrow">{String(material.module)}</span><h3>{String(material.title)}</h3><article>{String(material.body)}</article>{!!material.url && (material.kind === 'video' ? <VideoPlayer key={String(material.id)} url={String(material.url)} title={String(material.title)}/> : <p><a className="lr-button" href={String(material.url)} target="_blank" rel="noopener noreferrer">Buka tautan materi ↗</a></p>)}{!!material.hasFile && <p><a className="lr-button" href={'/api/learning/files/' + material.id}>Unduh file materi ↓</a></p>}{selected.kind !== 'ebook' && <button className="lr-secondary" disabled={busy || (data.progress ?? []).some(p => Number(p.lesson_id) === Number(material.id))} onClick={async () => { setBusy(true); try {
        await action({ action: 'complete', id: material.id });
        setMessage('Progres belajar tersimpan.');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Progres belum tersimpan.');
    }
    finally {
        setBusy(false);
    } }}>{(data.progress ?? []).some(p => Number(p.lesson_id) === Number(material.id)) ? '✓ Materi selesai' : 'Tandai materi selesai'}</button>}</> : <EmptyState title="Pilih materi untuk dibuka" description="Daftar materi ada di sisi kiri. Progres Anda tersimpan setelah menandai materi selesai."/>}</div></div></section>}
 </section>
 <section hidden={signedIn && tab !== 'catalog'}><div className="lr-section-title"><div><h2>Katalog layanan dan produk digital</h2><p className="lr-muted">Pilih materi yang sesuai dengan kebutuhan Anda.</p></div></div><div className="lr-search"><label><span className="lr-eyebrow">CARI PRODUK</span><input type="search" placeholder="Personal, keluarga, ebook, atau kelas…" value={search} onChange={e => setSearch(e.target.value)}/></label><label>Jenis produk<select value={kindFilter} onChange={e => setKindFilter(e.target.value)}><option value="all">Semua jenis</option><option value="service">Layanan STIFIn</option><option value="course">E-course</option><option value="ebook">Ebook</option><option value="webinar">Webinar</option></select></label></div>{productFocus && <p className="lr-inline-notice">Menampilkan produk pilihan. <button className="lr-secondary" onClick={() => setProductFocus('')}>Lihat semua produk</button></p>}
 {!loading && !catalogError && !visibleProducts.length && <EmptyState title={products.length ? 'Kelas tidak ditemukan' : 'Kelas sedang disiapkan'} description={products.length ? 'Coba gunakan kata kunci yang berbeda.' : 'Pengelola akan menerbitkan kelas setelah materi dan pendaftaran siap.'}/>}
 <div className="lr-grid">{visibleProducts.map(p => <article className="lr-card" key={String(p.id)}><div className="lr-course-cover"><span>{p.source_product_key ? 'LAYANAN STIFIN' : statusLabel(p.kind).toUpperCase()}</span><b aria-hidden="true">◌</b></div><h3>{String(p.title)}</h3><p>{String(p.description)}</p><div className="lr-price">{p.source_product_key && !Number(p.price) ? 'Minta penawaran' : Number(p.price) === 0 ? 'Gratis' : rupiah(p.price)}</div><p className="lr-muted">{p.source_product_key ? String(p.price_note || 'Jadwal dikonfirmasi pengelola') : p.access_days ? `${p.access_days} hari akses` : 'Akses tanpa tanggal berakhir'}</p><Link className="lr-button" href={productPath(p)}>Lihat produk →</Link></article>)}</div>

 </section>
 <section hidden={!signedIn || tab !== 'orders'}><div className="lr-section-title"><div><h2>Pembelian saya</h2><p className="lr-muted">Periksa total tagihan dan pembayaran yang sudah diverifikasi admin.</p></div></div>{!loading && !accountError && !purchases.length && <EmptyState title="Belum ada pembelian" description="Pesanan dan pendaftaran gratis Anda akan tercatat di sini."><button onClick={() => navigate('catalog')}>Lihat katalog</button></EmptyState>}
 {purchases.map(p => { const total = Number(p.total), balance = Number(p.balance), remaining = Math.max(0, total - balance), state = purchaseState(p), payable = ['unpaid', 'partial'].includes(state); return <article className="lr-card" key={String(p.id)}><div className="lr-section-title"><div><span className="lr-eyebrow">{String(p.number ?? 'PENDAFTARAN GRATIS')}</span><h3>{String((p.snapshot as DataRow).title)}</h3></div><StatusBadge value={state}/></div><div className="lr-payment"><p>Total <strong>{rupiah(p.total)}</strong></p><p>Terverifikasi <strong>{rupiah(p.balance)}</strong></p>{payable && remaining > 0 && <p>Sisa tagihan <strong>{rupiah(remaining)}</strong></p>}</div>{payable && remaining > 0 && <div className="lr-inline-notice">Transfer sesuai tagihan, lalu hubungi admin dengan nomor pesanan <b>{String(p.number)}</b>. Akses aktif setelah pelunasan diverifikasi.</div>}</article>; })}
 {paymentError && <div className="lr-card"><Notice message={paymentError} error/><button className="lr-secondary" onClick={()=>setPaymentRetry(v=>v+1)}>Muat ulang rekening</button></div>}{!bank&&!paymentError&&<p role="status">Memuat rekening pembayaran…</p>}{bank&&!String(bank.accountNumber??'')&&<p className="lr-inline-notice">Rekening pembayaran belum ditetapkan. Hubungi pengelola sebelum transfer.</p>}
 {bank && String(bank.accountNumber ?? '') && <section className="lr-card"><h3>Rekening pembayaran</h3><div className="lr-payment"><div><p>{String(bank.bankName)}</p><strong>{String(bank.accountNumber)}</strong><p>Atas nama {String(bank.accountHolder)}</p></div><button className="lr-secondary" onClick={() => { navigator.clipboard.writeText(String(bank.accountNumber)).then(() => setMessage('Nomor rekening disalin.')).catch(() => setError('Salin nomor rekening yang ditampilkan secara manual.')); }}>Salin nomor rekening</button></div><p>{String(bank.instructions)}</p><p className="lr-budget-note">Gunakan rekening yang sudah dikonfirmasi pengelola.</p></section>}
 </section>
 <section hidden={!signedIn || tab !== 'certificates'}><h2>Sertifikat saya</h2>{!loading && !accountError && !data.certificates?.length && <EmptyState title="Belum ada sertifikat" description="Selesaikan materi wajib kelas. Sertifikat akan muncul setelah diterbitkan pengelola."/>}{(data.certificates ?? []).map(c => <article className="lr-card" key={String(c.code)}><span className="lr-eyebrow">SERTIFIKAT PENYELESAIAN</span><h3>{String(c.program_name)}</h3><p>{String(c.participant_name)}</p><p className="lr-muted">{date(c.issued_at)}</p><Link className="lr-button lr-secondary" href={'/sertifikat/' + c.code}>{c.revoked_at ? 'Lihat status pencabutan' : 'Lihat & cetak sertifikat'} ↗</Link></article>)}</section>
 <section hidden={!signedIn || tab !== 'support'}><h2>Bantuan dan pemberitahuan</h2><Form title="Ajukan bantuan" actionName="ticket" onDone={load}><Input name="subject" label="Subjek (sertakan nomor pesanan atau kelas)"/><label>Ceritakan kendala Anda<textarea name="message" required maxLength={5000}/></label></Form>{!loading && !accountError && !data.tickets?.length && <EmptyState title="Belum ada permintaan bantuan" description="Gunakan formulir di atas jika Anda membutuhkan bantuan terkait kelas atau pembayaran."/>}{(data.tickets ?? []).map(t => <article className="lr-card" key={String(t.id)}><StatusBadge value={t.state}/><h3 style={{ marginTop: 12 }}>#{String(t.id)} · {String(t.subject)}</h3><p>{String(t.message)}</p><div className="lr-inline-notice"><b>Jawaban pengelola</b><p>{String(t.reply || 'Permintaan Anda menunggu jawaban pengelola.')}</p></div></article>)}<h3 style={{ marginTop: 24 }}>Pemberitahuan terbaru</h3>{(data.notifications ?? []).map((n, i) => <div className="lr-card" key={i}><p>{String(n.message)}</p><small className="lr-muted">{date(n.created_at)}</small></div>)}</section>
 </main>;
}

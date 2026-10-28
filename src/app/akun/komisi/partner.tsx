'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { query, Form, Input, Notice, Table, rupiah, type DataRow } from '../../belajar/ui';
export default function Partner() {
    const [data, setData] = useState<{
        available: number;
        debt: number;
        commissions: DataRow[];
        payouts: DataRow[];
    } | null>(null), [error, setError] = useState(''), [key, setKey] = useState('');
    async function load() { try {
        setData(await query('view=partner'));
        if (!key)
            setKey(crypto.randomUUID());
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal memuat.');
    } }
    useEffect(() => { let active = true; query('view=partner').then(d => { if (active) {
        setData(d);
        setKey(crypto.randomUUID());
    } }).catch(e => { if (active)
        setError(e instanceof Error ? e.message : 'Gagal memuat.'); }); return () => { active = false; }; }, []);
    return <main className="learning"><nav><strong>KonsepSTIFIn</strong><Link href="/akun">Akun</Link><Link href="/akun/tautan">Tautan referral</Link><Link href="/belajar">Kelas</Link></nav><span className="eyebrow">Ruang mitra</span><h1>Komisi dan pencairan.</h1><Notice message={error} error/><section className="card"><p>Saldo tersedia</p><div className="price">{rupiah(data?.available)}</div><p>Komisi baru menunggu persetujuan admin. Pencairan melalui transfer manual.</p>{Number(data?.debt) < 0 && <Notice message="Ada koreksi komisi yang sudah dicadangkan atau dibayar. Hubungi admin untuk penyelesaian." error/>}</section><Form title="Ajukan seluruh saldo tersedia" actionName="payout.request" onDone={() => { setKey(crypto.randomUUID()); void load(); }} transform={d => ({ ...d, key })} button="Ajukan pencairan"><Input name="details" label="Bank, nomor rekening, dan nama pemilik rekening" maxLength={1000}/><p>Nominal pengajuan: {rupiah(data?.available)}. Saldo langsung dicadangkan sampai pengajuan diselesaikan.</p></Form><h2>Rincian komisi</h2><section className="card"><Table rows={data?.commissions ?? []} columns={[["id", "ID"], ["purchase_id", "Pembelian"], ["amount", "Rupiah"], ["state", "Status"], ["reason", "Catatan"]]}/></section><h2>Riwayat pencairan</h2><section className="card"><Table rows={data?.payouts ?? []} columns={[["id", "ID"], ["amount", "Rupiah"], ["state", "Status"], ["reference", "Referensi pembayaran"], ["reason", "Catatan"]]}/></section></main>;
}

'use client';
import Link from 'next/link';
import MemberMenu from '../components/member-menu';
import { useEffect, useState } from 'react';
import { query, Form, Input, Notice, Table, rupiah, type DataRow } from '../../belajar/ui';
export default function Partner({ roles = [] }: {
    roles?: readonly string[];
}) {
    const [data, setData] = useState<{
        available: number;
        debt: number;
        commissions: DataRow[];
        payouts: DataRow[];
    } | null>(null), [error, setError] = useState(''), [key, setKey] = useState('');
    async function load() {
        try {
            setData(await query('view=partner')); setError('');
            if (!key)
                setKey(crypto.randomUUID());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Gagal memuat.');
        }
    }
    useEffect(() => {
        let active = true;
        query('view=partner').then(d => {
            if (active) {
                setData(d);
                setKey(crypto.randomUUID());
            }
        }).catch(e => {
            if (active)
                setError(e instanceof Error ? e.message : 'Gagal memuat.');
        });
        return () => { active = false; };
    }, []);
    return <main className="learning-app"><header className="lr-topbar"><Link href="/" className="lr-brand">KonsepSTIFIn</Link><Link href="/akun">Akun saya ↗</Link></header><MemberMenu roles={roles} active="/akun/komisi"/><header className="lr-heading"><div><span className="lr-eyebrow">RUANG MITRA</span><h1>Komisi dan pencairan.</h1><p>Promosikan layanan dan produk digital. Pantau komisi lalu ajukan pencairan saat saldo tersedia.</p></div>{roles.includes('promoter') && <Link className="lr-button lr-secondary" href="/akun/tautan">Tautan referral ↗</Link>}</header><div className="lr-card lr-get-started"><h2>Pilih produk untuk dipromosikan</h2><p>Tes personal, paket keluarga, pelatihan, ebook, dan e-course tersedia dalam satu katalog mitra.</p><Link className="lr-button" href="/akun/produk">Buka produk promosi →</Link></div><Notice message={error} error/><section className="lr-card"><p>Saldo tersedia</p><div className="lr-price">{data ? rupiah(data.available) : '—'}</div><p>Komisi baru menunggu persetujuan admin. Pencairan melalui transfer manual.</p>{Number(data?.debt) < 0 && <Notice message="Ada koreksi komisi yang sudah dicadangkan atau dibayar. Hubungi admin untuk penyelesaian." error/>}</section><Form disabled={!data || data.available <= 0 || !key} title="Ajukan seluruh saldo tersedia" actionName="payout.request" onDone={() => { setKey(crypto.randomUUID()); void load(); }} transform={d => ({ ...d, key })} button="Ajukan pencairan"><Input name="details" label="Bank, nomor rekening, dan nama pemilik rekening" maxLength={1000}/><p>Nominal pengajuan: {data ? rupiah(data.available) : '—'}. Saldo langsung dicadangkan sampai pengajuan diselesaikan.</p></Form><h2>Rincian komisi</h2><section className="lr-card"><Table rows={data?.commissions ?? []} columns={[["id", "ID"], ["product_title", "Produk"], ["order_number", "Pesanan"], ["amount", "Rupiah"], ["state", "Status"], ["reason", "Catatan"]]}/></section><h2>Riwayat pencairan</h2><section className="lr-card"><Table rows={data?.payouts ?? []} columns={[["id", "ID"], ["amount", "Rupiah"], ["state", "Status"], ["reference", "Referensi pembayaran"], ["reason", "Catatan"]]}/></section></main>;
}

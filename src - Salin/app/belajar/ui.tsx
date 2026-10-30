'use client';
import { statusLabel } from '@/lib/portal-ui';
import { useEffect, useState, type FormEvent } from 'react';
export type DataRow = Record<string, unknown>;
export const rupiah = (v: unknown) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v ?? 0)).replace(/\u00a0/g,'');
export const date = (v: unknown) => v ? new Date(typeof v === 'number' ? v : String(v)).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) + ' WIB' : 'Tanpa batas';
export async function readLearningJson(url: string) {
    let r = await fetch(url, { cache: 'no-store' });
    // Retry one transient server failure for read-only loading. Mutations are never retried here.
    if (r.status >= 500) r = await fetch(url, { cache: 'no-store' });
    const d = await r.json();
    if (!r.ok)
        throw new Error(d.message);
    return d;
}
export function query(view: string) { return readLearningJson('/api/learning?' + view); }
export async function action(input: DataRow) {
    const r = await fetch('/api/learning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const d = await r.json();
    if (!r.ok)
        throw new Error(d.message);
    return d.result;
}
export function Notice({ message, error = false }: {
    message: string;
    error?: boolean;
}) { return message ? <div role={error ? 'alert' : 'status'} className={'lr-notice' + (error ? ' lr-error' : '')}>{message}</div> : null; }
export function Form({ title, actionName, children, onDone, transform, button = 'Simpan', disabled = false }: {
    title: string;
    actionName: string;
    children: React.ReactNode;
    onDone: () => void;
    transform?: (d: DataRow) => DataRow;
    button?: string;
    disabled?: boolean;
}) {
    const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [failed, setFailed] = useState(false);
    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (busy)
            return;
        const d: DataRow = Object.fromEntries(new FormData(e.currentTarget));
        setBusy(true);
        setFailed(false);
        try {
            await action({ action: actionName, ...(transform ? transform(d) : d) });
            setMessage('Berhasil disimpan.');
            onDone();
        }
        catch (e) {
            setFailed(true);
            setMessage(e instanceof Error ? e.message : 'Gagal menyimpan.');
        }
        finally {
            setBusy(false);
        }
    }
    return <details open={title.startsWith('Edit') || undefined}><summary>{title}</summary><form onSubmit={submit}>{children}<Notice message={message} error={failed}/><button disabled={busy || disabled}>{busy ? 'Menyimpan…' : button}</button></form></details>;
}
export function Input({ name, label, type = 'text', required = true, defaultValue = '', maxLength = 200 }: {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    defaultValue?: string | number;
    maxLength?: number;
}) { return <label>{label}<input name={name} type={type} defaultValue={defaultValue} required={required} maxLength={maxLength} min={type === 'number' ? 0 : undefined}/></label>; }
export function Table({ rows, columns }: {
    rows: DataRow[];
    columns: [
        string,
        string
    ][];
}) { return <div className="lr-scroll"><table><thead><tr>{columns.map(([k, t]) => <th key={k}>{t}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{columns.map(([k]) => <td key={k}>{['state', 'status', 'kind'].includes(k) ? <StatusBadge value={r[k]}/> : ['amount', 'price', 'total', 'discount', 'balance'].includes(k) ? rupiah(r[k]) : k.endsWith('_at') ? date(r[k]) : typeof r[k] === 'boolean' ? (r[k] ? 'Ya' : 'Tidak') : String(r[k] ?? '—')}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="lr-muted">Belum ada data.</p>}</div>; }
export function RowSelect({ name, label, rows, display, valueKey = 'id' }: {
    name: string;
    label: string;
    rows: DataRow[];
    display: (r: DataRow) => string;
    valueKey?: string;
}) { return <label>{label}<select name={name} required defaultValue=""><option value="" disabled>{rows.length ? 'Pilih dari daftar…' : 'Belum ada data yang dapat dipilih'}</option>{rows.map(r => <option key={String(r[valueKey])} value={String(r[valueKey])}>{display(r)}</option>)}</select></label>; }
export function EmptyState({ title, description, children }: {
    title: string;
    description: string;
    children?: React.ReactNode;
}) { return <div className="lr-empty"><span className="lr-empty-icon" aria-hidden="true">○</span><h3>{title}</h3><p>{description}</p>{children}</div>; }
export function StatusBadge({ value }: {
    value: unknown;
}) { return <span className={'lr-tag lr-status-' + String(value).replace(/[^a-z_]/g, '')}>{statusLabel(value)}</span>; }
export function AccountSelect({ name, rows }: {
    name: string;
    rows: DataRow[];
}) { const [search, setSearch] = useState(''), [results, setResults] = useState<DataRow[]>([]), [loading, setLoading] = useState(false), [error, setError] = useState(''), [selected, setSelected] = useState(''); useEffect(() => { let active = true; if (search.trim().length < 2)
    return; const timer = setTimeout(() => { setLoading(true); setError(''); query('view=users&q=' + encodeURIComponent(search.trim())).then(d => { if (active)
    setResults(d.users); }).catch(() => { if (active)
    setError('Pencarian akun belum tersedia. Coba kembali.'); }).finally(() => { if (active)
    setLoading(false); }); }, 250); return () => { active = false; clearTimeout(timer); }; }, [search]); const options = search.trim().length >= 2 ? results : rows; return <div><label>Cari email peserta<input type="search" value={search} placeholder="Ketik minimal 2 karakter untuk mencari semua akun…" onChange={e => { setSearch(e.target.value); setSelected(''); setResults([]); }}/></label><label>Pilih akun peserta<select name={name} required value={selected} onChange={e => setSelected(e.target.value)}><option value="">{loading ? 'Mencari akun…' : options.length ? 'Pilih email peserta…' : 'Belum ada akun. Cari melalui email di atas.'}</option>{options.map(r => <option key={String(r.id)} value={String(r.id)}>{String(r.email)}</option>)}</select></label>{error && <Notice message={error} error/>}</div>; }

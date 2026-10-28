'use client';
import { useState, type FormEvent } from 'react';
export type DataRow = Record<string, unknown>;
export const rupiah = (v: unknown) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v ?? 0));
export const date = (v: unknown) => v ? new Date(String(v)).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) + ' WIB' : 'Tanpa batas';
export async function query(view: string) { const r = await fetch('/api/learning?' + view, { cache: 'no-store' }); const d = await r.json(); if (!r.ok)
    throw new Error(d.message); return d; }
export async function action(input: DataRow) { const r = await fetch('/api/learning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); const d = await r.json(); if (!r.ok)
    throw new Error(d.message); return d.result; }
export function Notice({ message, error = false }: {
    message: string;
    error?: boolean;
}) { return message ? <div role="status" className={'notice' + (error ? ' error' : '')}>{message}</div> : null; }
export function Form({ title, actionName, children, onDone, transform, button = 'Simpan' }: {
    title: string;
    actionName: string;
    children: React.ReactNode;
    onDone: () => void;
    transform?: (d: DataRow) => DataRow;
    button?: string;
}) { const [busy, setBusy] = useState(false), [message, setMessage] = useState(''); async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (busy)
    return; const d: DataRow = Object.fromEntries(new FormData(e.currentTarget)); setBusy(true); try {
    await action({ action: actionName, ...(transform ? transform(d) : d) });
    setMessage('Berhasil disimpan.');
    onDone();
}
catch (e) {
    setMessage(e instanceof Error ? e.message : 'Gagal menyimpan.');
}
finally {
    setBusy(false);
} } return <details><summary>{title}</summary><form onSubmit={submit}>{children}<Notice message={message}/><button disabled={busy}>{busy ? 'Menyimpan…' : button}</button></form></details>; }
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
}) { return <div className="scroll"><table><thead><tr>{columns.map(([k, t]) => <th key={k}>{t}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{columns.map(([k]) => <td key={k}>{String(r[k] ?? '')}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="muted">Belum ada data.</p>}</div>; }

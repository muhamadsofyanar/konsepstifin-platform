'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { MappingSource } from '@/lib/promoter-domain';
import type { PromoterPage } from '@/lib/promoter-catalog';
import type { PromoterCatalogStatus } from '@/lib/promoter-store';
import type { Wilayah } from '@/lib/wilayah';

type AdminQuery = {
  q?: string;
  province?: string;
  regency?: string;
  branch?: string;
  mapping?: MappingSource | '';
  page?: number;
};

type PromoterManagerProps = {
  initialPage: PromoterPage;
  status: PromoterCatalogStatus;
  provinces: Wilayah[];
  initialQuery?: AdminQuery;
};

type ImportResult = {
  accepted?: Array<{ promoterCode: string; regionCodes: string[] }>;
  rejected?: Array<{ row: number; reason: string }>;
  message?: string;
};

function createAdminHref(query: AdminQuery, page = 1) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.province) params.set('province', query.province);
  if (query.regency) params.set('regency', query.regency);
  if (query.branch) params.set('branch', query.branch);
  if (query.mapping) params.set('mapping', query.mapping);
  if (page > 1) params.set('page', String(page));
  const suffix = params.toString();
  return suffix ? `/admin/promotor?${suffix}` : '/admin/promotor';
}

export default function PromoterManager({
  initialPage,
  status,
  provinces,
  initialQuery = {},
}: PromoterManagerProps) {
  const router = useRouter();
  const [query, setQuery] = useState<AdminQuery>(initialQuery);
  const [items, setItems] = useState(initialPage.items);
  const [regionDrafts, setRegionDrafts] = useState<Record<string, string>>(() => Object.fromEntries(
    initialPage.items.map((promoter) => [promoter.code, promoter.regionCodes.join(', ')]),
  ));
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [coverage, setCoverage] = useState({ regionCode: '', serviceable: 'true', evidenceNote: '' });
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const timer = window.setTimeout(() => router.replace(createAdminHref(query)), 350);
    return () => window.clearTimeout(timer);
  }, [query, router]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.replace(createAdminHref(query));
  }

  async function saveMapping(code: string, name: string) {
    setSaving(code);
    setMessage('');
    setError('');
    try {
      const regionCodes = (regionDrafts[code] || '').split(/[;,\s]+/).map((item) => item.trim()).filter(Boolean);
      const response = await fetch('/api/admin/promotor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, regionCodes }),
      });
      const result = await response.json() as { mapping?: { regionCodes?: string[] }; message?: string };
      if (!response.ok) throw new Error(result.message || 'Pemetaan gagal disimpan.');
      const savedCodes = Array.isArray(result.mapping?.regionCodes) ? result.mapping.regionCodes : [];
      setItems((current) => current.map((promoter) => promoter.code === code
        ? { ...promoter, regionCodes: savedCodes, mappingSource: 'manual' }
        : promoter));
      setRegionDrafts((current) => ({ ...current, [code]: savedCodes.join(', ') }));
      setMessage(`Pemetaan ${name} tersimpan.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Pemetaan gagal disimpan.');
    } finally {
      setSaving('');
    }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setError('');
    try {
      const response = await fetch('/api/admin/promotor/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv; charset=utf-8' },
        body: await file.text(),
      });
      const result = await response.json() as ImportResult;
      if (!response.ok) throw new Error(result.message || 'Impor CSV gagal.');
      setImportResult(result);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Impor CSV gagal.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  }

  async function saveCoverage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    const evidenceNote = coverage.evidenceNote.replace(/\s+/g, ' ').trim();
    if (coverage.serviceable === 'true' && (evidenceNote.length < 10 || evidenceNote.length > 500)) {
      setError('Catatan bukti harus berisi 10-500 karakter.');
      return;
    }
    setSaving('coverage');
    try {
      const response = await fetch('/api/admin/promotor/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionCode: coverage.regionCode,
          serviceable: coverage.serviceable === 'true',
          evidenceNote,
        }),
      });
      const result = await response.json() as { coverage?: { regionCode?: string }; message?: string };
      if (!response.ok) throw new Error(result.message || 'Cakupan gagal disimpan.');
      setMessage(`Cakupan ${result.coverage?.regionCode || coverage.regionCode} tersimpan.`);
      setCoverage({ regionCode: '', serviceable: 'true', evidenceNote: '' });
    } catch (coverageError) {
      setError(coverageError instanceof Error ? coverageError.message : 'Cakupan gagal disimpan.');
    } finally {
      setSaving('');
    }
  }

  const source = status.source;

  return <div className="promoter-admin-workspace">
    <section className="promoter-source-status" aria-label="Status upstream promotor">
      <header><div><span>STATUS UPSTREAM</span><h2>{source.source === 'none' ? 'Sumber belum tersedia' : `Mode ${source.mode}`}</h2></div><b className={source.stale ? 'stale' : 'fresh'}>{source.stale ? 'STALE FALLBACK' : 'FRESH'}</b></header>
      <dl>
        <div><dt>HTTP terakhir</dt><dd>{source.lastHttpStatus ?? '—'}</dd></div>
        <div><dt>Baris mentah</dt><dd>{source.rawRows.toLocaleString('id-ID')}</dd></div>
        <div><dt>Baris aman</dt><dd>{source.safeRows.toLocaleString('id-ID')}</dd></div>
        <div><dt>Aktif</dt><dd>{source.activeRows.toLocaleString('id-ID')}</dd></div>
        <div><dt>Nonaktif</dt><dd>{source.inactiveRows.toLocaleString('id-ID')}</dd></div>
        <div><dt>Cabang</dt><dd>{source.branchCount.toLocaleString('id-ID')}</dd></div>
        <div><dt>Sukses terakhir</dt><dd>{source.lastSuccessAt ? new Date(source.lastSuccessAt).toLocaleString('id-ID') : '—'}</dd></div>
        <div><dt>Kategori error</dt><dd>{source.errorCategory || '—'}</dd></div>
      </dl>
      {source.message ? <p>{source.message}</p> : null}
    </section>

    <section className="promoter-admin-toolbar">
      <form onSubmit={applyFilters}>
        <label>Cari promotor
          <input type="search" value={query.q || ''} onChange={(event) => setQuery((current) => ({ ...current, q: event.target.value }))} placeholder="Nama atau KodeID" />
        </label>
        <label>Provinsi
          <select value={query.province || ''} onChange={(event) => setQuery((current) => ({ ...current, province: event.target.value }))}>
            <option value="">Semua provinsi</option>
            {provinces.map((province) => <option key={province.code} value={province.name}>{province.name}</option>)}
          </select>
        </label>
        <label>Kabupaten/kota
          <input value={query.regency || ''} onChange={(event) => setQuery((current) => ({ ...current, regency: event.target.value }))} placeholder="Nama atau kode wilayah" />
        </label>
        <label>Cabang
          <input value={query.branch || ''} onChange={(event) => setQuery((current) => ({ ...current, branch: event.target.value }))} placeholder="Kode cabang" />
        </label>
        <label>Status mapping
          <select value={query.mapping || ''} onChange={(event) => setQuery((current) => ({ ...current, mapping: event.target.value as MappingSource | '' }))}>
            <option value="">Semua mapping</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </label>
        <button type="submit">Terapkan filter</button>
      </form>
      <div className="promoter-csv-controls">
        <label className="admin-file-control">Impor CSV<input aria-label="Impor CSV" type="file" accept=".csv,text/csv" onChange={(event) => void importCsv(event)} disabled={importing} /></label>
        <a href="/api/admin/promotor/export">Ekspor CSV</a>
      </div>
    </section>

    {message ? <p className="optimizer-message success">{message}</p> : null}
    {error ? <p className="optimizer-message error" role="alert">{error}</p> : null}
    {importResult ? <section className="mapping-import-result" aria-live="polite">
      <b>Hasil impor</b>
      <span>{importResult.accepted?.length || 0} diterima</span>
      <span>{importResult.rejected?.length || 0} ditolak</span>
      {(importResult.rejected || []).slice(0, 5).map((row) => <small key={`${row.row}-${row.reason}`}>Baris {row.row}: {row.reason}</small>)}
    </section> : null}

    <section className="promoter-admin-list">
      <header><div><span>HASIL PEMETAAN</span><h2>{initialPage.total.toLocaleString('id-ID')} promotor</h2></div><p>Maksimal {initialPage.pageSize} baris per halaman</p></header>
      <div className="promoter-mapping-list">
        {items.map((promoter) => <article key={promoter.code}>
          <div><b>{promoter.name}</b><small>{promoter.code} · {promoter.branchCode || 'Cabang tidak diketahui'} · {promoter.active ? 'Aktif' : 'Nonaktif'}</small><em>{promoter.mappingSource}</em></div>
          <label>Kode wilayah untuk {promoter.code}<input aria-label={`Kode wilayah ${promoter.code}`} value={regionDrafts[promoter.code] || ''} onChange={(event) => setRegionDrafts((current) => ({ ...current, [promoter.code]: event.target.value }))} placeholder="32.04, 32.73" /></label>
          <button type="button" onClick={() => void saveMapping(promoter.code, promoter.name)} disabled={saving === promoter.code}>{saving === promoter.code ? 'Menyimpan…' : 'Simpan mapping'}</button>
        </article>)}
      </div>
      {!items.length ? <p className="lead-empty">Tidak ada promotor untuk filter ini.</p> : null}
      {initialPage.totalPages > 1 ? <nav className="promoter-pagination" aria-label="Paginasi admin promotor">
        {initialPage.page > 1 ? <a href={createAdminHref(query, initialPage.page - 1)}>← Sebelumnya</a> : <span aria-disabled="true">← Sebelumnya</span>}
        <p>Halaman <b>{initialPage.page}</b> dari <b>{initialPage.totalPages}</b></p>
        {initialPage.page < initialPage.totalPages ? <a href={createAdminHref(query, initialPage.page + 1)}>Berikutnya →</a> : <span aria-disabled="true">Berikutnya →</span>}
      </nav> : null}
    </section>

    <section className="promoter-coverage-form">
      <header><span>OVERRIDE BERBASIS BUKTI</span><h2>Cakupan layanan wilayah</h2><p>Gunakan hanya bila tim mempunyai bukti operasional yang dapat diverifikasi.</p></header>
      <form onSubmit={saveCoverage}>
        <label>Kode wilayah layanan<input value={coverage.regionCode} onChange={(event) => setCoverage((current) => ({ ...current, regionCode: event.target.value }))} placeholder="32.04" required /></label>
        <label>Status cakupan<select value={coverage.serviceable} onChange={(event) => setCoverage((current) => ({ ...current, serviceable: event.target.value }))}><option value="true">Dapat dilayani</option><option value="false">Tidak dapat dilayani</option></select></label>
        <label className="coverage-evidence">Catatan bukti<textarea value={coverage.evidenceNote} onChange={(event) => setCoverage((current) => ({ ...current, evidenceNote: event.target.value }))} minLength={coverage.serviceable === 'true' ? 10 : undefined} maxLength={500} placeholder="Jelaskan bukti promotor aktif atau operasi layanan." /></label>
        <button type="submit" disabled={saving === 'coverage'}>{saving === 'coverage' ? 'Menyimpan…' : 'Simpan cakupan'}</button>
      </form>
    </section>
  </div>;
}

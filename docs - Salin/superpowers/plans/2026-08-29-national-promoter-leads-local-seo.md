# National Promoter, Lead Funnels, and Local SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `konsepstifin.com` consume the national STIFIn promoter source safely, expose a searchable public directory, separate Test and Prospective Promoter leads, and index only locally serviceable pages.

**Architecture:** One server-side promoter adapter owns upstream configuration, sanitization, caching, and stale fallback. PostgreSQL overlays automatic region mapping and supports bulk corrections. Public and admin consumers use this single catalog; two validated lead pipelines and coverage-aware local routes sit on top of it.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, PostgreSQL via `postgres`, Vitest, Testing Library, Wilayah.id, STIFIn server-side API.

**Spec:** `docs/superpowers/specs/2026-08-29-national-promoter-leads-local-seo-design.md`

## Global Constraints

- `konsepstifin.com` menangani website publik, direktori promotor, halaman lokal, formulir lead, dashboard operasional, artikel, katalog, dan pencatatan sumber kampanye.
- `app.konsepstifin.com` tetap menangani checkout SEJOLI, member area, dan affiliate. Source WordPress atau plugin SEJOLI tidak diubah dalam pekerjaan ini.
- Plugin `sejoli-stifin-voucher` hanya menjadi referensi kontrak API STIFIn. Website utama tidak bergantung pada runtime plugin tersebut.
- Materi dalam `KIRIM AI.zip` hanya menjadi referensi pola copywriting. Materi itu bukan sumber fakta STIFIn.
- Seluruh promotor aktif dapat ditemukan di direktori; promotor nonaktif hanya masuk metrik admin.
- Email, telepon, tanggal lahir, PassID, saldo, alamat pribadi, identitas akun, dan riwayat transaksi upstream tidak boleh keluar dari sanitizer.
- `menerimaKunjungan` tidak boleh diasumsikan `true`; UI memakai “Jadwal berdasarkan konfirmasi”.
- Mode nasional tidak boleh membutuhkan kode cabang.
- Fresh cache adalah 15 menit dan stale fallback maksimal 24 jam.
- Halaman kota hanya indexable bila mempunyai promotor aktif terpetakan atau override layanan admin yang terbukti.
- Desa/kelurahan selalu `noindex, follow` pada tahap ini.
- Lead Tes dan Calon Promotor memiliki consent, layanan, pipeline, dan aturan assignment yang berbeda.
- Formula statistik, kelangkaan, urgensi, testimoni, jaminan hasil, klaim kesehatan, klaim penghasilan, dan klaim superioritas hanya boleh dipakai bila tersedia bukti yang dapat diverifikasi.
- Jangan mengubah plugin voucher atau source WordPress/SEJOLI.

---

### Task 1: Restore the Automated Test Harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Replace: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `src/lib/promoter-domain.test.ts`

**Interfaces:**
- Consumes: current TypeScript aliases from `tsconfig.json`.
- Produces: `npm test`, `npm run test:watch`, and a jsdom setup usable by all later tasks.

- [ ] **Step 1: Install the existing production dependencies and read the bundled Next.js 16 guides before code changes**

Run:

```bash
npm ci
find node_modules/next/dist/docs -type f | rg 'app|route|metadata|caching' | head -40
```

Read the matching App Router, Route Handler, metadata, and caching guides under `node_modules/next/dist/docs/`. Expected: `npm ci` succeeds and the versioned documentation is available locally.

- [ ] **Step 2: Add the test dependencies and scripts**

Run:

```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Set the scripts in `package.json` to include:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Replace the tombstone configuration with a real Vitest configuration**

```ts
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    environmentMatchGlobs: [['src/**/*.test.tsx', 'jsdom']],
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add one harness characterization test and verify RED**

Add to `src/lib/promoter-domain.test.ts`:

```ts
it('never exposes an upstream email field', () => {
  const [result] = sanitizePromoterRows([{ KodeID: 'P-1', Nama: 'Aman', Email: 'secret@example.com', Aktif: 1 }]);
  expect(result).not.toHaveProperty('email');
});
```

Run:

```bash
npm test -- src/lib/promoter-domain.test.ts
```

Expected before the config/dependencies are complete: FAIL because the old Vitest tombstone cannot load the suite. Expected after Steps 2-3: PASS.

- [ ] **Step 5: Record the pre-feature baseline without weakening tests**

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
```

Expected: promoter domain tests pass; stale UI/store tests may fail because the current source and tests have diverged. Record those exact failures in the task notes, and do not delete a test merely because it fails.

- [ ] **Step 6: Commit the harness**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/lib/promoter-domain.test.ts
git commit -m "test: restore vitest harness"
```

---

### Task 2: Consolidate and Harden the National Promoter Adapter

**Files:**
- Modify: `src/lib/promoter-domain.ts`
- Modify: `src/lib/promoter-domain.test.ts`
- Modify: `src/lib/promoter-source.ts`
- Modify: `src/lib/promoter-source.test.ts`
- Modify: `src/lib/promoter-store.ts`

**Interfaces:**
- Consumes: environment variables listed in the spec.
- Produces: `loadPromoterSnapshot(options?): Promise<PromoterSnapshot>`, `getPromoterSourceStatus(): PromoterSourceStatus`, and the only `PublicPromoter` type used by the app.

- [ ] **Step 1: Write failing sanitizer tests for the final public contract**

Update the expected shape in `src/lib/promoter-domain.test.ts`:

```ts
expect(result).toEqual({
  code: 'PRO-001',
  name: 'Siti Aminah',
  branchCode: 'JML-CAB-62',
  area: 'Kabupaten Bandung',
  province: 'Jawa Barat',
  active: true,
  regionCodes: [],
  mappingSource: 'unresolved',
});
expect(JSON.stringify(result)).not.toMatch(/081234|private@|secret|1990/);
```

Run `npm test -- src/lib/promoter-domain.test.ts`. Expected: FAIL because `mappingSource` is absent and `menerimaKunjungan` still exists.

- [ ] **Step 2: Implement the final domain type and allowlist sanitizer**

Use this contract in `src/lib/promoter-domain.ts`:

```ts
export type MappingSource = 'automatic' | 'manual' | 'unresolved';
export type PublicPromoter = {
  code: string;
  name: string;
  branchCode: string;
  area: string;
  province: string;
  active: boolean;
  regionCodes: string[];
  mappingSource: MappingSource;
};
```

Make `sanitizePromoterRows()` create only these fields. Run the domain test and expect PASS.

- [ ] **Step 3: Write failing national-mode and status tests**

In `src/lib/promoter-source.test.ts`, assert:

```ts
it('uses the national path without branch codes', async () => {
  const fetcher = vi.fn().mockResolvedValue(apiResponse([{ KodeID: 'P-1', Nama: 'Aman', Aktif: 1 }]));
  const snapshot = await loadPromoterSnapshot({
    mode: 'national',
    baseUrl: 'https://apro.stifin.id/api',
    nationalPath: '/proGet/pro/PRO',
    branchCodes: [],
    fetcher,
    now: () => 1_000,
  });
  expect(fetcher).toHaveBeenCalledWith('https://apro.stifin.id/api/proGet/pro/PRO', expect.any(Object));
  expect(snapshot.status).toMatchObject({ source: 'national', safeRows: 1, activeRows: 1, stale: false });
});
```

Also add tests for invalid body shape, HTTP error, 15-minute fresh cache, 24-hour stale cache, absolute HTTPS path, rejected HTTP path, auth header allowlist, 10,000-row limit, and branch mode. Run `npm test -- src/lib/promoter-source.test.ts`. Expected: FAIL because `loadPromoterSnapshot` does not exist.

- [ ] **Step 4: Implement one upstream adapter**

Export these exact types/functions from `src/lib/promoter-source.ts`:

```ts
export type PromoterSourceStatus = {
  configured: boolean;
  mode: 'national' | 'branch' | 'manual' | 'invalid';
  source: 'national' | 'branch' | 'manual' | 'none';
  rawRows: number;
  safeRows: number;
  activeRows: number;
  inactiveRows: number;
  branchCount: number;
  lastSuccessAt: string | null;
  lastHttpStatus: number | null;
  stale: boolean;
  errorCategory: 'configuration' | 'http' | 'timeout' | 'shape' | null;
};

export type PromoterSnapshot = { promoters: PublicPromoter[]; status: PromoterSourceStatus };
export async function loadPromoterSnapshot(options?: SourceOptions): Promise<PromoterSnapshot>;
export function getPromoterSourceStatus(): PromoterSourceStatus;
```

Build URLs through `new URL()`, reject non-HTTPS absolute national paths, fetch with `redirect: 'error'`, sanitize before caching, and cache only `PromoterSnapshot`. Do not cache raw rows.

- [ ] **Step 5: Remove the second upstream implementation from the store**

Change `src/lib/promoter-store.ts` to import `loadPromoterSnapshot` and `PublicPromoter` from the source/domain modules. Remove its direct `fetch`, response parser, mode parser, and duplicated type. Keep PostgreSQL mapping functions temporarily unchanged.

- [ ] **Step 6: Verify the adapter**

Run:

```bash
npm test -- src/lib/promoter-domain.test.ts src/lib/promoter-source.test.ts
npx tsc --noEmit
```

Expected: PASS with no duplicated `PublicPromoter` declaration.

- [ ] **Step 7: Commit the adapter**

```bash
git add src/lib/promoter-domain.ts src/lib/promoter-domain.test.ts src/lib/promoter-source.ts src/lib/promoter-source.test.ts src/lib/promoter-store.ts
git commit -m "fix: use one safe national promoter source"
```

---

### Task 3: Add Automatic Region Mapping and Queryable Catalog

**Files:**
- Modify: `src/lib/wilayah.ts`
- Create: `src/lib/promoter-catalog.ts`
- Create: `src/lib/promoter-catalog.test.ts`
- Modify: `src/lib/promoter-store.ts`
- Create: `src/lib/promoter-store.integration.test.ts`
- Create: `src/lib/service-coverage-store.ts`
- Create: `src/lib/service-coverage-store.integration.test.ts`

**Interfaces:**
- Consumes: `PromoterSnapshot`, Wilayah.id lists, and `public_promoter_regions`.
- Produces: `queryPromoters(query): Promise<PromoterPage>`, `getPromotersForRegion(code): Promise<PublicPromoter[]>`, `getPromoterCatalogStatus(): Promise<CatalogStatus>`, and evidence-backed manual serviceability overrides.

- [ ] **Step 1: Write failing automatic-mapping tests**

Create `src/lib/promoter-catalog.test.ts` with fixtures for West Java/Bandung, Jakarta aliases, ambiguous area names, and missing provinces:

```ts
it('maps a regency only when province and normalized area both match', () => {
  const mapped = applyAutomaticRegionMapping(
    [{ code: 'P-1', name: 'A', branchCode: 'BDG-CAB-1', area: 'Kab. Bandung', province: 'Jawa Barat', active: true, regionCodes: [], mappingSource: 'unresolved' }],
    [{ code: '32', name: 'Jawa Barat', regencies: [{ code: '32.04', name: 'Kabupaten Bandung' }] }],
  );
  expect(mapped[0]).toMatchObject({ regionCodes: ['32.04'], mappingSource: 'automatic' });
});

it('does not guess when the province is empty', () => {
  expect(applyAutomaticRegionMapping([promoter({ area: 'Bandung', province: '' })], fixtures)[0].mappingSource).toBe('unresolved');
});
```

Run `npm test -- src/lib/promoter-catalog.test.ts`. Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement pure catalog mapping and pagination**

Export from `src/lib/promoter-catalog.ts`:

```ts
export type PromoterQuery = {
  q?: string;
  province?: string;
  regency?: string;
  branch?: string;
  mapping?: 'manual' | 'automatic' | 'unresolved';
  page?: number;
  pageSize?: number;
};
export type PromoterPage = {
  items: PublicPromoter[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
export function applyAutomaticRegionMapping(promoters: PublicPromoter[], regions: ProvinceFixture[]): PublicPromoter[];
export function paginatePromoters(promoters: PublicPromoter[], query: PromoterQuery): PromoterPage;
```

Clamp `pageSize` to 24 publicly and 100 in the admin caller. Sort by province, area, name, then code.

- [ ] **Step 3: Add a Wilayah.id catalog loader**

In `src/lib/wilayah.ts`, add:

```ts
export type ProvinceWithRegencies = Wilayah & { regencies: Wilayah[] };
export async function getProvinceRegencyCatalog(): Promise<ProvinceWithRegencies[]> {
  const provinces = await getWilayah('provinces');
  return Promise.all(provinces.map(async (province) => ({
    ...province,
    regencies: await getWilayah('regencies', province.code),
  })));
}
```

- [ ] **Step 4: Write failing PostgreSQL overlay and serviceability tests**

Create integration suites guarded by `TEST_DATABASE_URL`. Assert that manual region codes replace automatic codes, `updated_at` changes on upsert, and unresolved counts are returned. For manual serviceability, assert that an empty evidence note is rejected and that a valid override stores `region_code`, `serviceable`, `evidence_note`, and `updated_at`. Run without a database and expect SKIP; run against the test database in CI and expect FAIL before implementation.

- [ ] **Step 5: Implement store composition**

Use this public store contract:

```ts
export async function queryPromoters(query: PromoterQuery = {}): Promise<PromoterPage>;
export async function getPromotersForRegion(regionCode: string): Promise<PublicPromoter[]>;
export async function getPromoterCatalogStatus(): Promise<{
  source: PromoterSourceStatus;
  mapped: number;
  automatic: number;
  unresolved: number;
  updatedAt: string | null;
}>;
```

Load snapshot, automatic map, then manual overlay. Manual mapping wins even when it is an empty array. Preserve existing mapping data.

Create `src/lib/service-coverage-store.ts` with this contract:

```ts
export type ServiceCoverageOverride = {
  regionCode: string;
  serviceable: boolean;
  evidenceNote: string;
  updatedAt: string;
};
export async function getServiceCoverageOverride(regionCode: string): Promise<ServiceCoverageOverride | null>;
export async function setServiceCoverageOverride(input: { regionCode: string; serviceable: boolean; evidenceNote: string }): Promise<ServiceCoverageOverride>;
```

Persist it in `public_serviceable_regions`. Require a valid regency/district code and an evidence note of 10-500 characters when `serviceable` is true.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- src/lib/promoter-catalog.test.ts src/lib/promoter-store.integration.test.ts src/lib/service-coverage-store.integration.test.ts
npx tsc --noEmit
git add src/lib/wilayah.ts src/lib/promoter-catalog.ts src/lib/promoter-catalog.test.ts src/lib/promoter-store.ts src/lib/promoter-store.integration.test.ts src/lib/service-coverage-store.ts src/lib/service-coverage-store.integration.test.ts
git commit -m "feat: map and query national promoters"
```

Expected: unit PASS, integration PASS when `TEST_DATABASE_URL` exists or SKIP otherwise.

---

### Task 4: Add Safe Public API and Bulk Mapping Operations

**Files:**
- Modify: `src/app/api/promotor/route.ts`
- Create: `src/app/api/promotor/route.test.ts`
- Create: `src/lib/promoter-mapping-csv.ts`
- Create: `src/lib/promoter-mapping-csv.test.ts`
- Modify: `src/app/api/admin/promotor/route.ts`
- Create: `src/app/api/admin/promotor/import/route.ts`
- Create: `src/app/api/admin/promotor/export/route.ts`
- Create: `src/app/api/admin/promotor/coverage/route.ts`

**Interfaces:**
- Consumes: `queryPromoters`, `setPromoterRegionMapping`, and admin authentication.
- Produces: paginated public JSON and authenticated CSV import/export.

- [ ] **Step 1: Write failing public API privacy tests**

Mock the store, call `GET(new NextRequest('http://localhost/api/promotor?q=siti&page=2'))`, and assert:

```ts
expect(body).toEqual({
  data: expect.any(Array),
  meta: { total: 25, page: 2, pageSize: 24, totalPages: 2, updatedAt: expect.any(String) },
});
expect(JSON.stringify(body)).not.toMatch(/source|nationalPath|auth|email|phone|pass/i);
```

Run `npm test -- src/app/api/promotor/route.test.ts`. Expected: FAIL because the route exposes configuration metadata and lacks pagination.

- [ ] **Step 2: Implement the public route**

Accept only `q`, `province`, `regency`, `branch`, and `page`. Return 24 rows per page and public freshness metadata. Keep CORS GET-only and `Cache-Control: public, s-maxage=300, stale-while-revalidate=1800`.

- [ ] **Step 3: Write failing CSV parser tests**

Test valid multi-code rows, unknown promoter codes, invalid region codes, duplicate codes, oversized rows, and spreadsheet formula injection on export:

```ts
expect(parsePromoterMappingCsv('promoter_code,region_codes\nP-1,"32.04;32.73"')).toEqual({
  accepted: [{ promoterCode: 'P-1', regionCodes: ['32.04', '32.73'] }],
  rejected: [],
});
expect(csvCell('=HYPERLINK("bad")')).toBe("'=HYPERLINK(\"bad\")");
```

Run `npm test -- src/lib/promoter-mapping-csv.test.ts`. Expected: FAIL because the module does not exist.

- [ ] **Step 4: Implement deterministic CSV helpers**

Export:

```ts
export type MappingImportResult = {
  accepted: Array<{ promoterCode: string; regionCodes: string[] }>;
  rejected: Array<{ row: number; reason: string }>;
};
export function parsePromoterMappingCsv(input: string): MappingImportResult;
export function renderPromoterMappingCsv(rows: Array<{ promoterCode: string; regionCodes: string[] }>): string;
```

Limit input to 2 MB, 10,000 rows, 80 characters for promoter code, and 200 region codes per promoter.

- [ ] **Step 5: Add authenticated import/export routes**

`POST /api/admin/promotor/import` accepts `text/csv`, validates all promoter codes against the safe catalog and every region code against Wilayah.id, then upserts accepted rows in a transaction. Return `{accepted, rejected}`. `GET /api/admin/promotor/export` returns `text/csv; charset=utf-8` with `Content-Disposition: attachment`. `POST /api/admin/promotor/coverage` validates `{regionCode, serviceable, evidenceNote}` and writes the manual serviceability override.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- src/app/api/promotor/route.test.ts src/lib/promoter-mapping-csv.test.ts
npx tsc --noEmit
git add src/app/api/promotor src/app/api/admin/promotor src/lib/promoter-mapping-csv.ts src/lib/promoter-mapping-csv.test.ts
git commit -m "feat: expose promoter search and mapping csv"
```

---

### Task 5: Build the Searchable Directory and Mapping Dashboard

**Files:**
- Modify: `src/app/promotor/page.tsx`
- Create: `src/app/promotor/promoter-directory.test.tsx`
- Modify: `src/app/admin/promotor/page.tsx`
- Replace: `src/app/admin/promotor/promoter-manager.tsx`
- Delete: `src/app/admin/promotor/promoter-region-manager.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `queryPromoters()`, `getPromoterCatalogStatus()`, public query parameters, and CSV endpoints.
- Produces: a 24-row public directory and a searchable admin mapping workspace.

- [ ] **Step 1: Write failing directory rendering tests**

Extract the list UI to an exported view or render the page with mocked store data. Assert one card shows only:

```tsx
expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
expect(screen.getByText(/KodeID P-1/)).toBeInTheDocument();
expect(screen.getByText(/Jadwal berdasarkan konfirmasi/)).toBeInTheDocument();
expect(screen.queryByText(/menerima kunjungan/i)).not.toBeInTheDocument();
expect(screen.getAllByRole('article')).toHaveLength(24);
```

Run `npm test -- src/app/promotor/promoter-directory.test.tsx`. Expected: FAIL before the paginated view exists.

- [ ] **Step 2: Implement server-side search, filters, canonical, and pagination**

Read `searchParams: Promise<Record<string, string | string[] | undefined>>`, normalize each value, and call `queryPromoters`. Add a GET form for name/KodeID, province, regency, and branch. All filtered pages emit `robots: noindex, follow` and canonical `/promotor`; the unfiltered page remains indexable.

- [ ] **Step 3: Replace the admin manager with filter and CSV controls**

The client manager receives:

```ts
type PromoterManagerProps = {
  initialPage: PromoterPage;
  status: CatalogStatus;
  provinces: Wilayah[];
};
```

It provides debounced search, mapping filter, one-row edit, import file picker, import summary, export link, and a manual serviceability form that requires an evidence note. It must never load all 4,000+ cards into the DOM.

- [ ] **Step 4: Add responsive styles**

Add scoped classes for `.promoter-search`, `.promoter-pagination`, `.promoter-card-meta`, `.promoter-admin-toolbar`, and `.mapping-import-result`. At 720 px or below, controls stack and cards remain one column without horizontal scrolling.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- src/app/promotor/promoter-directory.test.tsx
npm run lint
npx tsc --noEmit
git add src/app/promotor src/app/admin/promotor src/app/globals.css
git commit -m "feat: add searchable national promoter directory"
```

---

### Task 6: Model and Persist Two Lead Funnels

**Files:**
- Modify: `src/lib/interest-store.ts`
- Replace: `src/lib/interest-store.test.ts`
- Modify: `src/lib/interest-store.integration.test.ts`
- Modify: `src/lib/interest-service.ts`
- Replace: `src/lib/interest-service.test.ts`

**Interfaces:**
- Consumes: validated public form data and promoter matcher.
- Produces: `LeadType`, per-type status guards, UTM-safe `InterestInput`, idempotent persistence, and type-specific lead creation.

- [ ] **Step 1: Write failing domain tests for both lead types**

Use these contracts in tests:

```ts
expect(validateInterestInput({ ...testLead, leadType: 'tes', consentToShare: false }))
  .toThrow('Persetujuan pembagian terbatas');
expect(validateInterestInput({ ...promoterLead, leadType: 'calon_promotor', consentToShare: false }))
  .toMatchObject({ leadType: 'calon_promotor', consentToShare: false });
expect(() => validateLeadAdminUpdate({ leadType: 'calon_promotor', status: 'dijadwalkan' }))
  .toThrow('Status tidak sesuai');
expect(sanitizeCampaignValue('  meta<script>  ')).toBe('metascript');
```

Run `npm test -- src/lib/interest-store.test.ts`. Expected: FAIL because `leadType` and campaign fields do not exist.

- [ ] **Step 2: Implement exact lead contracts**

```ts
export type LeadType = 'tes' | 'calon_promotor';
export const testLeadStatuses = ['baru', 'mencari_promotor', 'ditawarkan', 'diklaim', 'dijadwalkan', 'selesai', 'ditutup'] as const;
export const promoterLeadStatuses = ['baru', 'dihubungi', 'konsultasi', 'mengikuti_preview', 'mengikuti_wsl', 'aktivasi', 'selesai', 'ditutup'] as const;
export type LeadStatus = typeof testLeadStatuses[number] | typeof promoterLeadStatuses[number];
```

Extend `InterestInput` with `leadType`, `productKey`, five UTM fields, `referrer`, and conditional consent validation. Keep current phone, length, honeypot, and timing rules.

- [ ] **Step 3: Write failing migration/backfill integration tests**

Create legacy rows for a Tes service, WSL service, and unknown service. Run schema initialization and assert:

```ts
expect(rowsByService['Tes STIFIn Personal'].lead_type).toBe('tes');
expect(rowsByService['WSL 1'].lead_type).toBe('calon_promotor');
expect(rowsByService['Layanan lama'].lead_type).toBe('tes');
expect(rowsByService['Layanan lama'].internal_notes).toContain('Backfill');
```

Expected: FAIL before migration.

- [ ] **Step 4: Implement idempotent migration and mapping**

Add columns with `ADD COLUMN IF NOT EXISTS`: `lead_type`, `product_key`, five UTM fields, `referrer`, `pic`, `match_method`, `matched_promoter_name`, and `matched_branch_code`. Backfill promoter services using the known product keys `previewPromotor`, `wsl1`, `wsl2`, `idDanAlat`, and `paketPromotor`. Do not delete or rewrite history rows.

Extend `lead_status_history` idempotently with `event_type TEXT NOT NULL DEFAULT 'status_change'` and `details JSONB NOT NULL DEFAULT '{}'::jsonb`. Every admin update records the changed fields in `details`; it must never copy phone, email, or full public-form payloads into history.

- [ ] **Step 5: Restore a real interest service**

Replace the compatibility tombstone with:

```ts
export async function submitInterest(
  payload: unknown,
  dependencies: { findPromoters: typeof getPromotersForRegion; createLead: typeof createInterestLead },
): Promise<{ lead: StoredLead; match: PromoterMatch | null }>;
```

For `tes`, match and snapshot up to three candidates. For `calon_promotor`, do not query promoters and return `match: null`.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- src/lib/interest-store.test.ts src/lib/interest-service.test.ts src/lib/interest-store.integration.test.ts
npx tsc --noEmit
git add src/lib/interest-store.ts src/lib/interest-store.test.ts src/lib/interest-store.integration.test.ts src/lib/interest-service.ts src/lib/interest-service.test.ts
git commit -m "feat: separate test and promoter lead pipelines"
```

---

### Task 7: Split the Public Forms and Preserve Campaign Attribution

**Files:**
- Modify: `src/app/public-interest-action.tsx`
- Replace: `src/app/public-interest-action.test.tsx`
- Modify: `src/app/api/interests/route.ts`
- Create: `src/app/api/interests/route.test.ts`
- Modify: `src/app/tes-stifin/page.tsx`
- Modify: `src/app/jadi-promotor/page.tsx`

**Interfaces:**
- Consumes: `submitInterest`, `LeadType`, product keys, current URL parameters.
- Produces: type-specific modal fields/consent and a 201 response containing only lead reference/status plus safe matching information.

- [ ] **Step 1: Write failing form tests**

Test the two variants:

```tsx
render(<PublicInterestAction leadType="tes" linkKey="tesPersonal" label="Tes" service="Tes STIFIn Personal" />);
expect(await screen.findByText(/dibagikan kepada promotor yang ditugaskan/i)).toBeInTheDocument();

render(<PublicInterestAction leadType="calon_promotor" linkKey="wsl1" label="WSL" service="WSL 1" />);
expect(screen.queryByText(/dibagikan kepada promotor yang ditugaskan/i)).not.toBeInTheDocument();
expect(screen.getByRole('option', { name: 'Tes STIFIn Personal' })).not.toBeInTheDocument();
```

Add a test that `utm_source`, `utm_campaign`, and `document.referrer` appear in the POST body. Run the test and expect FAIL.

- [ ] **Step 2: Implement the type-specific modal**

Make `leadType` required. Define fixed service arrays keyed by lead type. Read only the five `utm_*` keys from `window.location.search`; cap client-side values at 120 characters. Preserve direct checkout behavior, but any button marked `captureLead` must save first.

- [ ] **Step 3: Write failing route tests**

Assert a Test lead invokes matching, a Prospective Promoter lead does not, rate limiting returns 429, fast submission returns 400, and no checkout URL outside `app.konsepstifin.com` is returned.

- [ ] **Step 4: Implement the route through the service**

The route validates timing/honeypot/rate limit, calls `submitInterest`, and returns:

```ts
{
  ok: true,
  reference: `KSF-${lead.id}`,
  status: lead.status,
  match: lead.leadType === 'tes' ? safeMatch : null,
}
```

Do not return PII or upstream status.

- [ ] **Step 5: Wire both landing pages**

All Tes page actions pass `leadType="tes"`. Preview/WSL/ID/Paket actions pass `leadType="calon_promotor"`. Affiliate actions are unchanged.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- src/app/public-interest-action.test.tsx src/app/api/interests/route.test.ts
npm run lint
npx tsc --noEmit
git add src/app/public-interest-action.tsx src/app/public-interest-action.test.tsx src/app/api/interests src/app/tes-stifin/page.tsx src/app/jadi-promotor/page.tsx
git commit -m "feat: capture two public lead funnels"
```

---

### Task 8: Separate the Admin Pipelines

**Files:**
- Modify: `src/app/admin/leads/page.tsx`
- Replace: `src/app/admin/leads/lead-manager.tsx`
- Replace: `src/app/admin/leads/lead-manager.test.tsx`
- Modify: `src/app/api/admin/leads/[id]/route.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `StoredLead`, per-type status arrays, safe promoter candidates, admin update validation.
- Produces: two tabs, type-valid status changes, filters, attribution/history details, and PIC assignment.

- [ ] **Step 1: Write failing dashboard tests**

Create one Test and one Prospective Promoter fixture. Assert:

```tsx
expect(screen.getByRole('tab', { name: /Tes/ })).toHaveAttribute('aria-selected', 'true');
expect(screen.queryByText('Calon WSL')).not.toBeInTheDocument();
await userEvent.click(screen.getByRole('tab', { name: /Calon Promotor/ }));
expect(screen.getByText('Calon WSL')).toBeInTheDocument();
expect(screen.getByRole('option', { name: 'Mengikuti Preview' })).toBeInTheDocument();
expect(screen.queryByRole('option', { name: 'Dijadwalkan' })).not.toBeInTheDocument();
```

Run the test and expect FAIL.

- [ ] **Step 2: Implement tabs, filters, and details**

Add filters for status, province, service, source campaign, and date. The Test detail shows candidate/match data and assigned promoter. The Prospective Promoter detail shows PIC and recruitment stage. Both show consent timestamp, source path, UTM, referrer, response deadline, and history.

- [ ] **Step 3: Enforce status/type on the admin endpoint**

Call `validateLeadAdminUpdate` using the stored lead type, not a client-supplied type. Reject invalid transitions with 400 and never change the row on failure.

- [ ] **Step 4: Add responsive admin styles**

Keep PII inside authenticated pages. At mobile width, summary cards and detail forms stack; phone numbers do not overflow.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- src/app/admin/leads/lead-manager.test.tsx src/lib/interest-store.test.ts
npm run lint
npx tsc --noEmit
git add src/app/admin/leads src/app/api/admin/leads src/app/globals.css
git commit -m "feat: split admin lead pipelines"
```

---

### Task 9: Add Coverage-Aware Local Pages and Stable Sitemaps

**Files:**
- Create: `src/lib/local-seo.ts`
- Create: `src/lib/local-seo.test.ts`
- Modify: `src/lib/service-coverage-store.ts`
- Create: `src/app/tes-stifin/[city]/page.tsx`
- Create: `src/app/promotor-stifin/[city]/page.tsx`
- Modify: `src/app/wilayah/[...segments]/page.tsx`
- Modify: `src/lib/seo-sitemaps.ts`
- Create: `src/lib/seo-sitemaps.test.ts`
- Modify: `src/app/sitemaps/regions.xml/route.ts`
- Modify: `src/app/sitemaps/promoters.xml/route.ts`
- Modify: `src/app/sitemap-index.xml/route.ts`

**Interfaces:**
- Consumes: region catalog, promoter coverage, product updated dates, manual service overrides.
- Produces: `resolveLocalPage(slug)`, `getIndexableRegions()`, stable `lastModified`, and intent-specific city routes.

- [ ] **Step 1: Write failing indexability tests**

```ts
expect(localPagePolicy({ level: 'regencies', activePromoters: 1, manualServiceable: false })).toEqual({ index: true, follow: true });
expect(localPagePolicy({ level: 'regencies', activePromoters: 0, manualServiceable: false })).toEqual({ index: false, follow: true });
expect(localPagePolicy({ level: 'villages', activePromoters: 4, manualServiceable: true })).toEqual({ index: false, follow: true });
```

Run `npm test -- src/lib/local-seo.test.ts`. Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement local page resolution**

Export:

```ts
export type LocalPageData = {
  province: Wilayah;
  regency: Wilayah;
  promoters: PublicPromoter[];
  indexable: boolean;
  updatedAt: string | null;
};
export async function resolveLocalPage(citySlug: string): Promise<LocalPageData | null>;
export function localPagePolicy(input: { level: WilayahLevel; activePromoters: number; manualServiceable: boolean }): Metadata['robots'];
```

The slug is the canonical Wilayah slug plus code suffix, for example `kota-medan-12-71`; redirects from a bare `medan` slug are allowed only when the name resolves uniquely.

- [ ] **Step 3: Build both city routes**

`/tes-stifin/[city]` emphasizes service/process and uses a prefilled Test lead CTA. `/promotor-stifin/[city]` emphasizes verified directory coverage and links to the same safe form. Both share local data and render visible content matching `Service`, `BreadcrumbList`, and `FAQPage` JSON-LD. `resolveLocalPage` reads `getServiceCoverageOverride`; an override makes the page indexable only when `serviceable=true` and a non-empty evidence note is stored.

- [ ] **Step 4: Canonicalize administrative pages**

For a resolved city, `/wilayah/{province}/{regency}` sets canonical to `/tes-stifin/{city}`. Province pages remain navigational. Districts follow the coverage policy; villages are always noindex.

- [ ] **Step 5: Write failing stable-sitemap tests**

Call sitemap builders twice with different fake current times and the same stored updates:

```ts
expect(second).toEqual(first);
expect(first.map((entry) => entry.url)).not.toContain('https://konsepstifin.com/tes-stifin/kota-tanpa-cakupan');
```

Expected: FAIL because current code uses `new Date()` per request and includes all provinces/regencies.

- [ ] **Step 6: Implement coverage-only sitemaps**

Generate only indexable Test and Promoter city URLs plus directly covered districts. Derive `lastModified` from mapping/product/source timestamps. Remove the promoter-profile sitemap concept; `/sitemaps/promoters.xml` contains the directory and indexable `/promotor-stifin/[city]` pages only. The sitemap index uses each child sitemap's stable maximum timestamp.

- [ ] **Step 7: Verify and commit**

```bash
npm test -- src/lib/local-seo.test.ts src/lib/seo-sitemaps.test.ts
npm run lint
npx tsc --noEmit
git add src/lib/local-seo.ts src/lib/local-seo.test.ts src/lib/seo-sitemaps.ts src/lib/seo-sitemaps.test.ts src/app/tes-stifin src/app/promotor-stifin src/app/wilayah src/app/sitemaps src/app/sitemap-index.xml
git commit -m "feat: publish coverage-aware local pages"
```

---

### Task 10: Apply Evidence-Safe Copy and Production Configuration

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/tes-stifin/page.tsx`
- Modify: `src/app/jadi-promotor/page.tsx`
- Modify: `src/app/promotor/page.tsx`
- Modify: `src/app/site-config.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Create: `PANDUAN_PROMOTOR_NASIONAL_DAN_LEAD.md`

**Interfaces:**
- Consumes: final public routes, two lead types, and source status.
- Produces: consistent funnel copy and exact Coolify environment/verification instructions.

- [ ] **Step 1: Create a copy checklist from the approved source rules**

For each page, record one audience, one problem, one supported benefit, one real-life context, one primary CTA, and one secondary CTA. Use this exact acceptance list in the PR notes:

```text
Homepage: choose Tes or Calon Promotor
Tes: understand process and find a serviceable city
Calon Promotor: understand stages before checkout
Directory: find an active promoter without exposing contact data
```

- [ ] **Step 2: Rewrite only unsupported or unfocused sections**

Use Feature -> Benefit -> Real-life context. Remove or qualify any unsupported statistics, urgency, income promise, medical implication, or “official” claim not established by repository evidence. Keep checkout prices sourced from `getPublicManagedProducts`; do not hardcode a second public price source.

- [ ] **Step 3: Correct the national environment example**

Use:

```env
STIFIN_API_BASE=https://apro.stifin.id/api
STIFIN_PROMOTER_MODE=national
STIFIN_PROMOTER_NATIONAL_PATH=/proGet/pro/PRO
STIFIN_API_TIMEOUT_MS=15000
```

Document branch/manual examples separately and mark auth values as secrets stored only in Coolify.

- [ ] **Step 4: Write the operations guide**

`PANDUAN_PROMOTOR_NASIONAL_DAN_LEAD.md` must include: deployment environment, API status checks, expected public privacy fields, stale-cache meaning, mapping CSV format, rollback trigger, lead pipeline definitions, sitemap checks, and exact post-deploy smoke tests.

- [ ] **Step 5: Verify content and commit**

Run:

```bash
rg -n -i "dijamin|pasti berhasil|nomor 1|9 dari 10|diagnosis|penghasilan otomatis|menerima kunjungan" src/app README.md PANDUAN_PROMOTOR_NASIONAL_DAN_LEAD.md
npm run lint
npx tsc --noEmit
git add src/app/page.tsx src/app/tes-stifin/page.tsx src/app/jadi-promotor/page.tsx src/app/promotor/page.tsx src/app/site-config.ts .env.example README.md PANDUAN_PROMOTOR_NASIONAL_DAN_LEAD.md
git commit -m "docs: align national funnel copy and operations"
```

Expected: every match is either removed or explicitly justified by visible context.

---

### Task 11: Full Verification and Deployment Handoff

**Files:**
- Modify if required by verified failures: files changed in Tasks 1-10 only
- Create: `docs/verification/2026-08-29-national-promoter-leads-local-seo.md`

**Interfaces:**
- Consumes: the complete implementation.
- Produces: reproducible verification evidence and a deployment-ready detached-HEAD commit.

- [ ] **Step 1: Run the complete automated suite**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all commands exit 0 with no unhandled warnings.

- [ ] **Step 2: Run privacy and route smoke checks against the production build**

Start the app with test-safe environment values, then verify:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS 'http://127.0.0.1:3000/api/promotor?page=1'
curl -fsS http://127.0.0.1:3000/sitemap-index.xml
```

Assert the health endpoint is healthy, promoter JSON lacks `Email`, `Phone`, `PassID`, `TglLahir`, and `Saldo`, and sitemap URLs correspond only to covered regions.

- [ ] **Step 3: Verify Docker healthcheck**

```bash
docker build -t konsepstifin-national:test .
docker run --name konsepstifin-national-test -d -p 3300:3000 --env-file .env.test konsepstifin-national:test
docker inspect --format '{{.State.Health.Status}}' konsepstifin-national-test
```

Expected after the Dockerfile start period: `healthy`. Stop and remove only the explicitly named test container after recording results.

- [ ] **Step 4: Verify responsive public and admin stories in a browser**

Check desktop and mobile widths for `/`, `/tes-stifin`, `/jadi-promotor`, `/promotor`, one covered local Test route, one covered Promoter route, `/admin/promotor`, and `/admin/leads`. Confirm no horizontal overflow, correct noindex/canonical metadata, working pagination, correct consent, and separated admin statuses.

- [ ] **Step 5: Write the verification report**

Record commit, commands, exit codes, test totals, skipped integration tests, upstream mode, safe field sample, checked routes, Docker health, and any environment-only limitation. Do not write secrets or lead PII.

- [ ] **Step 6: Commit verification evidence**

```bash
git add docs/verification/2026-08-29-national-promoter-leads-local-seo.md
git commit -m "test: verify national promoter and lead release"
git status --short
git log --oneline 6e486d1..HEAD
```

Expected: clean worktree and a linear commit series after `6e486d1`. Because the workspace is detached HEAD, hand off through the App’s **Create branch** control or transfer the commit series to the user’s repository; do not push automatically.

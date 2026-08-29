import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

suite('interest-store PostgreSQL integration', () => {
  const sql = postgres(databaseUrl || 'postgres://invalid:invalid@127.0.0.1:1/invalid');
  const key = '123e4567-e89b-42d3-a456-426614174001';
  let store: typeof import('./interest-store');

  beforeAll(async () => {
    vi.stubEnv('DATABASE_URL', databaseUrl);
    store = await import('./interest-store');
    await sql`CREATE TABLE IF NOT EXISTS public_interest_leads (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL DEFAULT '',
      service TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', source_path TEXT NOT NULL DEFAULT '/',
      status TEXT NOT NULL DEFAULT 'baru', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  });
  afterAll(async () => {
    await sql`DELETE FROM public_interest_leads WHERE idempotency_key=${key} OR name LIKE 'Backfill Test %'`;
    await sql.end();
  });

  it('memigrasikan layanan lama ke dua funnel secara idempoten', async () => {
    await sql`INSERT INTO public_interest_leads (name, phone, city, service, notes, source_path, status)
      VALUES
      ('Backfill Test Tes', '628100000001', 'Bandung', 'Tes STIFIn Personal', '', '/', 'baru'),
      ('Backfill Test WSL', '628100000002', 'Bandung', 'WSL 1', '', '/', 'baru'),
      ('Backfill Test Unknown', '628100000003', 'Bandung', 'Layanan lama', '', '/', 'baru')`;
    await store.initializeInterestSchema();
    const rows = await sql`SELECT service, lead_type, internal_notes FROM public_interest_leads WHERE name LIKE 'Backfill Test %'`;
    const rowsByService = Object.fromEntries(rows.map((row) => [String(row.service), row]));

    expect(rowsByService['Tes STIFIn Personal'].lead_type).toBe('test_service');
    expect(rowsByService['WSL 1'].lead_type).toBe('promoter_candidate');
    expect(rowsByService['Layanan lama'].lead_type).toBe('test_service');
    expect(rowsByService['Layanan lama'].internal_notes).toContain('Backfill');
  });

  it('memigrasikan tabel lama dan insert idempoten', async () => {
    const input = { interest: store.validateInterestInput({ name: 'Integration Test', phone: '081234567890', email: 'integration@example.com', provinceCode: '32', provinceName: 'Jawa Barat', regencyCode: '32.04', regencyName: 'Kabupaten Bandung', city: 'Bandung', service: 'Tes STIFIn Personal', productKey: 'tesPersonal', notes: '', sourcePath: '/tes-stifin', consentToContact: true, consentToShare: true }), idempotencyKey: key, status: 'ditawarkan' as const, match: { matchMethod: 'area' as const, assignedPromoterCode: 'P-1', matchedPromoterName: 'Promotor Aman', matchedBranchCode: 'BDG-CAB-1' } };
    const first = await store.createInterestLead(input); const second = await store.createInterestLead(input);
    expect(second.id).toBe(first.id);
    const rows = await sql`SELECT * FROM public_interest_leads WHERE idempotency_key=${key}`;
    expect(rows).toHaveLength(1); expect(rows[0].matched_promoter_name).toBe('Promotor Aman');
  });

  it('mencatat audit pembayaran tanpa kolom margin', async () => {
    const lead = await store.getLeadByIdempotencyKey(key);
    await store.updateLead(lead!.id, { status: 'diklaim', assignedPromoterCode: 'P-2', scheduledAt: null, internalNotes: 'Dikonfirmasi melalui WhatsApp', paymentStatus: 'dibayar', sejoliOrderId: 'ORD-100', saleAmount: 650001, promoterPayout: 500000, otherCost: 25000 }, 'admin@example.com');
    const history = await sql`SELECT event_type, details FROM lead_status_history WHERE lead_id=${lead!.id} ORDER BY id DESC LIMIT 1`;
    expect(history[0].event_type).toBe('admin_update'); expect(history[0].details.paymentStatus).toEqual({ from: 'belum_dicek', to: 'dibayar' });
    const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='public_interest_leads'`;
    expect(columns.map((row) => row.column_name)).not.toContain('margin');
  });
});

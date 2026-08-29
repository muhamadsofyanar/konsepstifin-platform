// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LeadManager from './lead-manager';
import type { StoredLead } from '@/lib/interest-store';

function lead(overrides: Partial<StoredLead>): StoredLead {
  return {
    id: 42,
    leadType: 'test_service',
    productKey: 'tesPersonal',
    name: 'Budi Tes',
    phone: '6281234567890',
    email: 'budi@example.com',
    provinceCode: '32',
    provinceName: 'Jawa Barat',
    regencyCode: '32.04',
    regencyName: 'Kabupaten Bandung',
    city: 'Bandung',
    service: 'Tes STIFIn Personal',
    notes: 'Sabtu pagi',
    sourcePath: '/tes-stifin',
    utmSource: 'meta',
    utmMedium: 'paid_social',
    utmCampaign: 'launch',
    utmContent: 'hero',
    utmTerm: '',
    referrer: 'https://example.com/article',
    consentToContact: true,
    consentToShare: true,
    status: 'ditawarkan',
    assignedPromoterCode: 'P-1',
    pic: '',
    matchMethod: 'area',
    matchedPromoterName: 'Promotor Aman',
    matchedBranchCode: 'BDG-CAB-1',
    promoterCandidates: [{ code: 'P-1', name: 'Promotor Aman', branchCode: 'BDG-CAB-1', area: 'Bandung', province: 'Jawa Barat' }],
    paymentStatus: 'belum_dicek',
    sejoliOrderId: '',
    saleAmount: 0,
    promoterPayout: 0,
    otherCost: 0,
    margin: 0,
    scheduledAt: null,
    paymentCheckedAt: null,
    internalNotes: '',
    responseDueAt: new Date(Date.now() - 60_000).toISOString(),
    consentAt: new Date(0).toISOString(),
    idempotencyKey: '123e4567-e89b-42d3-a456-426614174000',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

const testLead = lead({});
const promoterLead = lead({
  id: 43,
  leadType: 'promoter_candidate',
  productKey: 'wsl1',
  name: 'Calon WSL',
  service: 'WSL 1',
  consentToShare: false,
  status: 'konsultasi',
  assignedPromoterCode: '',
  pic: 'Tim Rekrutmen',
  matchMethod: 'none',
  matchedPromoterName: '',
  matchedBranchCode: '',
  promoterCandidates: [],
});

describe('LeadManager', () => {
  afterEach(() => cleanup());

  it('memisahkan tab dan pilihan status untuk kedua pipeline', async () => {
    render(<LeadManager databaseReady initialLeads={[testLead, promoterLead]} initialError="" initialHistories={{ 43: [] }} />);
    expect(screen.getByRole('tab', { name: /Tes/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Calon WSL')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Calon Promotor/ }));
    expect(screen.getByText('Calon WSL')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Ref. KSF-43/i }));
    expect(screen.getByRole('option', { name: 'Mengikuti Preview' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Dijadwalkan' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('PIC')).toHaveValue('Tim Rekrutmen');
    expect(screen.queryByLabelText('Status pembayaran')).not.toBeInTheDocument();
  });

  it('menampilkan attribution, kandidat, riwayat, dan menghitung margin', async () => {
    render(<LeadManager databaseReady initialLeads={[testLead, promoterLead]} initialError="" initialHistories={{
      42: [{ id: 1, oldStatus: 'mencari_promotor', newStatus: 'ditawarkan', note: 'Kandidat ditemukan', actor: 'system', eventType: 'status_change', details: {}, createdAt: new Date(0).toISOString() }],
    }} />);
    await userEvent.click(screen.getByRole('button', { name: /Ref. KSF-42/i }));
    expect(screen.getByText('Promotor Aman')).toBeInTheDocument();
    expect(screen.getByText(/meta · paid_social · launch/i)).toBeInTheDocument();
    expect(screen.getByText('Kandidat ditemukan')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nilai penjualan'), { target: { value: '650001' } });
    fireEvent.change(screen.getByLabelText('Bagian promotor'), { target: { value: '500000' } });
    fireEvent.change(screen.getByLabelText('Biaya lain'), { target: { value: '25000' } });
    expect(screen.getByText((value) => value.replace(/\s/g, '') === 'Rp125.001')).toBeInTheDocument();
  });

  it('mengirim assignment, pembayaran, margin input, dan catatan internal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, lead: { ...testLead, paymentStatus: 'dibayar', sejoliOrderId: 'ORD-100' } }), { status: 200 })));
    render(<LeadManager databaseReady initialLeads={[testLead]} initialError="" initialHistories={{ 42: [] }} />);
    await userEvent.click(screen.getByRole('button', { name: /Ref. KSF-42/i }));
    await userEvent.selectOptions(screen.getByLabelText('Status pembayaran'), 'dibayar');
    fireEvent.change(screen.getByLabelText('ID order SEJOLI'), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText('Nilai penjualan'), { target: { value: '650001' } });
    fireEvent.change(screen.getByLabelText('Catatan internal'), { target: { value: 'Pembayaran dikonfirmasi.' } });
    await userEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

    expect(fetch).toHaveBeenCalledWith('/api/admin/leads/42', expect.objectContaining({
      method: 'PATCH',
      body: expect.stringContaining('"sejoliOrderId":"ORD-100"'),
    }));
    expect(String((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body)).toContain('"internalNotes":"Pembayaran dikonfirmasi."');
  });
});

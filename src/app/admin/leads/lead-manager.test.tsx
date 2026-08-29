// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LeadManager from './lead-manager';
import type { StoredLead } from '@/lib/interest-store';

const lead = { id: 42, name: 'Budi', phone: '6281234567890', email: 'budi@example.com', provinceCode: '32', provinceName: 'Jawa Barat', regencyCode: '32.04', regencyName: 'Kabupaten Bandung', city: 'Bandung', service: 'Tes STIFIn Personal', productKey: 'tesPersonal', notes: '', sourcePath: '/tes-stifin', consentToContact: true, consentToShare: true, status: 'ditawarkan', assignedPromoterCode: 'P-1', matchMethod: 'area', matchedPromoterName: 'Promotor Aman', matchedBranchCode: 'BDG-CAB-1', paymentStatus: 'belum_dicek', sejoliOrderId: '', saleAmount: 0, promoterPayout: 0, otherCost: 0, margin: 0, scheduledAt: null, paymentCheckedAt: null, internalNotes: '', responseDueAt: new Date(0).toISOString(), consentAt: new Date(0).toISOString(), idempotencyKey: '123e4567-e89b-42d3-a456-426614174000', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() } satisfies StoredLead;
describe('LeadManager', () => {
  afterEach(() => cleanup());
  it('menampilkan snapshot kandidat dan menghitung margin', async () => {
    render(<LeadManager databaseReady initialLeads={[lead]} initialPromoters={[]} initialError="" />);
    await userEvent.click(screen.getByRole('button', { name: /Ref. KSF-42/i }));
    fireEvent.change(screen.getByLabelText('Nilai penjualan'), { target: { value: '650001' } });
    fireEvent.change(screen.getByLabelText('Bagian promotor'), { target: { value: '500000' } });
    fireEvent.change(screen.getByLabelText('Biaya lain'), { target: { value: '25000' } });
    expect(screen.getByText((value) => value.replace(/\s/g, '') === 'Rp125.001')).not.toBeNull(); expect(screen.getByText('Promotor Aman')).not.toBeNull();
  });
  it('mengirim seluruh data rekonsiliasi', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, lead: { ...lead, paymentStatus: 'dibayar', sejoliOrderId: 'ORD-100' } }), { status: 200 })));
    render(<LeadManager databaseReady initialLeads={[lead]} initialPromoters={[]} initialError="" />);
    await userEvent.click(screen.getByRole('button', { name: /Ref. KSF-42/i }));
    await userEvent.selectOptions(screen.getByLabelText('Status pembayaran'), 'dibayar');
    fireEvent.change(screen.getByLabelText('ID order SEJOLI'), { target: { value: 'ORD-100' } });
    await userEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }));
    expect(fetch).toHaveBeenCalledWith('/api/admin/leads/42', expect.objectContaining({ method: 'PATCH', body: expect.stringContaining('"sejoliOrderId":"ORD-100"') }));
  });
});

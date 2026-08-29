// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PublicInterestAction from './public-interest-action';

function renderAction(navigateToCheckout = vi.fn()) {
  render(<PublicInterestAction linkKey="tesPersonal" label="Pesan" service="Tes STIFIn Personal" requirePrecheckout
    provinceCode="32" provinceName="Jawa Barat" regencyCode="32.04" regencyName="Kabupaten Bandung" navigateToCheckout={navigateToCheckout} />);
  return navigateToCheckout;
}
async function fillForm() {
  await userEvent.click(screen.getByRole('button', { name: 'Pesan' }));
  fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Budi Santoso' } });
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp'), { target: { value: '081234567890' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'budi@example.com' } });
  await userEvent.click(screen.getAllByRole('checkbox')[0]); await userEvent.click(screen.getAllByRole('checkbox')[1]);
}
describe('PublicInterestAction pre-checkout', () => {
  beforeEach(() => { vi.stubGlobal('crypto', { randomUUID: () => '123e4567-e89b-42d3-a456-426614174000' }); });
  afterEach(() => cleanup());
  it('tidak menampilkan checkout jika penyimpanan gagal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Database tidak tersedia.' }), { status: 500 })));
    renderAction(); await fillForm(); await userEvent.click(screen.getByRole('button', { name: 'Cari promotor & lanjut bayar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Database tidak tersedia.');
    expect(screen.queryByRole('link', { name: /lanjut ke pembayaran/i })).toBeNull();
  });
  it('menampilkan kandidat dan checkout resmi setelah lead tersimpan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, id: 42, reference: 'KSF-42', status: 'ditawarkan', match: { method: 'area', promoter: { code: 'P-1', name: 'Promotor Aman', area: 'Bandung', province: 'Jawa Barat' } }, checkoutUrl: 'https://app.konsepstifin.com/product/tes-personal/' }), { status: 201 })));
    renderAction(); await fillForm(); await userEvent.click(screen.getByRole('button', { name: 'Cari promotor & lanjut bayar' }));
    expect(await screen.findByText('Promotor Aman')).not.toBeNull();
    const checkout = screen.getByRole('link', { name: /lanjut ke pembayaran/i });
    expect(checkout.getAttribute('href')).toBe('https://app.konsepstifin.com/product/tes-personal/'); expect(checkout.getAttribute('target')).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/interests', expect.objectContaining({ method: 'POST' }));
  });
});

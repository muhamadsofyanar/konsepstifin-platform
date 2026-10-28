// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoucherClient from './voucher-client';
const portal = { profile: { name: 'Own Promoter', promoterCode: 'OWN' }, settings: { unitPrice: 165000, maxQuantity: 1000, mode: 'test' }, orders: [], bank: { bankName: 'Bank', accountNumber: '12345', accountHolder: 'Branch', instructions: 'Pay exactly' } };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('voucher purchase interface', () => {
  it('shows actual own balance, arbitrary integer quantity, and conspicuous simulation warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ voucher: 23, free: 4, checkedAt: '2026-10-28T00:00:00Z' })));
    render(<VoucherClient portal={portal}/>);
    expect(screen.getByText('MODE UJI — JANGAN TRANSFER UANG.')).toBeInTheDocument();
    expect(await screen.findByText('23')).toBeInTheDocument();
    const quantity = screen.getByLabelText('Jumlah voucher'); expect(quantity).toHaveAttribute('max', '1000');
    await userEvent.clear(quantity); await userEvent.type(quantity, '17'); expect(quantity).toHaveValue(17);
    expect(screen.queryByText(/12345/)).not.toBeInTheDocument();
  });
  it('disables purchases when mode is off and never substitutes zero for failed balance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<VoucherClient portal={{ ...portal, settings: { ...portal.settings, mode: 'off' } }}/>);
    expect(screen.getByRole('button', { name: 'Buat pesanan voucher' })).toBeDisabled();
    expect(await screen.findByText('Saldo resmi belum dapat dibaca. Coba muat ulang halaman.')).toBeInTheDocument();
  });
});

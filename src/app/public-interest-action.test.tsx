// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PublicInterestAction from './public-interest-action';

async function fillRequiredFields({ share = true }: { share?: boolean } = {}) {
  fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Budi Santoso' } });
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp'), { target: { value: '081234567890' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'budi@example.com' } });
  fireEvent.change(screen.getByLabelText('Kota/domisili'), { target: { value: 'Bandung' } });
  await userEvent.click(screen.getByLabelText(/digunakan tim untuk menindaklanjuti/i));
  if (share) await userEvent.click(screen.getByLabelText(/dibagikan kepada promotor yang ditugaskan/i));
}

describe('PublicInterestAction dua funnel', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', { randomUUID: () => '123e4567-e89b-42d3-a456-426614174000' });
    window.history.replaceState({}, '', '/tes-stifin?utm_source=meta&utm_campaign=launch&utm_content=hero');
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://example.com/article' });
  });
  afterEach(() => cleanup());

  it('menampilkan consent berbagi dan layanan tes saja untuk funnel tes', async () => {
    render(<PublicInterestAction leadType="test_service" linkKey="tesPersonal" label="Tes" service="Tes STIFIn Personal" />);
    await userEvent.click(screen.getByRole('button', { name: 'Tes' }));

    expect(screen.getByText(/dibagikan kepada promotor yang ditugaskan/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tes STIFIn Personal' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'WSL 1' })).not.toBeInTheDocument();
  });

  it('tidak meminta consent berbagi atau menawarkan checkout pada calon promotor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true, reference: 'KSF-41', status: 'baru', match: null,
    }), { status: 201 })));
    render(<PublicInterestAction leadType="promoter_candidate" linkKey="wsl1" checkoutUrl="https://app.konsepstifin.com/product/wsl-1/" label="WSL" service="WSL 1" />);
    await userEvent.click(screen.getByRole('button', { name: 'WSL' }));

    expect(screen.queryByText(/dibagikan kepada promotor yang ditugaskan/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Tes STIFIn Personal' })).not.toBeInTheDocument();
    await fillRequiredFields({ share: false });
    await userEvent.click(screen.getByRole('button', { name: 'Kirim permintaan →' }));

    expect(await screen.findByText(/KSF-41/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /pembayaran/i })).not.toBeInTheDocument();
  });

  it('mengirim attribution dan baru mengarahkan checkout tes setelah lead tersimpan', async () => {
    const navigateToCheckout = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      reference: 'KSF-42',
      status: 'ditawarkan',
      match: { method: 'area', promoter: { code: 'P-1', name: 'Promotor Aman', branchCode: 'BDG-CAB-1', area: 'Bandung', province: 'Jawa Barat' } },
      checkoutUrl: 'https://app.konsepstifin.com/product/tes-stifin-personal/',
    }), { status: 201 })));
    render(<PublicInterestAction leadType="test_service" linkKey="tesPersonal" checkoutUrl="https://app.konsepstifin.com/product/tes-stifin-personal/" label="Pesan" service="Tes STIFIn Personal" requirePrecheckout navigateToCheckout={navigateToCheckout} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pesan' }));
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Cari promotor & lanjut bayar' }));

    await waitFor(() => expect(navigateToCheckout).toHaveBeenCalledWith(
      'https://app.konsepstifin.com/product/tes-stifin-personal/',
    ));
    const request = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(String((request[1] as RequestInit).body));
    expect(body).toMatchObject({
      leadType: 'test_service',
      productKey: 'tesPersonal',
      utmSource: 'meta',
      utmCampaign: 'launch',
      utmContent: 'hero',
      referrer: 'https://example.com/article',
      idempotencyKey: '123e4567-e89b-42d3-a456-426614174000',
    });
  });

  it('tidak mengarahkan calon promotor walau respons menyertakan checkout', async () => {
    const navigateToCheckout = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      reference: 'KSF-44',
      status: 'baru',
      match: null,
      checkoutUrl: 'https://app.konsepstifin.com/product/wsl-1/',
    }), { status: 201 })));
    render(<PublicInterestAction leadType="promoter_candidate" linkKey="wsl1" label="Konsultasi" service="WSL 1" navigateToCheckout={navigateToCheckout} />);
    await userEvent.click(screen.getByRole('button', { name: 'Konsultasi' }));
    await fillRequiredFields({ share: false });
    await userEvent.click(screen.getByRole('button', { name: 'Kirim permintaan →' }));

    expect(await screen.findByText(/KSF-44/)).toBeInTheDocument();
    expect(navigateToCheckout).not.toHaveBeenCalled();
  });

  it('tidak menampilkan checkout ketika penyimpanan gagal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Database tidak tersedia.' }), { status: 500 })));
    render(<PublicInterestAction leadType="test_service" linkKey="tesPersonal" label="Pesan" service="Tes STIFIn Personal" />);
    await userEvent.click(screen.getByRole('button', { name: 'Pesan' }));
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Cari promotor & lanjut bayar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Database tidak tersedia.');
    expect(screen.queryByRole('link', { name: /lanjut ke pembayaran/i })).not.toBeInTheDocument();
  });
});

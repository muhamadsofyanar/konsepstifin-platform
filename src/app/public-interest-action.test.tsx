// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PublicInterestAction from './public-interest-action';


function mockSubmissionResponse(payload: unknown, status = 201) {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes('/api/account/me')) {
      return new Response(JSON.stringify({ message: 'Silakan masuk.' }), { status: 401 });
    }
    return new Response(JSON.stringify(payload), { status });
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

async function fillRequiredFields({ share = true }: { share?: boolean } = {}) {
  fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Budi Santoso' } });
  fireEvent.change(screen.getByLabelText('Nomor WhatsApp'), { target: { value: '081234567890' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'budi@example.com' } });
  fireEvent.change(screen.getByLabelText('Kota/domisili'), { target: { value: 'Bandung' } });
  await userEvent.click(screen.getByLabelText(/digunakan tim untuk menindaklanjuti/i));
  if (share) await userEvent.click(screen.getByLabelText(/dibagikan kepada promotor yang ditugaskan/i));
}

afterEach(()=>{cleanup();vi.unstubAllGlobals();});

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

  it('menawarkan consent berbagi opsional tanpa checkout pada calon promotor', async () => {
    mockSubmissionResponse({ ok: true, reference: 'KSF-41', status: 'baru', match: null });
    render(<PublicInterestAction leadType="promoter_candidate" linkKey="wsl1" checkoutUrl="https://app.konsepstifin.com/product/wsl-1/" label="WSL" service="WSL 1" />);
    await userEvent.click(screen.getByRole('button', { name: 'WSL' }));

    expect(screen.getByLabelText(/Opsional: Saya setuju data kontak/i)).not.toBeRequired();
    expect(screen.queryByRole('option', { name: 'Tes STIFIn Personal' })).not.toBeInTheDocument();
    await fillRequiredFields({ share: false });
    await userEvent.click(screen.getByRole('button', { name: 'Kirim permintaan →' }));

    expect(await screen.findByText(/KSF-41/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /pembayaran/i })).not.toBeInTheDocument();
  });

  it('menyimpan attribution dan referensi tanpa mengarahkan checkout lama', async () => {
    const navigateToCheckout = vi.fn();
    const fetcher = mockSubmissionResponse({ ok: true, reference: 'KSF-42', status: 'ditawarkan', match: { method: 'area', promoter: { code: 'P-1', name: 'Promotor Aman', branchCode: 'BDG-CAB-1', area: 'Bandung', province: 'Jawa Barat' } }, checkoutUrl: 'https://app.konsepstifin.com/product/tes-stifin-personal/' });
    render(<PublicInterestAction leadType="test_service" linkKey="tesPersonal" checkoutUrl="https://app.konsepstifin.com/product/tes-stifin-personal/" label="Pesan" service="Tes STIFIn Personal" requirePrecheckout navigateToCheckout={navigateToCheckout} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pesan' }));
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Kirim permintaan →' }));

    expect(await screen.findByText(/KSF-42/)).toBeInTheDocument();
    expect(navigateToCheckout).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: /pembayaran/i })).not.toBeInTheDocument();
    const request = vi.mocked(fetch).mock.calls.find(call => call[1]?.method === 'POST')!;
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
    mockSubmissionResponse({ ok: true, reference: 'KSF-44', status: 'baru', match: null, checkoutUrl: 'https://app.konsepstifin.com/product/wsl-1/' });
    render(<PublicInterestAction leadType="promoter_candidate" linkKey="wsl1" label="Konsultasi" service="WSL 1" navigateToCheckout={navigateToCheckout} />);
    await userEvent.click(screen.getByRole('button', { name: 'Konsultasi' }));
    await fillRequiredFields({ share: false });
    await userEvent.click(screen.getByRole('button', { name: 'Kirim permintaan →' }));

    expect(await screen.findByText(/KSF-44/)).toBeInTheDocument();
    expect(navigateToCheckout).not.toHaveBeenCalled();
  });

  it('tidak menampilkan checkout ketika penyimpanan gagal', async () => {
    mockSubmissionResponse({ error: 'Database tidak tersedia.' }, 500);
    render(<PublicInterestAction leadType="test_service" linkKey="tesPersonal" label="Pesan" service="Tes STIFIn Personal" />);
    await userEvent.click(screen.getByRole('button', { name: 'Pesan' }));
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Kirim permintaan →' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Database tidak tersedia.');
    expect(screen.queryByRole('link', { name: /lanjut ke pembayaran/i })).not.toBeInTheDocument();
  });
  it('menampilkan kegagalan jaringan tanpa mengklaim permintaan tersimpan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failed')));
    render(<PublicInterestAction linkKey="tesPersonal" label="Pesan" service="Tes STIFIn Personal" />);
    await userEvent.click(screen.getByRole('button', { name: 'Pesan' }));
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Kirim permintaan →' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Permintaan belum dapat disimpan');
    expect(screen.queryByText('Permintaan sudah tersimpan.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kirim permintaan →' })).toBeEnabled();
  });

});

it('sends only explicit optional referral-sharing consent for promoter registrations',async()=>{
 const fetcher=mockSubmissionResponse({reference:'KSF-90'});
 render(<PublicInterestAction leadType="promoter_candidate" linkKey="wsl1" label="Daftar" service="WSL 1"/>);
 await userEvent.click(screen.getByRole('button',{name:'Daftar'}));await fillRequiredFields({share:false});
 const sharing=screen.getByLabelText(/Opsional: Saya setuju data kontak/i);expect(sharing).not.toBeChecked();await userEvent.click(sharing);
 await userEvent.click(screen.getByRole('button',{name:'Kirim permintaan →'}));await screen.findByText(/KSF-90/);
 const request=fetcher.mock.calls.find(call=>call[1]?.method==='POST')!;const body=JSON.parse(String(request[1]?.body));expect(body.consentToShare).toBe(true);expect(body).not.toHaveProperty('sourcePartnerCode');expect(body).not.toHaveProperty('referralToken');
});

it('shows the stored referral on an ID Alat request while keeping sharing optional',async()=>{
 mockSubmissionResponse({reference:'KSF-104',referralRecorded:true,referralAlias:'khu-abu-10'});
 render(<PublicInterestAction linkKey="idDanAlat" service="ID Aplikasi & Scanner Promotor" label="Ajukan layanan ini →"/>);
 await userEvent.click(screen.getByRole('button',{name:'Ajukan layanan ini →'}));
 expect(screen.getByRole('combobox')).toHaveValue('idDanAlat');
 fireEvent.change(screen.getByLabelText('Nama lengkap'),{target:{value:'Klien ID Alat'}});fireEvent.change(screen.getByLabelText('Nomor WhatsApp'),{target:{value:'081234567890'}});fireEvent.change(screen.getByLabelText('Kota/domisili'),{target:{value:'Bandung'}});await userEvent.click(screen.getByLabelText(/digunakan tim/));
 const share=screen.getByLabelText(/Opsional:/);expect(share).not.toBeRequired();expect(share).not.toBeChecked();
 await userEvent.click(screen.getByRole('button',{name:'Kirim permintaan →'}));expect(await screen.findByText(/Asal referral tercatat: \/r\/khu-abu-10/)).toBeVisible();
});
it('does not announce a successful save when the response has no stored reference',async()=>{
 mockSubmissionResponse({ok:true},200);
 render(<PublicInterestAction linkKey="idDanAlat" service="ID & Alat" label="Ajukan"/>);await userEvent.click(screen.getByRole('button',{name:'Ajukan'}));
 fireEvent.change(screen.getByLabelText('Nama lengkap'),{target:{value:'Klien Baru'}});fireEvent.change(screen.getByLabelText('Nomor WhatsApp'),{target:{value:'081234567890'}});fireEvent.change(screen.getByLabelText('Kota/domisili'),{target:{value:'Bandung'}});await userEvent.click(screen.getByLabelText(/digunakan tim/));
 await userEvent.click(screen.getByRole('button',{name:'Kirim permintaan →'}));expect(await screen.findByText(/belum mendapat nomor referensi/)).toBeVisible();expect(screen.queryByText('Permintaan sudah tersimpan.')).not.toBeInTheDocument();
});

it('membedakan akun promotor dan menyediakan mode pengajuan atas nama calon klien', async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes('/api/account/me')) return new Response(JSON.stringify({
      registered: true, email: 'promotor@example.test', displayName: 'Promotor Uji', roles: ['promoter'],
      promoterCode: 'P-01', accountType: 'promoter', accountLabel: 'Promotor', isBranchManager: false,
    }), { status: 200 });
    return new Response(JSON.stringify({ reference: 'KSF-121' }), { status: 201 });
  });
  vi.stubGlobal('fetch', fetcher);
  render(<PublicInterestAction leadType="test_service" linkKey="tesPersonal" label="Ajukan tes" service="Tes STIFIn Personal" />);
  await userEvent.click(screen.getByRole('button', { name: 'Ajukan tes' }));
  expect(await screen.findByText('Promotor')).toBeInTheDocument();
  await userEvent.click(screen.getByLabelText('Atas nama calon klien'));
  expect(screen.getByLabelText('Nama calon klien')).toBeInTheDocument();
  expect(screen.getByLabelText('WhatsApp calon klien')).toBeInTheDocument();
  expect(screen.getByLabelText(/Saya telah memperoleh persetujuan calon klien agar nomor WhatsApp-nya digunakan tim/i)).toBeInTheDocument();
});

it('menampilkan skema Family Test setelah layanan dipilih pada formulir bantuan', async () => {
  render(<PublicInterestAction leadType="test_service" linkKey="tesPersonal" label="Bantu memilih" service="Bantuan memilih layanan STIFIn" familyPromo={{
    minimumPaidTestPrice: 500000,
    schemes: [{ key: 'family-3-1', paidTests: 3, freeTests: 1, label: '3 tes + 1 gratis' }],
  }} />);
  await userEvent.click(screen.getByRole('button', { name: 'Bantu memilih' }));
  await userEvent.selectOptions(screen.getByLabelText('Pilih kebutuhan'), 'paketKeluarga');
  expect(screen.getByLabelText('Skema Promo Family Test')).toBeInTheDocument();
  expect(screen.getByText(/minimum pembayaran Rp1\.500\.000/i)).toBeInTheDocument();
});

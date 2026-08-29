// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PromoterPage } from '@/lib/promoter-catalog';
import type { PromoterCatalogStatus } from '@/lib/promoter-store';
import PromoterManager from './promoter-manager';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));

const initialPage: PromoterPage = {
  items: [{
    code: 'P-1',
    name: 'Siti Aminah',
    branchCode: 'BDG-CAB-1',
    area: 'Kabupaten Bandung',
    province: 'Jawa Barat',
    active: true,
    regionCodes: ['32.04'],
    mappingSource: 'automatic',
  }],
  total: 1,
  page: 1,
  pageSize: 100,
  totalPages: 1,
};

const status: PromoterCatalogStatus = {
  source: {
    configured: true,
    mode: 'national',
    source: 'national',
    rawRows: 4000,
    safeRows: 3990,
    activeRows: 3900,
    inactiveRows: 90,
    branchCount: 120,
    lastSuccessAt: '2026-08-29T10:00:00.000Z',
    lastHttpStatus: 200,
    stale: false,
    errorCategory: null,
    message: null,
  },
  mapped: 3500,
  automatic: 3400,
  unresolved: 490,
  updatedAt: '2026-08-29T10:00:00.000Z',
};

describe('PromoterManager', () => {
  afterEach(() => cleanup());

  it('menampilkan satu halaman admin, filter mapping, dan kontrol CSV', () => {
    render(<PromoterManager initialPage={initialPage} status={status} provinces={[
      { code: '32', name: 'Jawa Barat', level: 'provinces' },
    ]} />);

    expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
    expect(screen.getByLabelText('Status mapping')).toHaveValue('');
    expect(screen.getByLabelText('Kabupaten/kota')).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Manual' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Automatic' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Unresolved' })).toBeInTheDocument();
    expect(screen.getByLabelText('Impor CSV')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ekspor csv/i })).toHaveAttribute('href', '/api/admin/promotor/export');
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('menolak override serviceable tanpa catatan bukti yang memadai', async () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<PromoterManager initialPage={initialPage} status={status} provinces={[]} />);

    fireEvent.change(screen.getByLabelText('Kode wilayah layanan'), { target: { value: '32.04' } });
    await userEvent.selectOptions(screen.getByLabelText('Status cakupan'), 'true');
    fireEvent.change(screen.getByLabelText('Catatan bukti'), { target: { value: 'pendek' } });
    await userEvent.click(screen.getByRole('button', { name: 'Simpan cakupan' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/10-500 karakter/i);
    expect(fetch).not.toHaveBeenCalled();
  });
});

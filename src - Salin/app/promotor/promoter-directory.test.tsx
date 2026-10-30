// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PublicPromoter } from '@/lib/promoter-domain';
import { directoryMetadata, PromoterDirectoryView } from './page';

function promoter(index: number): PublicPromoter {
  return {
    code: `P-${index}`,
    name: index === 1 ? 'Siti Aminah' : `Promotor ${index}`,
    branchCode: index % 2 ? 'BDG-CAB-1' : 'JKT-CAB-2',
    area: 'Kabupaten Bandung',
    province: 'Jawa Barat',
    active: true,
    regionCodes: ['32.04'],
    mappingSource: 'automatic',
  };
}

describe('PromoterDirectoryView', () => {
  it('merender tepat 24 kartu aman dari satu halaman server-side', () => {
    render(<PromoterDirectoryView page={{
      items: Array.from({ length: 24 }, (_, index) => promoter(index + 1)),
      total: 25,
      page: 1,
      pageSize: 24,
      totalPages: 2,
    }} query={{}} />);

    expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
    expect(screen.getByText(/^KodeID P-1$/)).toBeInTheDocument();
    expect(screen.getAllByText(/Jadwal berdasarkan konfirmasi/)).toHaveLength(24);
    expect(screen.queryByText(/menerima kunjungan/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(24);
  });

  it('menetapkan canonical tetap dan noindex hanya ketika ada query aktif', () => {
    expect(directoryMetadata({})).toMatchObject({
      alternates: { canonical: '/promotor' },
      robots: { index: true, follow: true },
    });
    expect(directoryMetadata({ q: 'siti', page: '2' })).toMatchObject({
      alternates: { canonical: '/promotor' },
      robots: { index: false, follow: true },
    });
  });
});

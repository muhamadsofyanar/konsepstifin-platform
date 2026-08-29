// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ContactPage from './page';

describe('halaman kontak dua funnel', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', { randomUUID: () => '123e4567-e89b-42d3-a456-426614174000' });
  });
  afterEach(() => cleanup());

  it('membuka formulir tes dan calon promotor dari pintu yang berbeda', async () => {
    render(<ContactPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Ajukan layanan tes →' }));
    expect(within(screen.getByRole('dialog')).getByText('LAYANAN TES STIFIn')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tutup formulir' }));

    await userEvent.click(screen.getByRole('button', { name: 'Minta konsultasi promotor →' }));
    const candidateDialog = screen.getByRole('dialog');
    expect(within(candidateDialog).getByText('JALUR CALON PROMOTOR')).toBeInTheDocument();
    expect(within(candidateDialog).getByText(/tidak diarahkan ke checkout/i)).toBeInTheDocument();
    expect(within(candidateDialog).queryByRole('button', { name: /lanjut bayar/i })).not.toBeInTheDocument();
  });
});

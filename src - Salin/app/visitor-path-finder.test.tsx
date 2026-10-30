// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import VisitorPathFinder from './visitor-path-finder';

afterEach(cleanup);

describe('visitor path finder', () => {
  it('menampilkan jalur awal untuk kebutuhan personal', () => {
    render(<VisitorPathFinder />);
    expect(screen.getByRole('heading', { name: 'Apa yang ingin Anda lakukan hari ini?' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Lihat Tes Personal/ }).getAttribute('href')).toBe('/produk/layanan/tesPersonal');
  });

  it('mengubah rekomendasi saat pengunjung memilih kebutuhan keluarga', () => {
    render(<VisitorPathFinder />);
    fireEvent.click(screen.getByRole('button', { name: /Pasangan & keluarga/ }));
    expect(screen.getByRole('heading', { name: 'Saya ingin memahami keluarga' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Lihat layanan keluarga/ }).getAttribute('href')).toBe('/produk/layanan/paketKeluarga');
  });

  it('memberikan jalur terpisah untuk calon promotor', () => {
    render(<VisitorPathFinder />);
    fireEvent.click(screen.getByRole('button', { name: /Peluang kemitraan/ }));
    expect(screen.getByRole('heading', { name: 'Saya ingin menjadi promotor' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Pelajari jalur promotor/ }).getAttribute('href')).toBe('/jadi-promotor');
  });
});

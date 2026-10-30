// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarketingManager from './marketing-manager';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('submits a selected personal recipient with an explicit WIB schedule and outbound mode', async () => {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => new Response(JSON.stringify(init?.method === 'POST' ? { message: 'Jadwal tersimpan' } : { campaigns: [] })));
  vi.stubGlobal('fetch', fetchMock);
  render(<MarketingManager initialContacts={[{ id: 1, name: 'Ayu', phone: '081234567890', whatsapp_marketing_consent: true }]} initialCampaigns={[]} />);
  fireEvent.click(screen.getByLabelText('Pilih Ayu'));
  fireEvent.change(screen.getByLabelText('Judul internal'), { target: { value: 'Tindak lanjut' } });
  fireEvent.change(screen.getByLabelText('Isi pesan'), { target: { value: 'Halo {{nama}}' } });
  fireEvent.change(screen.getByLabelText('Tanggal dan jam (WIB)'), { target: { value: '2099-01-01T09:30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan jadwal pengiriman' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Jadwal tersimpan'));
  expect(JSON.parse(String(fetchMock.mock.calls.find(([,init]) => init?.method === 'POST')?.[1]?.body))).toMatchObject({ leadIds: [1], scheduledAt: '2099-01-01T02:30:00.000Z', sendMode: 'consented_outbound' });
});

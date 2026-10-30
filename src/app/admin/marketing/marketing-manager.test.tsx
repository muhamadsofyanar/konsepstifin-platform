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
it('selects only consented contacts matching the search and clears the selection',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({templates:[]})));
  render(<MarketingManager initialContacts={[{id:1,name:'Ayu',whatsapp_marketing_consent:true},{id:2,name:'Budi',whatsapp_marketing_consent:false},{id:3,name:'Citra',whatsapp_marketing_consent:true}]} initialCampaigns={[]}/>);
  fireEvent.change(screen.getByLabelText('Cari kontak'),{target:{value:'Ayu'}});
  fireEvent.click(screen.getByRole('button',{name:'Pilih semua kontak berizin (maks. 100)'}));
  expect(screen.getByLabelText('Pilih Ayu')).toBeChecked();
  fireEvent.change(screen.getByLabelText('Cari kontak'),{target:{value:''}});
  expect(screen.getByLabelText('Pilih Budi')).toBeDisabled();
  expect(screen.getByLabelText('Pilih Citra')).not.toBeChecked();
  fireEvent.click(screen.getByRole('button',{name:'Kosongkan pilihan kontak'}));
  expect(screen.getByLabelText('Pilih Ayu')).not.toBeChecked();
});
it('loads reusable content including its attachment into a scheduled personal campaign',async()=>{
  const fetchMock=vi.fn(async(_url:string,init?:RequestInit)=>Response.json(init?.method==='POST'?{message:'Tersimpan'}:{templates:[{id:4,title:'Brosur',category:'attract',body:'Halo {{nama}}',media_url:'https://example.test/a.pdf',active:true}],campaigns:[]}));
  vi.stubGlobal('fetch',fetchMock);
  render(<MarketingManager initialContacts={[{id:1,name:'Ayu',whatsapp_marketing_consent:true}]} initialCampaigns={[]}/>);
  await screen.findByRole('option',{name:'attract · Brosur'});
  fireEvent.change(screen.getByLabelText('Gunakan konten'),{target:{value:'4'}});
  expect(screen.getByLabelText('Isi pesan')).toHaveValue('Halo {{nama}}');
  expect(screen.getByLabelText('Atau URL file HTTPS')).toHaveValue('https://example.test/a.pdf');
  fireEvent.click(screen.getByLabelText('Pilih Ayu'));
  fireEvent.change(screen.getByLabelText('Judul internal'),{target:{value:'Brosur'}});
  fireEvent.change(screen.getByLabelText('Tanggal dan jam (WIB)'),{target:{value:'2099-01-01T09:30'}});
  fireEvent.click(screen.getByRole('button',{name:'Simpan jadwal pengiriman'}));
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Tersimpan'));
  const post=fetchMock.mock.calls.find(([,init])=>init?.method==='POST');
  expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({mediaUrl:'https://example.test/a.pdf',message:'Halo {{nama}}'});
});

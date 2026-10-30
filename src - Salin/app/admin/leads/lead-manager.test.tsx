// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LeadManager from './lead-manager';
import type { StoredLead } from '@/lib/interest-store';

function lead(overrides: Partial<StoredLead>): StoredLead {
  return {
    id: 42,
    leadType: 'test_service',
    productKey: 'tesPersonal',
    name: 'Budi Tes',
    phone: '6281234567890',
    email: 'budi@example.com',
    provinceCode: '32',
    provinceName: 'Jawa Barat',
    regencyCode: '32.04',
    regencyName: 'Kabupaten Bandung',
    city: 'Bandung',
    service: 'Tes STIFIn Personal',
    notes: 'Sabtu pagi',
    sourcePath: '/tes-stifin',
    utmSource: 'meta',
    utmMedium: 'paid_social',
    utmCampaign: 'launch',
    utmContent: 'hero',
    utmTerm: '',
    referrer: 'https://example.com/article',
    consentToContact: true,
    consentToShare: true,
    status: 'ditawarkan',
    assignedPromoterCode: 'P-1',
    pic: '',
    matchMethod: 'area',
    matchedPromoterName: 'Promotor Aman',
    matchedBranchCode: 'BDG-CAB-1',
    promoterCandidates: [{ code: 'P-1', name: 'Promotor Aman', branchCode: 'BDG-CAB-1', area: 'Bandung', province: 'Jawa Barat' }],
    paymentStatus: 'belum_dicek',
    sejoliOrderId: '',
    saleAmount: 0,
    promoterPayout: 0,
    otherCost: 0,
    margin: 0,
    scheduledAt: null,
    paymentCheckedAt: null,
    internalNotes: '',
    responseDueAt: new Date(Date.now() - 60_000).toISOString(),
    consentAt: new Date(0).toISOString(),
    idempotencyKey: '123e4567-e89b-42d3-a456-426614174000',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

const testLead = lead({});

function page(items: StoredLead[] = [testLead], overrides = {}) {
 return {items,total:526,page:1,pageSize:25,groups:{prospect:526,client:10,candidate:1,promoter:2},metrics:{baru:526,terlambat:526,milestone:0,selesai:0,ditutup:0},options:{province:['Aceh'],regency:[],service:['Tes'],campaign:['old']},...overrides};
}
describe('LeadManager server queries',()=>{
 afterEach(()=>{cleanup();vi.unstubAllGlobals();});
 it('uses full database counts and requests server filters and pagination',async()=>{
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify(page()),{status:200}));vi.stubGlobal('fetch',fetcher);
  render(<LeadManager databaseReady initialPage={page()} initialError=""/>);
  expect(screen.getByRole('tab',{name:/Calon Klien 526/})).toBeInTheDocument();
  expect(screen.getByRole('option',{name:'Aceh'})).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Berikutnya'}));
  expect(fetcher.mock.calls[0][0]).toContain('page=2');
  fireEvent.change(screen.getByLabelText('Cari lead'),{target:{value:'Old target'}});
  expect(fetcher.mock.calls.at(-1)?.[0]).toContain('q=Old+target');
  expect(fetcher.mock.calls.at(-1)?.[0]).toContain('page=1');
 });
 it('keeps financial history read only and omits it from contact saves',async()=>{
  const fetcher=vi.fn().mockImplementation(async (_url, init)=>new Response(JSON.stringify(init?.method==='PATCH'?{lead:testLead}:{history:[]}),{status:200}));vi.stubGlobal('fetch',fetcher);
  render(<LeadManager databaseReady initialPage={page()} initialError="" initialHistories={{42:[]}}/>);
  await userEvent.click(screen.getByRole('button',{name:'Ref. KSF-42'}));
  expect(screen.queryByLabelText('Nilai penjualan')).not.toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Lihat / buat pesanan terkait'})).toHaveAttribute('href','/admin/pesanan?leadId=42');
  fireEvent.change(screen.getByLabelText('Catatan internal'),{target:{value:'Follow up'}});
  await userEvent.click(screen.getByRole('button',{name:'Simpan perubahan'}));
  const body=JSON.parse(fetcher.mock.calls.find(call=>call[1]?.method==='PATCH')![1].body);
  expect(body.internalNotes).toBe('Follow up'); expect(body).not.toHaveProperty('paymentStatus');expect(body).not.toHaveProperty('saleAmount');expect(body).not.toHaveProperty('sejoliOrderId');
 });
 it('ignores an old list response that resolves after a newer search',async()=>{
  let resolveOld!:(value:Response)=>void;
  const fetcher=vi.fn().mockImplementationOnce(()=>new Promise<Response>(resolve=>{resolveOld=resolve;})).mockResolvedValue(new Response(JSON.stringify(page([lead({name:'Newest result'})])),{status:200}));vi.stubGlobal('fetch',fetcher);
  render(<LeadManager databaseReady initialPage={page()} initialError=""/>);
  fireEvent.change(screen.getByLabelText('Cari lead'),{target:{value:'Old'}});
  fireEvent.change(screen.getByLabelText('Cari lead'),{target:{value:'New'}});
  expect(await screen.findByText('Newest result')).toBeInTheDocument();
  resolveOld(new Response(JSON.stringify(page([lead({name:'Stale result'})])),{status:200}));
  await new Promise(resolve=>setTimeout(resolve,0));
  expect(screen.queryByText('Stale result')).not.toBeInTheDocument();
 });
 it('shows related internal order totals from authenticated detail response',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({history:[],orders:[{id:7,number:'KSF-ORDER-7',total:650000,balance:100000,state:'issued',paymentStatus:'partial'}]}),{status:200})));
  render(<LeadManager databaseReady initialPage={page()} initialError=""/>);
  await userEvent.click(screen.getByRole('button',{name:'Ref. KSF-42'}));
  expect(await screen.findByRole('link',{name:'KSF-ORDER-7'})).toHaveAttribute('href','/admin/pesanan/7');
  expect(screen.getByText(/partial.*Total/)).toBeInTheDocument();
 });

});

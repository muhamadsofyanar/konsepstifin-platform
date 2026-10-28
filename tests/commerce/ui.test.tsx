// @vitest-environment jsdom
import { cleanup,render,screen,fireEvent,waitFor } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
import CommerceWorkspace from '../../src/app/admin/pesanan/commerce-workspace';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('shows empty orders and permits creating a draft from an explicit lead',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({lead:{id:1,name:'Ayu',phone:'081'}})})));
 render(<CommerceWorkspace initialOrders={[]} total={0} page={1}/>);
 expect(screen.getByText('Belum ada pesanan internal.')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('ID lead'),{target:{value:'1'}});fireEvent.click(screen.getByRole('button',{name:'Periksa lead'}));
 await waitFor(()=>expect(screen.getByText(/Ayu/)).toBeInTheDocument());
 expect(screen.getByRole('button',{name:'Simpan draf'})).toBeEnabled();
});
it('shows configured transfer instructions only within the admin order detail',()=>{
 const order={id:1,number:'KS-1',leadId:1,customerName:'Ayu',customerPhone:'081',customerEmail:'',state:'issued',lines:[{name:'Tes',unitPrice:100000,quantity:1}],total:100000,balance:0,paymentStatus:'unpaid',createdAt:'2026-10-28T00:00:00Z',ledger:[],audit:[]};
 render(<CommerceWorkspace initialOrder={order} bank={{bankName:'Bank Contoh',accountNumber:'123456',accountHolder:'PT Contoh',instructions:'Cantumkan nomor pesanan.'}}/>);
 expect(screen.getByText(/123456/)).toBeInTheDocument();expect(screen.getByText(/Cantumkan nomor pesanan/)).toBeInTheDocument();
});
it('preserves the selected lead filter in both pagination directions',()=>{
 render(<CommerceWorkspace initialOrders={[]} total={76} page={2} initialLeadId="42"/>);
 expect(screen.getByRole('link',{name:'← Sebelumnya'})).toHaveAttribute('href','/admin/pesanan?page=1&leadId=42');
 expect(screen.getByRole('link',{name:'Berikutnya →'})).toHaveAttribute('href','/admin/pesanan?page=3&leadId=42');
 fireEvent.change(screen.getByLabelText('ID lead'),{target:{value:'99'}});
 expect(screen.getByRole('link',{name:'Berikutnya →'})).toHaveAttribute('href','/admin/pesanan?page=3&leadId=42');
});

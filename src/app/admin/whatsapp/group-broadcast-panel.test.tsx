// @vitest-environment jsdom
import { afterEach,expect,it,vi } from 'vitest';
import { cleanup,render,screen,fireEvent,within,waitFor } from '@testing-library/react';
import GroupBroadcastPanel from './group-broadcast-panel';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('scopes bulk permission to the search result and supports select-all and clear in group pickers',async()=>{
 const groups=[{group_jid:'1@g.us',group_name:'Grup Ayu',allow_broadcast:true},{group_jid:'2@g.us',group_name:'Grup Budi',allow_broadcast:true}];
 const fetchMock=vi.fn(async(url:string,init?:RequestInit)=>Response.json(init?.method==='POST'?{message:'Izin diperbarui'}:String(url).includes('templates')?{templates:[]}:{groups,presets:[],broadcasts:[],groupMessages:[]}));
 vi.stubGlobal('fetch',fetchMock);
 render(<GroupBroadcastPanel groupWebhookUrl=""/>);
 await screen.findByRole('button',{name:'Pilih semua grup preset (maks. 100)'});
 await waitFor(()=>expect(screen.getAllByText('Grup Ayu').length).toBeGreaterThan(1));
 fireEvent.change(screen.getByLabelText('Cari grup WhatsApp'),{target:{value:'Ayu'}});
 fireEvent.click(screen.getByRole('button',{name:'Izinkan semua grup yang ditampilkan'}));
 await waitFor(()=>expect(fetchMock.mock.calls.some(([,init])=>init?.method==='POST')).toBe(true));
 const body=JSON.parse(String(fetchMock.mock.calls.find(([,init])=>init?.method==='POST')?.[1]?.body));
 expect(body).toEqual({action:'bulkAllow',groupJids:['1@g.us'],allowed:true});
 const button=screen.getByRole('button',{name:'Pilih semua grup preset (maks. 100)'});
 fireEvent.click(button);
 const picker=button.closest('.wa-group-picker') as HTMLElement;
 expect(within(picker).getAllByRole('checkbox').every(c=>(c as HTMLInputElement).checked)).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Kosongkan pilihan preset'}));
 expect(within(picker).getAllByRole('checkbox').every(c=>!(c as HTMLInputElement).checked)).toBe(true);
});

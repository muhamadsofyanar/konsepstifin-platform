// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChatWorkspace from './chat-workspace';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function response(data:object,status=200){return Promise.resolve(new Response(JSON.stringify(data),{status}));}
it('lets a member send through the dashboard and keeps the conversation visible',async()=>{
 const fetcher=vi.fn((url:RequestInfo|URL,options?:RequestInit)=>{
  if(String(url).includes('/contact'))return response({profile:{display_name:'Ayu',whatsapp_phone:''}});
  if(options?.method==='POST'){
   const body=JSON.parse(String(options.body));
   return response(body.action==='send'?{message:{id:'1',sender_id:'member',sender_kind:'member',body:body.body,created_at:new Date().toISOString()}}:{ok:true},body.action==='send'?201:200);
  }
  return response({messages:[]});
 });vi.stubGlobal('fetch',fetcher);
 render(<ChatWorkspace isAdmin={false} userId="member"/>);
 fireEvent.change(screen.getByLabelText('Tulis pesan'),{target:{value:'Halo admin'}});
 await waitFor(()=>expect(screen.getByRole('button',{name:'Kirim pesan'})).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button',{name:'Kirim pesan'}));
 await waitFor(()=>expect(screen.getByText('Halo admin')).toBeInTheDocument());
 const sent=fetcher.mock.calls.map(v=>v[1]?.body).find(v=>typeof v==='string'&&v.includes('"action":"send"'));
 expect(JSON.parse(String(sent)).memberId).toBe('member');
});
it('preserves the draft when sending fails',async()=>{
 vi.stubGlobal('fetch',vi.fn((url:RequestInfo|URL,options?:RequestInit)=>{
  if(String(url).includes('/contact'))return response({profile:{display_name:'',whatsapp_phone:''}});
  if(options?.method==='POST')return response({message:'Pengiriman belum berhasil.'},503);
  return response({messages:[]});
 }));
 render(<ChatWorkspace isAdmin={false} userId="member"/>);
 fireEvent.change(screen.getByLabelText('Tulis pesan'),{target:{value:'Jangan hilang'}});
 await waitFor(()=>expect(screen.getByRole('button',{name:'Kirim pesan'})).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button',{name:'Kirim pesan'}));
 await waitFor(()=>expect(screen.getByText('Pengiriman belum berhasil.')).toBeInTheDocument());
 expect(screen.getByLabelText('Tulis pesan')).toHaveValue('Jangan hilang');
});
it('ignores a delayed response from the account selected before switching',async()=>{
 let resolveOld:(r:Response)=>void=()=>{};
 vi.stubGlobal('fetch',vi.fn((url:RequestInfo|URL,options?:RequestInit)=>{
  if(String(url).includes('view=accounts'))return response({accounts:[{user_id:'one',email:'one@test.id',display_name:'Satu',promoter:false,unread:0},{user_id:'two',email:'two@test.id',display_name:'Dua',promoter:true,unread:1}]});
  if(options?.method==='POST')return response({ok:true});
  if(String(url).includes('memberId=one'))return new Promise<Response>(r=>{resolveOld=r;});
  return response({messages:[{id:'2',sender_id:'two',sender_kind:'member',body:'Pesan Dua',created_at:new Date().toISOString()}]});
 }));
 render(<ChatWorkspace isAdmin userId="admin"/>);
 fireEvent.click(await screen.findByRole('button',{name:/Satu/}));fireEvent.click(screen.getByRole('button',{name:/Dua/}));
 await screen.findByText('Pesan Dua');resolveOld(new Response(JSON.stringify({messages:[{id:'1',sender_id:'one',sender_kind:'member',body:'Pesan Satu',created_at:new Date().toISOString()}]})));
 await waitFor(()=>expect(screen.queryByText('Pesan Satu')).not.toBeInTheDocument());
});
it('keeps new messages unread while the member is scrolled into older history',async()=>{
 let round=0;const msg=(id:string)=>({id,sender_id:'admin',sender_kind:'admin',body:'Admin '+id,created_at:new Date().toISOString()});
 const reads:string[]=[];
 vi.stubGlobal('fetch',vi.fn((url:RequestInfo|URL,options?:RequestInit)=>{
  if(String(url).includes('/contact'))return response({profile:{display_name:'',whatsapp_phone:''}});
  if(options?.method==='POST'){const d=JSON.parse(String(options.body));if(d.action==='read')reads.push(d.lastId);return response({ok:true});}
  return response({messages:[msg(String(++round))]});
 }));
 render(<ChatWorkspace isAdmin={false} userId="member"/>);
 await waitFor(()=>expect(reads).toContain('1'));
 const history=screen.getByLabelText('Riwayat pesan');
 Object.defineProperties(history,{scrollHeight:{value:1000,configurable:true},clientHeight:{value:200,configurable:true}});
 history.scrollTop=100;fireEvent.scroll(history);
 fireEvent(document,new Event('visibilitychange'));
 await screen.findByText('Admin 2');expect(reads).not.toContain('2');
 history.scrollTop=800;fireEvent.scroll(history);
 await waitFor(()=>expect(reads).toContain('2'));
});

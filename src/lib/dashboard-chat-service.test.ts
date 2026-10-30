import { beforeAll, afterAll, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { DashboardChatService, type ChatDatabase } from './dashboard-chat-service';
import type { Principal } from './identity/access-policy';
let db: PGlite;
let service: DashboardChatService;
const a='10000000-0000-4000-8000-000000000001', m='10000000-0000-4000-8000-000000000002', p='10000000-0000-4000-8000-000000000003', x='10000000-0000-4000-8000-000000000004';
const actor=(id:string,roles:string[]=['member']):Principal=>({userId:id,roles,active:true,sessionValid:true,promoterCode:null});
const admin=actor(a,['admin']), member=actor(m), promoter=actor(p,['promoter']);
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`CREATE TABLE platform_users(id uuid PRIMARY KEY,email text,active boolean DEFAULT true); CREATE TABLE platform_user_roles(user_id uuid,role text); INSERT INTO platform_users(id,email,active) VALUES('${a}','admin@test.id',true),('${m}','member@test.id',true),('${p}','promoter@test.id',true),('${x}','inactive@test.id',false); INSERT INTO platform_user_roles VALUES('${a}','admin'),('${m}','member'),('${p}','promoter'),('${x}','member');`);
 const migration=readFileSync('scripts/migrations/019-dashboard-chat.sql','utf8');
 await db.exec(migration); await db.exec(migration);
 const adapter=(q:Pick<PGlite,'query'>):ChatDatabase=>({query:async(text,values=[]) => (await q.query(text,values)).rows as Record<string,unknown>[], transaction:async fn=>db.transaction(async tx=>fn(adapter(tx)))});
 service=new DashboardChatService(adapter(db));
},20000);
afterAll(async()=>{await db?.close();});
it('allows member and admin to exchange persisted messages',async()=>{
 const sent=await service.send(member,m,'Halo admin','20000000-0000-4000-8000-000000000001');
 await service.send(admin,m,'Halo, ada yang bisa dibantu?','20000000-0000-4000-8000-000000000002');
 const messages=await service.messages(member,m);
 expect(messages.map(v=>v.body)).toEqual(['Halo admin','Halo, ada yang bisa dibantu?']);
 expect(String(sent.id)).toBe(String(messages[0].id));
});
it('rejects cross-account reads, writes and read receipts from members and promoters',async()=>{
 await expect(service.messages(member,p)).rejects.toThrow('Akses');
 await expect(service.send(promoter,m,'Tidak boleh','20000000-0000-4000-8000-000000000003')).rejects.toThrow('Akses');
 await expect(service.markRead(member,p,'1')).rejects.toThrow('Akses');
 await expect(service.accounts(member,'')).rejects.toThrow('Akses');
});
it('rejects invalid sessions and inactive accounts even if principal claims active',async()=>{
 await expect(service.messages({...member,sessionValid:false},m)).rejects.toThrow('Akses');
 await expect(service.messages(actor(x),x)).rejects.toThrow('Akses');
 await expect(service.accounts(actor(m,['admin']),'' )).rejects.toThrow('Akses');
});
it('does not expose administrator accounts as member chat targets',async()=>{
 expect((await service.accounts(admin,'')).map(v=>v.user_id)).toEqual(expect.arrayContaining([m,p]));
 expect((await service.accounts(admin,'')).some(v=>v.user_id===a||v.user_id===x)).toBe(false);
 await expect(service.send(admin,a,'No','20000000-0000-4000-8000-000000000004')).rejects.toThrow();
});
it('rejects blank, long and invalid message payloads',async()=>{
 for(const body of ['', '  ', 'a'.repeat(4001)]) await expect(service.send(member,m,body,'20000000-0000-4000-8000-000000000005')).rejects.toThrow('Pesan');
 await expect(service.send(member,m,'Halo','bad')).rejects.toThrow('Kunci');
});
it('makes retries idempotent and rejects reusing a key for different content',async()=>{
 const key='20000000-0000-4000-8000-000000000006';
 const first=await service.send(promoter,p,'Halo dari promotor',key);
 const retry=await service.send(promoter,p,'Halo dari promotor',key);
 expect(String(retry.id)).toBe(String(first.id));
 expect(await service.messages(promoter,p)).toHaveLength(1);
 await expect(service.send(promoter,p,'Berubah',key)).rejects.toThrow('Kunci');
});
it('marks only displayed messages read and retains newer unread messages',async()=>{
 const key=(n:number)=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 const old=await service.send(admin,p,'Pesan pertama',key(1));
 await service.send(admin,p,'Pesan kedua',key(2));
 await service.markRead(promoter,p,String(old.id));
 expect((await service.summary(promoter)).unread).toBe(1);
 const messages=await service.messages(promoter,p);
 await service.markRead(promoter,p,String(messages.at(-1)!.id));
 expect((await service.summary(promoter)).unread).toBe(0);
 await expect(service.markRead(promoter,p,'9999999')).rejects.toThrow();
});
it('supports bounded before/after history cursors without leaking other threads',async()=>{
 const all=await service.messages(member,m);
 expect(await service.messages(member,m,{after:String(all[0].id)})).toHaveLength(all.length-1);
 expect(await service.messages(member,m,{before:String(all[1].id)})).toHaveLength(1);
 await expect(service.messages(member,m,{after:'bad'})).rejects.toThrow();
});
it('stores a self-owned contact profile and normalizes Indonesian phone numbers',async()=>{
 await service.saveContact(promoter,{displayName:'Yeni',whatsappPhone:'0812-3456-7890'});
 const profile=await service.contact(promoter);
 expect(profile.display_name).toBe('Yeni'); expect(profile.whatsapp_phone).toBe('6281234567890');
 expect((await service.accounts(admin,'Yeni'))[0].user_id).toBe(p);
 await expect(service.saveContact(promoter,{displayName:'X',whatsappPhone:'bukan nomor'})).rejects.toThrow('Nomor');
});

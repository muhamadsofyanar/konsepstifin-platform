import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {ScopedLeadStore} from '../../src/lib/identity/scoped-leads.ts';
let db,store;
const principal={userId:'P',active:true,sessionValid:true,roles:['promoter'],promoterCode:'P'};
before(async()=>{
 db=new PGlite();
 await db.exec(`CREATE TABLE public_interest_leads(id serial PRIMARY KEY,name text,phone text,email text,city text,status text,assigned_promoter_code text,consent_to_share boolean,created_at timestamptz DEFAULT now());
 INSERT INTO public_interest_leads(name,phone,email,city,status,assigned_promoter_code,consent_to_share)
 SELECT 'Person '||n,'08123','a@b.test','Bandung','baru','P',true FROM generate_series(1,525) n;
 INSERT INTO public_interest_leads(name,assigned_promoter_code,consent_to_share) VALUES('SECRET','Q',true),('NO CONSENT','P',false);`);
 store=new ScopedLeadStore(async(text,values)=>(await db.query(text,values)).rows);
});
after(async()=>await db?.close());
test('pagination exceeds 500 and count excludes other promoter and no consent',async()=>{
 const result=await store.list(principal,22,25,'');
 assert.equal(result.total,525);assert.equal(result.items.length,0);
 const first=await store.list(principal,1,25,'');assert.equal(first.items.length,25);assert.equal(first.items[0].id,525);
 const last=await store.list(principal,21,25,'');assert.equal(last.items.length,25);
});
test('anonymous cannot list or retrieve and outsider details stay hidden',async()=>{
 assert.deepEqual((await store.list(null,1,25,'')).items,[]);
 assert.equal(await store.detail(null,1),null);
 assert.equal(await store.detail(principal,526),null);
 assert.equal(await store.detail(principal,527),null);
});
test('search binds injection-like text as data',async()=>{
 assert.equal((await store.list(principal,1,25,"' OR 1=1 --")).total,0);
 assert.equal((await store.list(principal,1,25,'Person 525')).total,1);
});
test('reassignment and consent withdrawal remove access on next query',async()=>{
 await db.query("UPDATE public_interest_leads SET assigned_promoter_code='Q' WHERE id=1");
 assert.equal(await store.detail(principal,1),null);
 await db.query('UPDATE public_interest_leads SET consent_to_share=false WHERE id=2');
 assert.equal(await store.detail(principal,2),null);
});
test('bounded pagination rejects invalid parameters',async()=>{
 for(const [page,size] of [[0,25],[1,101],[1.5,25],[1,0]]) await assert.rejects(store.list(principal,page,size,''));
});

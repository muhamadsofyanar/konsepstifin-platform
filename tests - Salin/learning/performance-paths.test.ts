import { PGlite } from '@electric-sql/pglite';
import { readFile,readdir } from 'node:fs/promises';
import { beforeAll,afterAll,it,expect } from 'vitest';
import { LearningService } from '../../src/lib/learning-service';
import type { CommerceDatabase,CommerceQuery } from '../../src/lib/commerce-service';
const db=new PGlite(),calls:string[]=[];
const query:CommerceQuery['query']=async(t,p=[])=>{calls.push(t);return (await db.query(t,p)).rows as Record<string,unknown>[];};
const adapter:CommerceDatabase={query,transaction:fn=>db.transaction(tx=>fn({query:async(t,p=[])=>{calls.push(t);return (await tx.query(t,p)).rows as Record<string,unknown>[];}}))};
const s=new LearningService(adapter),user='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
let product:number,lesson:number,unrelated:number;
beforeAll(async()=>{
 for(const f of (await readdir('scripts/migrations')).filter(f=>/^\d{3}.*\.sql$/.test(f)).sort())await db.exec(await readFile('scripts/migrations/'+f,'utf8'));
 await db.query("INSERT INTO platform_users(id,email,password_hash) VALUES($1,'learner@example.test','hash'),($2,'other@example.test','hash')",[user,other]);
 product=(await s.saveProduct({title:'One class',kind:'course',state:'published',price:0},user)).id;
 lesson=Number((await s.saveLesson({productId:product,title:'Owned video',module:'Modul 1',kind:'video',url:'https://youtu.be/M7lc1UVf-VE',body:'Owned body',state:'published',required:true},user)).id);
 await s.checkout(user,{productId:product,key:'owned',name:'Learner',phone:'081'},null);
 const foreign=(await s.saveProduct({title:'Foreign',kind:'course',state:'published',price:0},other)).id;
 unrelated=Number((await s.saveLesson({productId:foreign,title:'Private other',module:'Modul 1',kind:'text',body:'NEVER_LEAK_THIS',state:'published'},other)).id);
 await s.checkout(other,{productId:foreign,key:'other',name:'Other',phone:'082'},null);
});
afterAll(()=>db.close());
it('opens a class using six scoped queries without reading unrelated dashboard tables',async()=>{
 calls.length=0;const data=await s.classroom(user,product);
 expect(data.grant?.product_id).toBe(product);expect(data.material?.id).toBe(lesson);expect(calls).toHaveLength(6);
 expect(calls.join(' ')).not.toMatch(/learning_tickets|learning_certificates|learning_purchases|learning_notifications/);
 expect(JSON.stringify(data)).not.toContain('NEVER_LEAK_THIS');
});
it('uses two queries for the access library and one for a product ownership check',async()=>{
 calls.length=0;const data=await s.dashboard(user,'classes');expect(Object.keys(data).sort()).toEqual(['grants','progress']);expect(calls).toHaveLength(2);
 calls.length=0;expect(await s.hasProductAccess(user,product)).toBe(true);expect(calls).toHaveLength(1);
 expect(await s.hasProductAccess(other,product)).toBe(false);
 await expect(s.dashboard(user,'__proto__')).rejects.toThrow(/Bagian/);
});
it('does not read any material for an unrelated account or a cross-product deep link',async()=>{
 calls.length=0;const denied=await s.classroom(other,product);expect(denied.grant).toBeNull();expect(denied.material).toBeNull();expect(calls).toHaveLength(1);
 calls.length=0;const wrong=await s.classroom(user,product,unrelated);expect(wrong.material).toBeNull();expect(wrong.materialError).toMatch(/tidak ditemukan/);expect(calls).toHaveLength(3);
 expect(calls.join(' ')).not.toContain('last_lesson_id=');
});
it('checks lock dates and expiry on every request instead of serving cached access',async()=>{
 const locked=Number((await s.saveLesson({productId:product,title:'Future',module:'Modul 2',kind:'text',body:'LOCKED_BODY',state:'published',unlockDays:30},user)).id);
 const data=await s.classroom(user,product,locked);expect(data.material).toBeNull();expect(data.materialError).toMatch(/terkunci/);
 await db.query("UPDATE learning_grants SET expires_at=now()-interval '1 day' WHERE user_id=$1 AND product_id=$2",[user,product]);
 calls.length=0;const expired=await s.classroom(user,product);expect(expired.material).toBeNull();expect(expired.lessons).toHaveLength(0);expect(calls).toHaveLength(1);
 expect(await s.hasProductAccess(user,product)).toBe(false);
});

import { test,expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { ReferralService } from './referral-service';
import type { NetworkQuery,NetworkTransaction } from './network-service';
test('actual postgres.js transactions retain aliases and immutable source through reassignment',async()=>{
 const db=await PGlite.create(),server=new PGLiteSocketServer({db,port:0,host:'127.0.0.1'});let sql:ReturnType<typeof postgres>|undefined;
 try{
  await server.start();sql=postgres(`postgres://postgres:postgres@${server.getServerConn()}/postgres`,{max:1,connect_timeout:5});
  for(const file of ['001-identity.sql','004-promoter-network.sql','005-referrals.sql'])await sql.unsafe(await readFile(`scripts/migrations/${file}`,'utf8'));
  const user=randomUUID(),other=randomUUID();
  await sql`INSERT INTO platform_branches(code,name,regency_code,regency_name,manager_code) VALUES('JML-CAB-62','Branch','33.26','Region','MGR')`;
  for(const [id,code] of [[user,'KHU-ABU-01'],[other,'KHU-ABU-02']]){
   await sql`INSERT INTO platform_users(id,email,password_hash) VALUES(${id},${`${code.toLowerCase()}@example.test`},'hash')`;
   await sql`INSERT INTO platform_user_roles VALUES(${id},'promoter')`;
   await sql`INSERT INTO platform_promoter_accounts VALUES(${id},${code})`;
   await sql`INSERT INTO platform_promoter_profiles(user_id,branch_code,name) VALUES(${id},'JML-CAB-62','Budi')`;
  }
  const driver=sql,query:NetworkQuery=async(text,args=[])=>[...await driver.unsafe(text,args)];
  const transaction:NetworkTransaction=async work=>await driver.begin(tx=>work(async(text,args=[])=>[...await tx.unsafe(text,args)])) as Awaited<ReturnType<typeof work>>;
  const service=new ReferralService(query,transaction,'https://example.test');
  // Official aliases also work for members imported after migration.
  expect((await service.visit('KHU-ABU-01')).valid).toBe(true);
  await service.saveAlias(user,'budi');await service.saveAlias(user,'budi-baru');
  await expect(service.saveAlias(other,'budi')).rejects.toThrow(/dimiliki/);
  expect((await service.getPortal(other)).alias).toBe('khu-abu-02');
  const visit=await service.visit('budi');expect((await service.resolveToken(visit.token!))?.userId).toBe(user);
  const [lead]=await sql`INSERT INTO public_interest_leads(name,phone,service,source_partner_user_id,source_partner_code,source_referral_alias) VALUES('Lead','628123456789','WSL 1',${user},'KHU-ABU-01','budi') RETURNING id`;
  await sql`ALTER TABLE public_interest_leads ADD COLUMN assigned_promoter_code TEXT NOT NULL DEFAULT ''`;
  await sql`UPDATE public_interest_leads SET assigned_promoter_code='NEW' WHERE id=${lead.id}`;
  await expect(sql`UPDATE public_interest_leads SET source_partner_code='NEW' WHERE id=${lead.id}`).rejects.toThrow(/immutable/);
  const [stored]=await sql`SELECT source_partner_code,source_referral_alias,assigned_promoter_code FROM public_interest_leads WHERE id=${lead.id}`;
  expect(stored).toMatchObject({source_partner_code:'KHU-ABU-01',source_referral_alias:'budi',assigned_promoter_code:'NEW'});
 }finally{if(sql)await sql.end();await server.stop();await db.close();}
},20000);

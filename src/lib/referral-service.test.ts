import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ReferralService, normalizeReferralAlias, referralDestination } from './referral-service';
import type { NetworkQuery, NetworkTransaction } from './network-service';
const db=new PGlite();
const user=randomUUID(), other=randomUUID(), foreign=randomUUID(), pending=randomUUID();
const query:NetworkQuery=async(sql,args=[]) => (await db.query(sql,args)).rows as Record<string,unknown>[];
const transaction:NetworkTransaction=work=>db.transaction(tx=>work(async(sql,args=[]) => (await tx.query(sql,args)).rows as Record<string,unknown>[]));
const service=new ReferralService(query,transaction,'https://example.test');
beforeAll(async()=>{
 for(const file of ['001-identity.sql','004-promoter-network.sql'])await db.exec(await readFile(`scripts/migrations/${file}`,'utf8'));
 await db.exec("INSERT INTO platform_branches VALUES('JML-CAB-62','Branch','33.26','Region','MANAGER',now()),('AAA-CAB-1','Other','32.04','Other','OTHER',now())");
 for(const [id,code,branch,active] of [[user,'KHU-ABU-01','JML-CAB-62',true],[other,'KHU-ABU-02','JML-CAB-62',true],[foreign,'OTHER-01','AAA-CAB-1',true],[pending,'PENDING-01','JML-CAB-62',false]] as const){
  await query('INSERT INTO platform_users(id,email,password_hash,active) VALUES($1,$2,\'hash\',$3)',[id,`${code.toLowerCase()}@example.test`,active]);
  await query("INSERT INTO platform_user_roles VALUES($1,'promoter')",[id]);
  await query('INSERT INTO platform_promoter_accounts VALUES($1,$2)',[id,code]);
  await query("INSERT INTO platform_promoter_profiles(user_id,branch_code,name) VALUES($1,$2,'Test Promoter')",[id,branch]);
 }
 await db.exec(await readFile('scripts/migrations/005-referrals.sql','utf8'));
});
afterAll(()=>db.close());
describe('referral aliases and attribution',()=>{
 it('normalizes names and rejects reserved, non-ASCII, path and URL aliases',()=>{
  expect(normalizeReferralAlias('  Budi Santoso ')).toBe('budi-santoso');
  for(const value of ['admin','API','a','éko','../admin','a--b','//evil.test','https://evil.test'])expect(()=>normalizeReferralAlias(value)).toThrow();
  expect(referralDestination('//evil.test')).toBe('/tes-stifin');expect(referralDestination('/jadi-promotor')).toBe('/jadi-promotor');
 });
 it('keeps official codes immutable, owns all historical aliases and prevents collisions',async()=>{
  expect((await service.getPortal(user)).alias).toBe('khu-abu-01');
  await service.saveAlias(user,'Budi');await service.saveAlias(user,'budi-baru');
  const portal=await service.getPortal(user);expect(portal.aliases).toEqual(expect.arrayContaining(['khu-abu-01','budi','budi-baru']));expect(portal.alias).toBe('budi-baru');
  await expect(service.saveAlias(other,'BUDI')).rejects.toThrow(/dimiliki/);
  await expect(service.saveAlias(user,'khu-abu-02')).rejects.toThrow(/dimiliki/);
  expect((await query('SELECT promoter_code FROM platform_promoter_accounts WHERE user_id=$1',[user]))[0].promoter_code).toBe('KHU-ABU-01');
  expect((await service.getPortal(user)).alias).toBe('budi-baru');
  expect((await service.visit('budi')).valid).toBe(true);
 });
 it('records an opaque 30-day first valid touch and never overwrites or extends it',async()=>{
  const first=await service.visit('budi');expect(first.token).toMatch(/^[a-f0-9]{64}$/);
  const source=await service.resolveToken(first.token!);expect(source).toMatchObject({userId:user,promoterCode:'KHU-ABU-01',alias:'budi'});
  const before=await query('SELECT expires_at FROM platform_referral_visits ORDER BY created_at DESC LIMIT 1');
  expect(await service.visit('khu-abu-02',first.token!)).toEqual({valid:true,token:null});
  expect(await query('SELECT expires_at FROM platform_referral_visits ORDER BY created_at DESC LIMIT 1')).toEqual(before);
  expect((await service.resolveToken(first.token!))?.userId).toBe(user);
  expect(await service.resolveToken('forged')).toBeNull();
  await query("UPDATE platform_referral_visits SET expires_at=now()-interval '1 day'");
  expect(await service.resolveToken(first.token!)).toBeNull();expect((await service.visit('khu-abu-02',first.token!)).token).toBeTruthy();
 });
 it('validates current active promoter role and same-branch membership',async()=>{
  await expect(service.getPortal(foreign)).rejects.toThrow(/Keanggotaan/);
  await expect(service.saveAlias(pending,'pending-name')).rejects.toThrow(/Keanggotaan/);
  expect((await service.visit('other-01')).valid).toBe(false);expect((await service.visit('pending-01')).valid).toBe(false);
  const visit=await service.visit('budi');await query('UPDATE platform_users SET active=false WHERE id=$1',[user]);
  expect(await service.resolveToken(visit.token!)).toBeNull();expect((await service.visit('budi')).valid).toBe(false);
  await query('UPDATE platform_users SET active=true WHERE id=$1',[user]);await query("DELETE FROM platform_user_roles WHERE user_id=$1 AND role='promoter'",[user]);
  expect(await service.resolveToken(visit.token!)).toBeNull();await query("INSERT INTO platform_user_roles VALUES($1,'promoter')",[user]);
 });
});

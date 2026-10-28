import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { describe, it, expect } from 'vitest';
import { OperationsService, type OperationQuery } from './operations-service';
const hash=`scrypt$32768$8$1$${'ab'.repeat(16)}$${'ab'.repeat(64)}`;
async function setup(){
 const db=new PGlite();
 await db.exec(await readFile('scripts/migrations/001-identity.sql','utf8'));
 await db.exec(await readFile('scripts/migrations/003-operations.sql','utf8'));
 const actor=randomUUID();
 await db.query('INSERT INTO platform_users(id,email,password_hash) VALUES($1,$2,$3)',[actor,'admin@example.com',hash]);
 await db.query("INSERT INTO platform_user_roles VALUES($1,'admin')",[actor]);
 const query:OperationQuery=async(text,args=[]) => (await db.query<Record<string,unknown>>(text,args)).rows;
 const service=new OperationsService(query,async(fn)=> db.transaction(async(tx)=>fn(async(text,args=[]) => (await tx.query<Record<string,unknown>>(text,args)).rows)));
 return {db,service,actor,query};
}
describe('admin settings and accounts',()=>{
 it('saves bounded public payment settings with audit, and rejects invalid input',async()=>{
  const {db,service,actor}=await setup();
  try {await service.saveSettings(actor,{bankName:'Bank contoh',accountNumber:'123 456',accountHolder:'Tim',instructions:'Konfirmasi setelah transfer.'});
   expect((await service.settings()).accountNumber).toBe('123 456');
   expect((await db.query('SELECT * FROM platform_admin_audit')).rows).toHaveLength(1);
   await expect(service.saveSettings(actor,{bankName:'x',accountNumber:'<script>',accountHolder:'Tim',instructions:''})).rejects.toThrow();
   expect((await service.settings()).bankName).toBe('Bank contoh');
  } finally{await db.close();}
 });
 it('prevents disabling last admin; revokes sessions on password reset; no hash leakage',async()=>{
  const {db,service,actor}=await setup();
  try {
   await expect(service.updateAccount(actor,actor,{active:false})).rejects.toThrow(/admin aktif/);
   const id=await service.createAdmin(actor,'second@example.com',hash);
   await db.query("INSERT INTO platform_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",['a'.repeat(64),id]);
   await service.updateAccount(actor,id,{passwordHash:hash});
   expect((await db.query<{revoked_at:string|null}>('SELECT revoked_at FROM platform_sessions WHERE user_id=$1',[id])).rows[0].revoked_at).not.toBeNull();
   const listed=await service.accounts();expect(listed).toHaveLength(2);expect(JSON.stringify(listed)).not.toContain('password_hash');
   await service.updateAccount(actor,actor,{active:false});
   await expect(service.createAdmin(actor,'third@example.com',hash)).rejects.toThrow(/Akses/);
  }finally{await db.close();}
 });
 it('rolls back settings when audit fails and protects super admin from regular admin edits',async()=>{
  const {db,service,actor}=await setup();
  try{
   const target=randomUUID();await db.query('INSERT INTO platform_users(id,email,password_hash) VALUES($1,$2,$3)',[target,'owner@example.com',hash]);
   await db.query("INSERT INTO platform_user_roles VALUES($1,'super_admin')",[target]);
   await expect(service.updateAccount(actor,target,{active:false})).rejects.toThrow(/pemilik/);
   await db.exec('DROP TABLE platform_admin_audit');
   await expect(service.saveSettings(actor,{bankName:'Changed',accountNumber:'123',accountHolder:'Tim',instructions:''})).rejects.toThrow();
   expect((await service.settings()).bankName).toBe('');
  }finally{await db.close();}
 });
});

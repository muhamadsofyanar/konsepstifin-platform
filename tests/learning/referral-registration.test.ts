import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { beforeAll, afterAll, it, expect } from 'vitest';
import { IdentityStore } from '../../src/lib/identity/store';
import { ReferralService } from '../../src/lib/referral-service';
import { LearningService } from '../../src/lib/learning-service';
import type { NetworkQuery, NetworkTransaction } from '../../src/lib/network-service';
import type { CommerceDatabase } from '../../src/lib/commerce-service';
const db=new PGlite(), hash=`scrypt$32768$8$1$${'00'.repeat(16)}$${'00'.repeat(64)}`;
const query:NetworkQuery=async(t,a=[]) => (await db.query(t,a)).rows as Record<string,unknown>[];
const tx:NetworkTransaction=fn=>db.transaction(t=>fn(async(s,a=[]) => (await t.query(s,a)).rows as Record<string,unknown>[]));
const identity=new IdentityStore((t,a)=>query(t,a));
const refs=new ReferralService(query,tx,'https://example.test');
const adapter:CommerceDatabase={query,transaction:fn=>tx(q=>fn({query:q}))};
const learning=new LearningService(adapter);
let partner:string,other:string;
beforeAll(async()=>{
 for(const f of (await readdir('scripts/migrations')).filter(f=>/^\d{3}.*\.sql$/.test(f)).sort())await db.exec(await readFile('scripts/migrations/'+f,'utf8'));
 partner=await identity.createAccount('partner@example.test',hash,['affiliate']);other=await identity.createAccount('other@example.test',hash,['affiliate']);
 await refs.saveAlias(partner,'partner');await refs.saveAlias(other,'other');
});
afterAll(()=>db.close());

it('creates the account and immutable referral together with the original expiry, without issuing commission',async()=>{
 const visit=await refs.visit('partner');const user=await identity.createAccount('new@example.test',hash,['member'],null,visit.token);
 const [row]=await query('SELECT * FROM platform_referral_registrations WHERE user_id=$1',[user]);
 const [v]=await query("SELECT expires_at FROM platform_referral_visits WHERE alias='partner' ORDER BY created_at DESC LIMIT 1");
 expect(row.partner_user_id).toBe(partner);expect(row.attribution_expires_at).toEqual(v.expires_at);
 expect(await query('SELECT * FROM affiliate_entries')).toHaveLength(0);
 await expect(query('UPDATE platform_referral_registrations SET partner_user_id=$1 WHERE user_id=$2',[other,user])).rejects.toThrow(/immutable/);
 await expect(identity.createAccount(' NEW@example.test ',hash,['member'],null,(await refs.visit('other')).token)).rejects.toThrow();
 expect((await query('SELECT partner_user_id FROM platform_referral_registrations WHERE user_id=$1',[user]))[0].partner_user_id).toBe(partner);
 await db.exec(await readFile('scripts/migrations/009-referral-registrations.sql','utf8'));
 expect((await refs.resolveRegistered(user))?.userId).toBe(partner);
});
it('does not attribute invalid, expired, inactive, or removed-role invitations',async()=>{
 const invalid=await identity.createAccount('invalid@example.test',hash,['member'],null,'forged');
 expect(await query('SELECT * FROM platform_referral_registrations WHERE user_id=$1',[invalid])).toHaveLength(0);
 const expired=(await refs.visit('partner')).token!;
 await query("UPDATE platform_referral_visits SET expires_at=now()-interval '1 day' WHERE token_hash=$1",[createHash('sha256').update(expired).digest('hex')]);
 const user=await identity.createAccount('expired@example.test',hash,['member'],null,expired);
 expect(await refs.resolveRegistered(user)).toBeNull();
 const inactive=(await refs.visit('other')).token!;await query('UPDATE platform_users SET active=false WHERE id=$1',[other]);
 const no=await identity.createAccount('inactive@example.test',hash,['member'],null,inactive);expect(await refs.resolveRegistered(no)).toBeNull();
 await query('UPDATE platform_users SET active=true WHERE id=$1',[other]);
 await query("DELETE FROM platform_user_roles WHERE user_id=$1 AND role='affiliate'",[other]);
 const removed=await identity.createAccount('removed@example.test',hash,['member'],null,inactive);expect(await refs.resolveRegistered(removed)).toBeNull();
 await query("INSERT INTO platform_user_roles VALUES($1,'affiliate')",[other]);
});
it('rolls back account creation if referral persistence fails',async()=>{
 await db.exec("CREATE FUNCTION fail_registration() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$; CREATE TRIGGER fail_test BEFORE INSERT ON platform_referral_registrations FOR EACH ROW EXECUTE FUNCTION fail_registration();");
 try{await expect(identity.createAccount('rollback@example.test',hash,['member'],null,(await refs.visit('partner')).token)).rejects.toThrow(/test failure/);expect(await query("SELECT id FROM platform_users WHERE email='rollback@example.test'")).toHaveLength(0);}
 finally{await db.exec('DROP TRIGGER fail_test ON platform_referral_registrations; DROP FUNCTION fail_registration();');}
});
it('retains registration attribution across browsers, prioritizes it over a later cookie, and expires it without rewriting history',async()=>{
 const token=(await refs.visit('partner')).token!;const user=await identity.createAccount('device@example.test',hash,['member'],null,token);
 const product=await learning.saveProduct({title:'Referral class',kind:'course',state:'published',price:100000,commissionBps:1000,attributionEnabled:true},partner);
 await learning.checkout(user,{productId:product.id,key:'no-cookie',name:'Peserta',phone:'081'},null);
 expect((await query("SELECT partner_user_id FROM learning_purchases WHERE request_key='no-cookie'"))[0].partner_user_id).toBe(partner);
 await learning.checkout(user,{productId:product.id,key:'competing-cookie',name:'Peserta',phone:'081'},(await refs.visit('other')).token!);
 expect((await query("SELECT partner_user_id FROM learning_purchases WHERE request_key='competing-cookie'"))[0].partner_user_id).toBe(partner);
 // Simulate a historical row with the trigger disabled, not an application capability.
 await db.exec('ALTER TABLE platform_referral_registrations DISABLE TRIGGER registration_referral_source');
 await query("UPDATE platform_referral_registrations SET attribution_expires_at=now()-interval '1 day' WHERE user_id=$1",[user]);
 await db.exec('ALTER TABLE platform_referral_registrations ENABLE TRIGGER registration_referral_source');
 expect(await refs.resolveRegistered(user)).toBeNull();
 await learning.checkout(user,{productId:product.id,key:'after-window',name:'Peserta',phone:'081'},null);
 expect((await query("SELECT partner_user_id FROM learning_purchases WHERE request_key='after-window'"))[0].partner_user_id).toBeNull();
 expect((await query("SELECT partner_user_id FROM learning_purchases WHERE request_key='no-cookie'"))[0].partner_user_id).toBe(partner);
});
it('reports only the current partner activity without exposing participant email, phone, or raw identity',async()=>{
 const activity=await refs.activity(partner),otherActivity=await refs.activity(other);
 expect(activity.counts.registrations).toBe(2);expect(otherActivity.counts.registrations).toBe(0);
 expect(activity.counts.purchases).toBe(2);expect(otherActivity.counts.purchases).toBe(0);
 const admin=await learning.adminData();expect(admin.registrations.some(r=>r.participant_email==='new@example.test'&&r.partner_email==='partner@example.test')).toBe(true);
 expect(activity.registrations[0].participant).toMatch(/^Peserta [0-9a-f]{8}$/);
 expect(JSON.stringify(activity)).not.toContain('@');expect(JSON.stringify(activity)).not.toContain('user_id');
 const user=await identity.createAccount('ordinary@example.test',hash,['member']);await expect(refs.activity(user)).rejects.toThrow(/Keanggotaan/);
});

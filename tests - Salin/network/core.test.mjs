import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {randomUUID} from 'node:crypto';
const members=()=>[{KodeID:'BKS-HRA-40',Nama:'Muhamad Sofyan AR',Sub:'JML-CAB-62',Email:'external-owner@example.test',Area:'Sumedang',Aktif:'1'},...Array.from({length:10},(_,i)=>({KodeID:`KHU-ABU-${String(i+1).padStart(2,'0')}`,Nama:`Person ${i+1}`,Sub:'JML-CAB-62',Email:`person${i+1}@example.test`,Area:'Area',Aktif:'1'}))];
async function setup(){
 const {NetworkService}=await import('../../src/lib/network-service.ts');
 const {sanitizeNetwork}=await import('../../src/lib/network-domain.ts');
 const db=await PGlite.create();
 for(const file of ['001-identity.sql','003-operations.sql','004-promoter-network.sql'])await db.exec(await readFile(new URL(`../../scripts/migrations/${file}`,import.meta.url),'utf8'));
 const owner=randomUUID();await db.query('INSERT INTO platform_users(id,email,password_hash) VALUES($1,$2,$3)',[owner,'admin@konsepstifin.com','owner-preserved']);await db.query("INSERT INTO platform_user_roles VALUES($1,'admin')",[owner]);
 const query=async(sql,args=[]) => (await db.query(sql,args)).rows;
 const transaction=work=>db.transaction(tx=>work(async(sql,args=[]) => (await tx.query(sql,args)).rows));
 return {db,owner,query,service:new NetworkService(query,transaction,'https://example.test'),sanitizeNetwork};
}
test('imports exact eleven, reuses administrator, creates inactive ten, and preserves on rerun',async()=>{const s=await setup();try{
 const clean=s.sanitizeNetwork(members().map(x=>({...x,PassID:'secret'})));assert.ok(!JSON.stringify(clean).includes('secret'));
 const result=await s.service.importNetwork(clean);assert.equal(result.created,10);assert.equal(result.invitations.length,10);
 const overview=await s.service.getNetworkOverview();assert.equal(overview.members.length,11);assert.equal(overview.members.find(x=>x.isManager).userId,s.owner);assert.equal(overview.members.filter(x=>!x.active).length,10);
 assert.equal((await s.query('SELECT password_hash FROM platform_users WHERE id=$1',[s.owner]))[0].password_hash,'owner-preserved');
 const again=await s.service.importNetwork(clean);assert.equal(again.created,0);assert.deepEqual(again.invitations,[]);
 assert.equal((await s.query('SELECT count(*)::int n FROM platform_activation_tokens'))[0].n,10);
 }finally{await s.db.close();}});
test('rejects forged network and rolls all import writes back on collision',async()=>{const s=await setup();try{
 assert.throws(()=>s.sanitizeNetwork(members().slice(1)),/network/i);assert.throws(()=>s.sanitizeNetwork(members().map((x,i)=>i===2?{...x,Aktif:'0'}:x)),/network/i);assert.throws(()=>s.sanitizeNetwork(members().map((x,i)=>i?x:{...x,Sub:'OTHER'})),/network/i);
 const conflict=randomUUID();await s.query('INSERT INTO platform_users(id,email,password_hash) VALUES($1,$2,$3)',[conflict,'person10@example.test','existing']);await s.query('INSERT INTO platform_promoter_accounts VALUES($1,$2)',[conflict,'OTHER']);
 await assert.rejects(s.service.importNetwork(s.sanitizeNetwork(members())),/conflict/i);assert.equal((await s.query('SELECT count(*)::int n FROM platform_promoter_profiles'))[0].n,0);assert.equal((await s.query('SELECT count(*)::int n FROM platform_users'))[0].n,2);
 }finally{await s.db.close();}});
test('activation is one-use, expires, refuses admins, and pending invite reissue invalidates prior token',async()=>{const s=await setup();try{
 await assert.rejects(s.service.activatePromoter('f'.repeat(64),'short'),/activation/i);
 const result=await s.service.importNetwork(s.sanitizeNetwork(members()));const first=result.invitations[0];const token=new URL(first.activationUrl).hash.slice(7);
 assert.equal((await s.query('SELECT count(*)::int n FROM platform_activation_tokens WHERE token_hash=$1',[token]))[0].n,0);
 await s.query("INSERT INTO platform_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",['a'.repeat(64),first.userId]);
 const {IdentityStore}=await import('../../src/lib/identity/store.ts');const ids=new IdentityStore(s.query);assert.equal(await ids.login(first.email,'unusable-secret'),null);
 await assert.rejects(s.service.activatePromoter(token,'short'),/Password/);
 await s.service.activatePromoter(token,'A-long-password-123');assert.ok((await s.query('SELECT revoked_at FROM platform_sessions WHERE token_hash=$1',['a'.repeat(64)]))[0].revoked_at);await assert.rejects(s.service.activatePromoter(token,'Another-password-123'),/activation/i);assert.ok(await ids.login(first.email,'A-long-password-123'));
 await assert.rejects(s.service.issuePromoterInvite(first.userId,s.owner),/pending/i);await assert.rejects(s.service.issuePromoterInvite(s.owner,s.owner),/pending/i);
 const second=result.invitations[1],old=new URL(second.activationUrl).hash.slice(7);const reissued=await s.service.issuePromoterInvite(second.userId,s.owner);await assert.rejects(s.service.activatePromoter(old,'Another-password-123'),/activation/i);
 await s.query('UPDATE platform_activation_tokens SET expires_at=now()-interval \'1 second\' WHERE user_id=$1',[second.userId]);await assert.rejects(s.service.activatePromoter(new URL(reissued.activationUrl).hash.slice(7),'Another-password-123'),/activation/i);
 const third=result.invitations[2];await s.query("INSERT INTO platform_user_roles VALUES($1,'admin')",[third.userId]);await assert.rejects(s.service.activatePromoter(new URL(third.activationUrl).hash.slice(7),'Another-password-123'),/activation/i);
 }finally{await s.db.close();}});
test('one branch per regency and portal scopes consenting own leads only',async()=>{const s=await setup();try{
 const result=await s.service.importNetwork(s.sanitizeNetwork(members()));await assert.rejects(s.query("INSERT INTO platform_branches(code,name,regency_code,regency_name,manager_code) VALUES('OTHER','Other','33.26','Same','OTHER')"));
 const first=result.invitations[0];assert.equal(await s.service.getPromoterPortal(first.userId),null);await s.service.activatePromoter(new URL(first.activationUrl).hash.slice(7),'A-long-password-123');
 await s.db.exec('CREATE TABLE public_interest_leads(id serial PRIMARY KEY,name text,phone text,email text,city text,status text,assigned_promoter_code text,consent_to_share boolean,created_at timestamptz DEFAULT now())');
 for(const [code,consent] of [[first.promoterCode,true],[first.promoterCode,false],['OTHER',true]])await s.query("INSERT INTO public_interest_leads(name,assigned_promoter_code,consent_to_share) VALUES('Lead',$1,$2)",[code,consent]);
 const portal=await s.service.getPromoterPortal(first.userId);assert.equal(portal.total,1);assert.equal(portal.leads.length,1);assert.equal(portal.profile.branchCode,'JML-CAB-62');
 }finally{await s.db.close();}});
test('refuses inactive owner and unexpected stored branch membership without writing accounts',async()=>{const s=await setup();try{
 await s.query('UPDATE platform_users SET active=false WHERE id=$1',[s.owner]);await assert.rejects(s.service.importNetwork(s.sanitizeNetwork(members())),/administrator/i);assert.equal((await s.query('SELECT count(*)::int n FROM platform_branches'))[0].n,0);
 await s.query('UPDATE platform_users SET active=true WHERE id=$1',[s.owner]);await s.service.importNetwork(s.sanitizeNetwork(members()));
 const other=randomUUID();await s.query("INSERT INTO platform_users(id,email,password_hash) VALUES($1,'unexpected@example.test','existing')",[other]);await s.query("INSERT INTO platform_promoter_accounts VALUES($1,'FORGED')",[other]);await s.query("INSERT INTO platform_promoter_profiles(user_id,branch_code,name) VALUES($1,'JML-CAB-62','Unexpected')",[other]);
 await assert.rejects(s.service.importNetwork(s.sanitizeNetwork(members())),/conflict/i);
 }finally{await s.db.close();}});

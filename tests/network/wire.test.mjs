import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {NetworkService} from '../../src/lib/network-service.ts';
import {NETWORK_CODES,NETWORK_BRANCH} from '../../src/lib/network-domain.ts';
test('actual postgres.js wire import and activation preserve transaction and row lock guarantees',async()=>{
 const db=await PGlite.create(),server=new PGLiteSocketServer({db,host:'127.0.0.1',port:0});let sql;
 try{
  await server.start();sql=postgres(`postgres://postgres:postgres@${server.getServerConn()}/postgres`,{max:1,connect_timeout:5});
  for(const file of ['001-identity.sql','003-operations.sql','004-promoter-network.sql'])await sql.unsafe(await readFile(new URL(`../../scripts/migrations/${file}`,import.meta.url),'utf8'));
  const owner=randomUUID();await sql.unsafe("INSERT INTO platform_users VALUES($1,'admin@konsepstifin.com','preserved',true,now())",[owner]);await sql.unsafe("INSERT INTO platform_user_roles VALUES($1,'admin')",[owner]);
  const query=async(text,args=[])=>[...await sql.unsafe(text,args)];const tx=work=>sql.begin(t=>work(async(text,args=[])=>[...await t.unsafe(text,args)]));
  const service=new NetworkService(query,tx,'https://example.test');
  const members=NETWORK_CODES.map((code,i)=>({promoterCode:code,name:i?`Test ${i}`:'Muhamad Sofyan AR',email:`wire${i}@example.test`,branchCode:NETWORK_BRANCH.code,area:'Sumedang'}));
  const result=await service.importNetwork(members);assert.equal(result.created,10);assert.equal((await service.importNetwork(members)).invitations.length,0);
  await sql.unsafe(`CREATE FUNCTION assert_network_lock() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
   IF NOT EXISTS(SELECT 1 FROM platform_users WHERE id=NEW.user_id AND xmax::text=pg_current_xact_id()::text) THEN RAISE EXCEPTION 'activation token must lock user first'; END IF; RETURN NEW; END $$;
   CREATE TRIGGER network_token_lock BEFORE UPDATE ON platform_activation_tokens FOR EACH ROW EXECUTE FUNCTION assert_network_lock();`);
  const first=result.invitations[0];await service.activatePromoter(new URL(first.activationUrl).hash.slice(7),'A-wire-password-123');
  assert.equal((await query('SELECT active FROM platform_users WHERE id=$1',[first.userId]))[0].active,true);
  const next=result.invitations[1];const replacement=await service.issuePromoterInvite(next.userId,owner);assert.match(replacement.activationUrl,/#token=[a-f0-9]{64}$/);
  await assert.rejects(service.activatePromoter(new URL(next.activationUrl).hash.slice(7),'A-wire-password-123'),/activation/);
  // An exception after branch creation must roll back the entire new transaction.
  await query('DELETE FROM platform_promoter_profiles');await query('DELETE FROM platform_promoter_accounts');await query('DELETE FROM platform_branches');
  await query("INSERT INTO platform_promoter_accounts(user_id,promoter_code) VALUES($1,'CONFLICT')",[owner]);
  await assert.rejects(service.importNetwork(members),/conflict/);assert.equal((await query('SELECT count(*)::int n FROM platform_branches'))[0].n,0);
 }finally{if(sql)await sql.end();await server.stop();await db.close();}
});

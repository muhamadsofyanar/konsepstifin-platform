import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const script = new URL('../../scripts/identity-admin.mjs', import.meta.url);
test('operator rejects unknown command before trying any database connection', () => {
 const result = spawnSync(process.execPath, [script.pathname, 'reset-everything'], {env:{...process.env,DATABASE_URL:'postgres://invalid@127.0.0.1:1/invalid',IDENTITY_ADMIN_CONFIRM:'yes'},encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/Use migrate, provision, or verify/);
});
test('operator rejects absent explicit database confirmation', () => {
 const result = spawnSync(process.execPath, [script.pathname, 'verify'], {env:{...process.env,IDENTITY_ADMIN_CONFIRM:''},encoding:'utf8'});
 assert.notEqual(result.status,0); assert.match(result.stderr,/IDENTITY_ADMIN_CONFIRM=yes/);
});
test('operator provisioning twice preserves original credentials and verify creates no browser session', async () => {
 const {PGlite} = await import('@electric-sql/pglite');
 const {readFile} = await import('node:fs/promises');
 const operator = await import('../../scripts/identity-admin.mjs');
 assert.equal(typeof operator.runAccountOperation,'function');
 const db = new PGlite();
 try {
  await db.exec(await readFile(new URL('../../scripts/migrations/001-identity.sql',import.meta.url),'utf8'));
  const query=async(text,values)=>(await db.query(text,values)).rows;
  const first=await operator.runAccountOperation('provision',{email:'initial@example.com',password:'Long-password-123',roles:['admin']},query);
  assert.equal(first.created,true);
  const repeated=await operator.runAccountOperation('provision',{email:'initial@example.com',password:'Changed-password-123',roles:['super_admin']},query);
  assert.equal(repeated.created,false);
  assert.equal((await operator.runAccountOperation('verify',{email:'initial@example.com',password:'Long-password-123'},query)).verified,true);
  await assert.rejects(operator.runAccountOperation('verify',{email:'initial@example.com',password:'Changed-password-123'},query),/Credentials rejected/);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM platform_sessions')).rows[0].n,0);
 } finally { await db.close(); }
});

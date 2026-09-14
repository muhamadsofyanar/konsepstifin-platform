import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { IdentityStore } from '../../src/lib/identity/store.ts';
import { hashPassword } from '../../src/lib/identity/password.ts';
import { resolveSession } from '../../src/lib/identity/session.ts';
let db, store;
before(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL('../../scripts/migrations/001-identity.sql', import.meta.url), 'utf8'));
  store = new IdentityStore(async (text, values) => (await db.query(text, values)).rows);
});
after(async () => { await db?.close(); });
test('login issues hashed session, current roles reload, logout revokes', async () => {
  const user = await store.createAccount(' PERSON@example.com ', await hashPassword('Long-password-123'), ['promoter'], 'P01');
  assert.equal(await store.login('person@example.com', 'wrong'), null);
  const session = await store.login('person@example.com', 'Long-password-123');
  assert.match(session.token, /^[a-f0-9]{64}$/);
  let principal = await resolveSession(session.token, store);
  assert.equal(principal.userId, user);
  assert.deepEqual(principal.roles, ['promoter']);
  const stored = (await db.query('SELECT token_hash FROM platform_sessions')).rows[0];
  assert.notEqual(stored.token_hash, session.token);
  await db.query('DELETE FROM platform_user_roles WHERE user_id=$1', [user]);
  principal = await resolveSession(session.token, store);
  assert.deepEqual(principal.roles, []);
  await store.logout(session.token);
  assert.equal(await resolveSession(session.token, store), null);
});
test('deactivation invalidates session and prevents login', async () => {
  const id = await store.createAccount('inactive@example.com', await hashPassword('Long-password-123'), ['member']);
  const session = await store.login('inactive@example.com', 'Long-password-123');
  await db.query('UPDATE platform_users SET active=false WHERE id=$1', [id]);
  assert.equal(await resolveSession(session.token, store), null);
  assert.equal(await store.login('inactive@example.com', 'Long-password-123'), null);
});
test('normalized duplicate emails rejected atomically', async () => {
  const hash = await hashPassword('Long-password-123');
  await store.createAccount('duplicate@example.com', hash, ['member']);
  await assert.rejects(store.createAccount(' DUPLICATE@example.com ', hash, ['admin']));
  assert.equal((await db.query("SELECT count(*)::int AS n FROM platform_users WHERE email='duplicate@example.com'")).rows[0].n, 1);
});
test('shared limiter blocks attempt seven, including across store instances', async () => {
  const other = new IdentityStore(async (text, values) => (await db.query(text, values)).rows);
  for (let i=0;i<6;i++) assert.equal(await store.consumeLoginAttempt('limited@example.com'), true);
  assert.equal(await other.consumeLoginAttempt('limited@example.com'), false);
});
test('expired session rejected', async () => {
  await store.createAccount('expiry@example.com', await hashPassword('Long-password-123'), ['member']);
  const session = await store.login('expiry@example.com', 'Long-password-123');
  assert.equal(await resolveSession(session.token, store, session.expiresAt), null);
});
test('migration can run again without losing accounts', async () => {
  await db.exec(await readFile(new URL('../../scripts/migrations/001-identity.sql', import.meta.url), 'utf8'));
  assert.ok((await db.query('SELECT count(*)::int AS n FROM platform_users')).rows[0].n >= 4);
});

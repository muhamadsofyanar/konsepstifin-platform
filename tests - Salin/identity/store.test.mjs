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
test('admin login rejects member before issuing session, while account login still works', async () => {
  const id = await store.createAccount('member-admin-test@example.com', await hashPassword('Long-password-123'), ['member']);
  assert.equal(await store.login('member-admin-test@example.com', 'Long-password-123', true), null);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM platform_sessions WHERE user_id=$1', [id])).rows[0].n, 0);
  assert.ok(await store.login('member-admin-test@example.com', 'Long-password-123'));
});
test('admin credentials verify without issuing session and preserve email in principal', async () => {
  const id = await store.createAccount('ADMIN-DB@example.com', await hashPassword('Long-password-123'), ['admin']);
  assert.equal(await store.verifyCredentials('admin-db@example.com', 'Long-password-123', true), id);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM platform_sessions WHERE user_id=$1', [id])).rows[0].n, 0);
  const session = await store.login('admin-db@example.com', 'Long-password-123', true);
  assert.equal((await resolveSession(session.token, store)).email, 'admin-db@example.com');
});
test('idempotent provisioning never changes password or grants new roles to an existing account', async () => {
  const initial = await store.provisionAccount('operator@example.com', await hashPassword('Long-password-123'), ['admin']);
  const repeated = await store.provisionAccount(' OPERATOR@example.com ', await hashPassword('Changed-password-456'), ['super_admin']);
  assert.equal(repeated.userId, initial.userId);
  assert.equal(repeated.created, false);
  assert.ok(await store.login('operator@example.com', 'Long-password-123', true));
  assert.equal(await store.login('operator@example.com', 'Changed-password-456', true), null);
  assert.deepEqual((await db.query('SELECT role FROM platform_user_roles WHERE user_id=$1', [initial.userId])).rows, [{role:'admin'}]);
});
test('shared HTTP login protects admin role, enforces origin and revokes account cookie on logout', async () => {
  const {handleLogin,handleLogout}=await import('../../src/lib/identity/http.ts');
  const origin='https://example.com';
  const request=(email,requestOrigin=origin)=>new Request(`${origin}/api/admin/login`,{method:'POST',headers:{origin:requestOrigin,'content-type':'application/json'},body:JSON.stringify({email,password:'Long-password-123'})});
  await store.createAccount('http-member@example.com',await hashPassword('Long-password-123'),['member']);
  await store.createAccount('http-admin@example.com',await hashPassword('Long-password-123'),['super_admin']);
  assert.equal((await handleLogin(request('http-admin@example.com','https://evil.test'),store,origin,true,true)).status,403);
  assert.equal((await handleLogin(request('http-member@example.com'),store,origin,true,true)).status,401);
  const response=await handleLogin(request('http-admin@example.com'),store,origin,true,true);
  assert.equal(response.status,200);
  assert.match(response.headers.get('set-cookie'),/^konsepstifin_account=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Strict/);
  const token=response.headers.get('set-cookie').split(';')[0].split('=')[1];
  assert.ok(await resolveSession(token,store));
  assert.equal((await handleLogout(request('http-admin@example.com','https://evil.test'),store,origin,true,token)).status,403);
  assert.ok(await resolveSession(token,store));
  assert.equal((await handleLogout(request('http-admin@example.com'),store,origin,true,token)).status,200);
  assert.equal(await resolveSession(token,store),null);
});
test('session issuance locks the current user row before insertion to serialize password reset and deactivation', async () => {
  const id = await store.createAccount('locked-login@example.com', await hashPassword('Long-password-123'), ['admin']);
  // PGlite has one backend, so two independent concurrent transactions are unavailable.
  // Assert actual PostgreSQL tuple-lock ownership at the insertion boundary instead.
  // Without a user row lock, a reset may revoke its snapshot's sessions before this INSERT commits.
  await db.exec(`CREATE FUNCTION assert_login_user_lock() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM platform_users
        WHERE id=NEW.user_id AND xmax::text=pg_current_xact_id()::text) THEN
        RAISE EXCEPTION 'session insertion must first lock the user row';
      END IF;
      RETURN NEW;
    END $$;
    CREATE TRIGGER session_requires_user_lock BEFORE INSERT ON platform_sessions
      FOR EACH ROW EXECUTE FUNCTION assert_login_user_lock();`);
  try {
    const session = await store.login('locked-login@example.com', 'Long-password-123', true);
    assert.ok(session);
    assert.equal((await resolveSession(session.token, store)).userId, id);
  } finally {
    await db.exec('DROP TRIGGER session_requires_user_lock ON platform_sessions; DROP FUNCTION assert_login_user_lock();');
  }
});

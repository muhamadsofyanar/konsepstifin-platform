import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import postgres from 'postgres';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {IdentityStore} from '../../src/lib/identity/store.ts';
import {hashPassword} from '../../src/lib/identity/password.ts';

test('actual postgres.js wire adapter provisions JSON roles and authenticates the account', async () => {
  const db = await PGlite.create();
  const server = new PGLiteSocketServer({db, host:'127.0.0.1', port:0});
  let sql;
  try {
    await server.start();
    sql = postgres(`postgres://postgres:postgres@${server.getServerConn()}/postgres`, {max:1, connect_timeout:5});
    await sql.unsafe(await readFile(new URL('../../scripts/migrations/001-identity.sql',import.meta.url),'utf8'));
    const store = new IdentityStore(async (text,values) => [...await sql.unsafe(text,values)]);
    const account = await store.provisionAccount('wire-admin@example.com', await hashPassword('Long-password-123'), ['admin','member']);
    assert.equal(account.created,true);
    const roles = await sql.unsafe('SELECT role FROM platform_user_roles WHERE user_id=$1 ORDER BY role',[account.userId]);
    assert.deepEqual(roles.map(row=>row.role),['admin','member']);
    // Check tuple lock ownership through the same real driver at the INSERT boundary.
    await sql.unsafe(`CREATE FUNCTION assert_wire_login_lock() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM platform_users WHERE id=NEW.user_id
          AND xmax::text=pg_current_xact_id()::text) THEN
          RAISE EXCEPTION 'session insertion must first lock the user row';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER wire_session_requires_user_lock BEFORE INSERT ON platform_sessions
        FOR EACH ROW EXECUTE FUNCTION assert_wire_login_lock();`);
    assert.ok(await store.login('wire-admin@example.com','Long-password-123',true));
  } finally {
    if (sql) await sql.end();
    await server.stop();
    await db.close();
  }
});

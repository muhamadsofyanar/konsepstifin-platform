import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { resolveSession } from '../../src/lib/identity/session.ts';

const token = 'a'.repeat(64);
const hash = createHash('sha256').update(token).digest('hex');
const account = { userId: 'p1', active: true, roles: ['promoter'], promoterCode: 'P1' };
const valid = { tokenHash: hash, userId: 'p1', expiresAt: 2000, revokedAt: null, account };
// A deterministic repository double replaces only the not-yet-connected database.
const store = row => ({ findSession: async key => key === hash ? row : null });

test('valid stored session resolves current account, not cookie roles', async () => {
  assert.deepEqual(await resolveSession(token, store(valid), 1000), { ...account, sessionValid: true });
});
for (const [name, patch] of [
  ['expiry boundary', { expiresAt: 1000 }],
  ['expired', { expiresAt: 999 }],
  ['revoked at zero', { revokedAt: 0 }],
  ['revoked', { revokedAt: 900 }],
  ['wrong token digest', { tokenHash: 'b'.repeat(64) }],
  ['account mismatch', { userId: 'other' }],
  ['invalid expiry', { expiresAt: NaN }],
  ['inactive account', { account: { ...account, active: false } }],
  ['unactivated account', { account: null }],
  ['malformed active flag', { account: { ...account, active: 'true' } }],
  ['blank account ID', { userId: '', account: { ...account, userId: '' } }],
]) test(`denies ${name}`, async () => {
  assert.equal(await resolveSession(token, store({ ...valid, ...patch }), 1000), null);
});
test('unknown token cannot resolve a session', async () => {
  assert.equal(await resolveSession('b'.repeat(64), store(valid), 1000), null);
});
test('malformed cookie is rejected before accessing storage', async () => {
  const unavailable = { findSession: async () => { throw new Error('must not query'); } };
  for (const value of [null, '', 'admin', token + '.admin', {}, 'a'.repeat(65)]) {
    assert.equal(await resolveSession(value, unavailable, 1000), null);
  }
});
test('storage outage never falls back to administrator', async () => {
  await assert.rejects(resolveSession(token, { findSession: async () => { throw new Error('offline'); } }, 1000));
});
test('role and deactivation changes apply on the next lookup', async () => {
  const row = structuredClone(valid);
  const repository = store(row);
  assert.deepEqual((await resolveSession(token, repository, 1000)).roles, ['promoter']);
  row.account.roles = [];
  assert.deepEqual((await resolveSession(token, repository, 1000)).roles, []);
  row.account.active = false;
  assert.equal(await resolveSession(token, repository, 1000), null);
});

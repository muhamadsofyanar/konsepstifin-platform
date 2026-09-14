import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../src/lib/identity/password.ts';
test('correct password succeeds; wrong password fails', async () => {
  const hash = await hashPassword('Long-password-123');
  assert.equal(await verifyPassword('Long-password-123', hash), true);
  assert.equal(await verifyPassword('Wrong-password-123', hash), false);
});
test('unique salts prevent identical stored hashes', async () => {
  assert.notEqual(await hashPassword('Long-password-123'), await hashPassword('Long-password-123'));
});
for (const value of ['', 'short', 'x'.repeat(1025)]) test(`reject invalid password length ${value.length}`, async () => {
  await assert.rejects(hashPassword(value));
});
for (const hash of ['', 'scrypt$999999999$8$1$aa$bb', 'scrypt$32768$8$1$bad$bad']) test(`malformed hash rejected ${hash}`, async () => {
  assert.equal(await verifyPassword('Long-password-123', hash), false);
});

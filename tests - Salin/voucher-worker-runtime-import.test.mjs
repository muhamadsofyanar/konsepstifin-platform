import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('voucher service uses explicit TypeScript extension for runtime StarSender import', async () => {
  const source = await readFile(new URL('../src/lib/voucher-service.ts', import.meta.url), 'utf8');
  assert.match(source, /from\s+['"]\.\/starsender-client\.ts['"]/);
  assert.doesNotMatch(source, /from\s+['"]\.\/starsender-client['"]/);
});

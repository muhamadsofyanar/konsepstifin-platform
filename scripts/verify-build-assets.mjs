import { access, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function filesRecursively(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesRecursively(target) : [target];
  }));
  return nested.flat();
}

const required = [
  path.join(root, '.next', 'standalone', 'server.js'),
  path.join(root, 'public', 'site.css'),
  path.join(root, 'public', 'stifin-konsep-wordmark.png'),
];

for (const target of required) {
  await access(target);
  if ((await stat(target)).size === 0) throw new Error(`Aset kosong: ${target}`);
}

const staticFiles = await filesRecursively(path.join(root, '.next', 'static'));
if (!staticFiles.some((file) => file.endsWith('.css'))) {
  throw new Error('Build tidak menghasilkan CSS pada .next/static.');
}
if (!staticFiles.some((file) => file.endsWith('.js'))) {
  throw new Error('Build tidak menghasilkan JavaScript pada .next/static.');
}

console.log(`Aset build sehat: ${staticFiles.length} file statis dan CSS fallback publik tersedia.`);

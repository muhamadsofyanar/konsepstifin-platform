import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'src', 'app', 'globals.css');
const destination = path.join(root, 'public', 'site.css');

await mkdir(path.dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log('CSS fallback publik diperbarui.');

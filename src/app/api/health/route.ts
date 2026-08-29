import { access, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function hasCss(directory: string): Promise<boolean> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory() && await hasCss(target)) return true;
    if (entry.isFile() && entry.name.endsWith('.css') && (await stat(target)).size > 0) return true;
  }
  return false;
}

export async function GET() {
  try {
    const root = process.cwd();
    const fallbackCss = path.join(root, 'public', 'site.css');
    await access(fallbackCss);
    const staticCssReady = await hasCss(path.join(root, '.next', 'static'));
    if (!staticCssReady || (await stat(fallbackCss)).size === 0) throw new Error('Aset CSS tidak lengkap.');
    return Response.json({ ok: true, version: '0.3.0', assets: 'ready' }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Health check gagal.', error);
    return Response.json({ ok: false, version: '0.3.0', assets: 'missing' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

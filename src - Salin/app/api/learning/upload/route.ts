import { mkdir, realpath, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { learningGuard, learningJson, learningFailure } from '@/lib/learning-http';
import { LearningError } from '@/lib/learning-service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX = 20 * 1024 * 1024;
export async function POST(request: Request) {
  try {
    const guard = await learningGuard(request, true, true);
    if (guard.response) return guard.response;
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new LearningError('Gunakan formulir unggah file.');
    if (Number(request.headers.get('content-length')) > MAX + 65536) return learningJson({ message: 'Ukuran file maksimal 20 MB.' }, 413);
    const reader = request.body?.getReader(); if (!reader) throw new LearningError('File belum dipilih.');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX + 65536) { await reader.cancel(); return learningJson({ message: 'Ukuran file maksimal 20 MB.' }, 413); }
      chunks.push(value);
    }
    const form = await new Request(request.url, { method: 'POST', headers: request.headers, body: Buffer.concat(chunks) }).formData();
    const file = form.get('file'); if (!(file instanceof File) || !file.size || file.size > MAX) throw new LearningError('Pilih file PDF atau EPUB, maksimal 20 MB.');
    const ext = path.extname(file.name).toLowerCase(), bytes = Buffer.from(await file.arrayBuffer());
    if (!(ext === '.pdf' && bytes.subarray(0, 5).toString() === '%PDF-' || ext === '.epub' && bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4])))) throw new LearningError('Isi file harus sesuai format PDF atau EPUB.');
    const configured = process.env.LEARNING_STORAGE_PATH || path.join(process.cwd(), 'storage/learning');
    await mkdir(/* turbopackIgnore: true */ configured, { recursive: true });
    const root = await realpath(/* turbopackIgnore: true */ configured), relative = randomUUID() + ext;
    await writeFile(/* turbopackIgnore: true */ path.join(root, relative), bytes, { flag: 'wx', mode: 0o600 });
    return learningJson({ filePath: relative, name: file.name, size: file.size });
  } catch (e) { return learningFailure(e); }
}

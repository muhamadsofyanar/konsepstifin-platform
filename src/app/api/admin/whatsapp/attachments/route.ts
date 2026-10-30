import { randomUUID } from 'node:crypto';
import { getAccountPrincipal } from '@/lib/identity/server';
import { accessScope } from '@/lib/identity/access-policy';
import { isSameOriginMutation } from '@/lib/admin-request';
import { getDatabaseClient } from '@/lib/article-store';
import { attachmentMime, MAX_WHATSAPP_ATTACHMENT } from '@/lib/whatsapp-attachment';
import { whatsappMediaUrl } from '@/lib/whatsapp-media';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ message: 'Origin tidak valid.' }, { status: 403 });
  const principal = await getAccountPrincipal();
  if (!principal || accessScope(principal).kind === 'none') return Response.json({ message:'Akses unggah tidak tersedia.' }, { status:401 });
  try {
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new Error('Gunakan formulir unggah file.');
    const reader = request.body?.getReader();
    if (!reader) throw new Error('File belum dipilih.');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done,value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_WHATSAPP_ATTACHMENT + 65536) { await reader.cancel(); return Response.json({ message:'Ukuran maksimal 10 MB.' }, { status:413 }); }
      chunks.push(value);
    }
    const form = await new Request(request.url,{ method:'POST',headers:request.headers,body:Buffer.concat(chunks) }).formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.size || file.size > MAX_WHATSAPP_ATTACHMENT) throw new Error('Pilih file maksimal 10 MB.');
    const bytes = Buffer.from(await file.arrayBuffer()), mime = attachmentMime(file.name,bytes);
    const id = randomUUID();
    const url = whatsappMediaUrl(new URL(`/api/whatsapp/attachments/${id}`,process.env.PLATFORM_ORIGIN || new URL(request.url).origin).toString());
    const sql = getDatabaseClient();
    await sql`INSERT INTO whatsapp_attachments(id,name,mime_type,bytes,created_by) VALUES (${id}::uuid,${file.name.slice(0,160)},${mime},${bytes},${principal.userId}::uuid)`;
    return Response.json({ url,name:file.name,size:file.size },{status:201,headers:{'Cache-Control':'no-store'}});
  } catch (error) { return Response.json({ message:error instanceof Error ? error.message : 'Unggah gagal. Periksa migrasi 018.' },{status:400}); }
}

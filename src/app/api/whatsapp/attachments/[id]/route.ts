import { getDatabaseClient } from '@/lib/article-store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Opaque link access lets StarSender fetch the attachment without an admin cookie. */
export async function GET(_request: Request, { params }: { params: Promise<{ id:string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return new Response(null,{status:404});
  try {
    const sql = getDatabaseClient();
    const [file] = await sql`SELECT name,mime_type,bytes FROM whatsapp_attachments WHERE id=${id}::uuid`;
    if (!file) return new Response(null,{status:404});
    const bytes = new Uint8Array(file.bytes);
    return new Response(bytes,{headers:{'Content-Type':String(file.mime_type),'Content-Length':String(bytes.length),'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(String(file.name))}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
  } catch { return new Response(null,{status:503}); }
}

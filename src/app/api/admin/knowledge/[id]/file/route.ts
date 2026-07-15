import { isAdminAuthenticated } from '@/lib/admin-auth';
import { readKnowledgeFile } from '@/lib/knowledge-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_: Request, context: RouteContext<'/api/admin/knowledge/[id]/file'>) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ message: 'ID sumber tidak valid.' }, { status: 400 });
  try {
    const file = await readKnowledgeFile(id);
    if (!file) return Response.json({ message: 'File tidak ditemukan.' }, { status: 404 });
    const safeFilename = file.filename.replace(/[\r\n"]/g, '_');
    return new Response(file.bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'File sumber tidak dapat dibaca.' }, { status: 404 });
  }
}

import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  deleteKnowledgeSource,
  getKnowledgePreview,
  updateKnowledgeSource,
} from '@/lib/knowledge-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function GET(_: Request, context: RouteContext<'/api/admin/knowledge/[id]'>) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  const id = parseId((await context.params).id);
  if (!id) return Response.json({ message: 'ID sumber tidak valid.' }, { status: 400 });
  const result = await getKnowledgePreview(id);
  return result
    ? Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
    : Response.json({ message: 'Sumber tidak ditemukan.' }, { status: 404 });
}

export async function PATCH(request: Request, context: RouteContext<'/api/admin/knowledge/[id]'>) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    const id = parseId((await context.params).id);
    if (!id) throw new Error('ID sumber tidak valid.');
    const source = await updateKnowledgeSource(id, await request.json());
    return source
      ? Response.json({ source })
      : Response.json({ message: 'Sumber tidak ditemukan.' }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sumber gagal diperbarui.';
    return Response.json({ message }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: RouteContext<'/api/admin/knowledge/[id]'>) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  const id = parseId((await context.params).id);
  if (!id) return Response.json({ message: 'ID sumber tidak valid.' }, { status: 400 });
  return await deleteKnowledgeSource(id)
    ? Response.json({ ok: true })
    : Response.json({ message: 'Sumber tidak ditemukan.' }, { status: 404 });
}

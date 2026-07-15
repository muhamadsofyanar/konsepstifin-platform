import { isAdminAuthenticated } from '@/lib/admin-auth';
import { deleteArticle, updateArticle, validateArticleInput } from '@/lib/article-store';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ message: 'ID artikel tidak valid.' }, { status: 400 });
  try {
    const article = await updateArticle(id, validateArticleInput(await request.json()));
    if (!article) return Response.json({ message: 'Artikel tidak ditemukan.' }, { status: 404 });
    return Response.json({ article });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Artikel gagal diperbarui.';
    const status = message.includes('duplicate key') ? 409 : 400;
    return Response.json({ message: status === 409 ? 'Slug sudah digunakan artikel lain.' : message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ message: 'ID artikel tidak valid.' }, { status: 400 });
  try {
    if (!await deleteArticle(id)) return Response.json({ message: 'Artikel tidak ditemukan.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Artikel gagal dihapus.' }, { status: 500 });
  }
}


import { isAdminAuthenticated } from '@/lib/admin-auth';
import { deleteComment, updateCommentStatus, type CommentStatus } from '@/lib/engagement-store';

const statuses: CommentStatus[] = ['pending', 'approved', 'spam', 'rejected'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ message: 'ID komentar tidak valid.' }, { status: 400 });
  const data = await request.json().catch(() => ({})) as { status?: string };
  if (!statuses.includes(data.status as CommentStatus)) return Response.json({ message: 'Status komentar tidak valid.' }, { status: 400 });
  try {
    if (!await updateCommentStatus(id, data.status as CommentStatus)) return Response.json({ message: 'Komentar tidak ditemukan.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Komentar gagal diperbarui.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ message: 'ID komentar tidak valid.' }, { status: 400 });
  try {
    if (!await deleteComment(id)) return Response.json({ message: 'Komentar tidak ditemukan.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Komentar gagal dihapus.' }, { status: 500 });
  }
}


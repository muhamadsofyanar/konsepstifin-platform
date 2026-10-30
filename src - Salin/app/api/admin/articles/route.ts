import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createArticle, getAdminArticles, validateArticleInput } from '@/lib/article-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    return Response.json({ articles: await getAdminArticles() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Database belum tersedia atau tidak dapat dihubungi.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    const article = await createArticle(validateArticleInput(await request.json()));
    return Response.json({ article }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Artikel gagal disimpan.';
    const status = message.includes('duplicate key') ? 409 : 400;
    return Response.json({ message: status === 409 ? 'Slug sudah digunakan artikel lain.' : message }, { status });
  }
}


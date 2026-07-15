import { isAdminAuthenticated } from '@/lib/admin-auth';
import { generateArticleDraft, validateGenerationRequest } from '@/lib/openai-content';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  const rate = checkRateLimit(request, 'admin-ai-article', 12, 60 * 60 * 1000);
  if (!rate.allowed) {
    return Response.json({ message: 'Batas pembuatan artikel AI tercapai. Coba lagi nanti.' }, {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfter) },
    });
  }
  try {
    const generated = await generateArticleDraft(validateGenerationRequest(await request.json()));
    return Response.json(generated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Artikel AI gagal dibuat.';
    const status = message.includes('OPENAI_API_KEY') ? 503 : 400;
    return Response.json({ message }, { status });
  }
}


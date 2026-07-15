import { createAdminSession, adminAuthConfigured, validateAdminCredentials } from '@/lib/admin-auth';

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  if (!adminAuthConfigured()) return Response.json({ message: 'Login admin belum dikonfigurasi.' }, { status: 503 });
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientKey = forwarded || 'unknown';
  const now = Date.now();
  const current = attempts.get(clientKey);
  if (current && current.resetAt > now && current.count >= 6) {
    return Response.json({ message: 'Terlalu banyak percobaan. Coba kembali 15 menit lagi.' }, { status: 429 });
  }
  if (!current || current.resetAt <= now) attempts.set(clientKey, { count: 0, resetAt: now + 15 * 60 * 1000 });

  let data: { email?: string; password?: string };
  try {
    data = await request.json();
  } catch {
    return Response.json({ message: 'Permintaan tidak valid.' }, { status: 400 });
  }
  if (!validateAdminCredentials(String(data.email ?? ''), String(data.password ?? ''))) {
    const attempt = attempts.get(clientKey)!;
    attempt.count += 1;
    return Response.json({ message: 'Email atau kata sandi tidak sesuai.' }, { status: 401 });
  }
  attempts.delete(clientKey);
  await createAdminSession(String(data.email));
  return Response.json({ ok: true });
}


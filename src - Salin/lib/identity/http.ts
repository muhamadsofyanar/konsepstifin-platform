import type { IdentityStore } from './store.ts';
export const ACCOUNT_COOKIE = 'konsepstifin_account';
const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
function sameOrigin(request: Request, origin: string): boolean {
  try { return new URL(origin).origin === origin && request.headers.get('origin') === origin; }
  catch { return false; }
}
function cookie(token: string, secure: boolean, maxAge: number) {
  return `${ACCOUNT_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Invalid body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Invalid body');
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8192) { await reader.cancel(); throw new Error('Invalid body'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function handleLogin(request: Request, store: Pick<IdentityStore, 'login'>, origin: string, secure: boolean, adminOnly = false): Promise<Response> {
  if (!sameOrigin(request, origin)) return json({ message: 'Permintaan ditolak.' }, 403);
  let input;
  try { input = await readBody(request); } catch { return json({ message: 'Permintaan tidak valid.' }, 400); }
  if (!input || Array.isArray(input) || typeof input.email !== 'string' || typeof input.password !== 'string')
    return json({ message: 'Email dan kata sandi diperlukan.' }, 400);
  try {
    const session = await store.login(input.email, input.password, adminOnly);
    if (!session) return json({ message: 'Email atau kata sandi tidak sesuai.' }, 401);
    const response = json({ ok: true });
    response.headers.set('Set-Cookie', cookie(session.token, secure, Math.max(0, Math.floor((session.expiresAt-Date.now())/1000))));
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      const response = json({ message: 'Coba kembali 15 menit lagi.' }, 429);
      response.headers.set('Retry-After', '900'); return response;
    }
    return json({ message: 'Layanan akun sementara tidak tersedia.' }, 503);
  }
}
export async function handleLogout(request: Request, store: Pick<IdentityStore, 'logout'>, origin: string, secure: boolean, token: string): Promise<Response> {
  if (!sameOrigin(request, origin)) return json({ message: 'Permintaan ditolak.' }, 403);
  try {
    await store.logout(token);
    const response = json({ ok: true });
    response.headers.set('Set-Cookie', cookie('', secure, 0)); return response;
  } catch { return json({ message: 'Keluar belum berhasil. Silakan coba lagi.' }, 503); }
}

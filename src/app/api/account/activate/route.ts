import { isSameOriginMutation } from '@/lib/admin-request';
import { readAdminJson } from '@/lib/admin-json';
import { activatePromoter } from '@/lib/network-store';
export const runtime = 'nodejs';
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return reply({ message: 'Permintaan ditolak.' }, 403);
  let data;
  try {
    data = await readAdminJson(request);
    if (Object.keys(data).some(key => !['token', 'password'].includes(key))
      || typeof data.token !== 'string' || !/^[a-f0-9]{64}$/.test(data.token)
      || typeof data.password !== 'string' || data.password.length < 12 || data.password.length > 1024) throw new Error('Invalid');
  } catch { return reply({ message: 'Tautan dan kata sandi tidak valid. Gunakan kata sandi 12–1024 karakter.' }, 400); }
  try {
    await activatePromoter(data.token as string, data.password as string);
    return reply({ ok: true });
  } catch { return reply({ message: 'Aktivasi gagal. Tautan mungkin kedaluwarsa atau sudah digunakan. Minta tautan baru kepada kepala cabang.' }, 400); }
}

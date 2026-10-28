import { getIdentityStore } from '@/lib/identity/server';
import { hashPassword } from '@/lib/identity/password';
import { isSameOriginMutation } from '@/lib/admin-request';
import { learningJson } from '@/lib/learning-http';
import { checkRateLimit } from '@/lib/rate-limit';
export async function POST(request: Request) { if (!isSameOriginMutation(request))
    return learningJson({ message: 'Permintaan ditolak.' }, 403); if (!checkRateLimit(request, 'member-register', 5, 3600000).allowed)
    return learningJson({ message: 'Terlalu banyak percobaan. Coba lagi nanti.' }, 429); try {
    const raw = await request.text();
    if (raw.length > 4096)
        throw new Error();
    const d = JSON.parse(raw);
    if (typeof d.email !== 'string' || typeof d.password !== 'string' || d.password.length < 12 || d.password.length > 1024)
        return learningJson({ message: 'Gunakan email valid dan kata sandi minimal 12 karakter.' }, 400);
    const store = getIdentityStore();
    if (!await store.consumeLoginAttempt('register:' + d.email))
        return learningJson({ message: 'Coba kembali nanti.' }, 429);
    try {
        await store.createAccount(d.email, await hashPassword(d.password), ['member']);
    }
    catch {
        return learningJson({ message: 'Pendaftaran belum berhasil. Jika email sudah terdaftar, gunakan halaman masuk.' }, 400);
    }
    return learningJson({ message: 'Akun peserta dibuat. Silakan masuk.' });
}
catch {
    return learningJson({ message: 'Pendaftaran belum tersedia. Coba kembali nanti.' }, 503);
} }

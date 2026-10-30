import { getAccountPrincipal } from '@/lib/identity/server';
import { isSameOriginMutation } from '@/lib/admin-request';
import { LearningError } from './learning-service';
export const learningJson = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
export async function learningGuard(request: Request, write = false, admin = false) { const p = await getAccountPrincipal(); if (!p?.active || !p.sessionValid)
    return { response: learningJson({ message: 'Silakan masuk.' }, 401) }; if (write && !isSameOriginMutation(request))
    return { response: learningJson({ message: 'Origin permintaan tidak valid.' }, 403) }; if (admin && !p.roles.some(r => ['admin', 'super_admin'].includes(r)))
    return { response: learningJson({ message: 'Akses admin diperlukan.' }, 403) }; return { principal: p }; }
export function learningFailure(e: unknown) { return e instanceof LearningError || e instanceof SyntaxError ? learningJson({ message: e instanceof SyntaxError ? 'JSON tidak valid.' : e.message }, 400) : learningJson({ message: 'Layanan belum dapat diakses. Silakan coba kembali atau hubungi pengelola.' }, 503); }

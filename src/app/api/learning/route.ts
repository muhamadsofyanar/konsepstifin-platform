import { ensureProductSchema, getManagedProducts } from '@/lib/product-store';
import { cookies } from 'next/headers';
import { getLearningService } from '@/lib/learning-store';
import { learningGuard, learningJson, learningFailure } from '@/lib/learning-http';
import { REFERRAL_COOKIE } from '@/lib/referral-service';
import { LearningError, positive } from '@/lib/learning-service';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
    try {
        const u = new URL(request.url), view = u.searchParams.get('view') ?? 'catalog', s = getLearningService();
        if (view === 'catalog') { await ensureProductSchema(); return learningJson({ products: await s.catalog() }); }
        if (view === 'certificate')
            return learningJson({ certificate: await s.verifyCertificate(u.searchParams.get('code') ?? '') });
        const g = await learningGuard(request, false, view === 'admin' || view === 'setup' || view === 'users');
        if (g.response)
            return g.response;
        const user = g.principal!.userId;
        if (view === 'partner' && !g.principal!.roles.some(r => ['promoter', 'affiliate'].includes(r)))
            return learningJson({ message: 'Akses mitra diperlukan.' }, 403);
        if (view === 'users')
            return learningJson({ users: await s.searchUsers(u.searchParams.get('q') ?? '') });
        if (view === 'setup')
            return learningJson(await s.readiness());
        if (view === 'admin') { await ensureProductSchema(); const data=await s.adminData();const legacy=await getManagedProducts();return learningJson({...data,products:data.products.map(p=>({...p,...(p.source_product_key?{serviceDetails:legacy.find(l=>l.productKey===p.source_product_key)}:{})}))}); }
        if (view === 'dashboard')
            return learningJson(await s.dashboard(user));
        if (view === 'partner')
            return learningJson(await s.partner(user));
        if (view === 'syllabus')
            return learningJson({ lessons: await s.syllabus(user, positive(u.searchParams.get('id'))) });
        if (view === 'material') {
            const l = await s.material(user, positive(u.searchParams.get('id')));
            const { file_path, ...safe } = l;
            return learningJson({ material: { ...safe, hasFile: Boolean(file_path) } });
        }
        throw new LearningError('Tampilan tidak dikenal.');
    }
    catch (e) {
        return learningFailure(e);
    }
}
const adminActions = new Set(['product.save', 'product.delete', 'lesson.delete', 'lesson.save', 'coupon.save', 'grant', 'commission', 'payout', 'certificate.issue', 'certificate.revoke', 'ticket.reply', 'reconcile']);
export async function POST(request: Request) {
    try {
        if (Number(request.headers.get('content-length') ?? 0) > 120000)
            return learningJson({ message: 'Data terlalu besar.' }, 413);
        const raw = await request.text();
        if (raw.length > 120000)
            return learningJson({ message: 'Data terlalu besar.' }, 413);
        const input = JSON.parse(raw);
        if (!input || typeof input !== 'object' || Array.isArray(input))
            throw new LearningError('Data tidak valid.');
        const g = await learningGuard(request, true, adminActions.has(input.action));
        if (g.response)
            return g.response;
        const user = g.principal!.userId, s = getLearningService();
        if (input.action === 'payout.request' && !g.principal!.roles.some(r => ['promoter', 'affiliate'].includes(r)))
            return learningJson({ message: 'Akses mitra diperlukan.' }, 403);
        let result;
        switch (input.action) {
            case 'checkout':
                result = await s.checkout(user, input, (await cookies()).get(REFERRAL_COOKIE)?.value ?? null);
                break;
            case 'complete':
                result = await s.complete(user, positive(input.id));
                break;
            case 'payout.request':
                result = await s.requestPayout(user, input);
                break;
            case 'ticket':
                result = await s.ticket(user, input.subject, input.message);
                break;
            case 'product.save':
                result = await s.saveProduct(input, user);
                break;
            case 'product.delete': result = await s.removeProduct(positive(input.id), user); break;
            case 'lesson.delete': result = await s.removeLesson(positive(input.id), user); break;
            case 'lesson.save':
                result = await s.saveLesson(input, user);
                break;
            case 'coupon.save':
                result = await s.saveCoupon(input, user);
                break;
            case 'grant':
                result = await s.manualGrant(input.userId, positive(input.productId), input.reason, user);
                break;
            case 'commission':
                result = await s.commissionCommand(positive(input.id), input.state, input.reason, user);
                break;
            case 'payout':
                result = await s.payoutCommand(positive(input.id), input.state, input.reason, user);
                break;
            case 'certificate.issue':
                result = await s.issueCertificate(input.userId, positive(input.productId), input.name, user);
                break;
            case 'certificate.revoke':
                result = await s.revokeCertificate(input.code, input.reason, user);
                break;
            case 'ticket.reply':
                result = await s.replyTicket(positive(input.id), input.reply, user);
                break;
            case 'reconcile':
                result = await s.processPending();
                break;
            default: throw new LearningError('Tindakan tidak dikenal.');
        }
        return learningJson({ result: result ?? { saved: true } });
    }
    catch (e) {
        return learningFailure(e);
    }
}

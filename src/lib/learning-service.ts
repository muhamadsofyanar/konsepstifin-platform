/** One ledger, additive learning module. No external payment or messaging side effects. */
import { createHash, randomUUID } from 'node:crypto';
import type { CommerceDatabase, CommerceQuery } from './commerce-service.ts';
import { productSlug } from './slug.ts';
type Row = Record<string, unknown>;
export class LearningError extends Error {
}
export function positive(value: unknown) { const n = Number(value); if (!Number.isSafeInteger(n) || n < 1)
    throw new LearningError('ID tidak valid.'); return n; }
function integer(v: unknown, min = 0, max = 999999999999) { if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < min || v > max)
    throw new LearningError('Nilai angka tidak valid.'); return v; }
function text(v: unknown, max = 200, optional = false) { if (typeof v !== 'string' || v.length > max || (!optional && !v.trim()))
    throw new LearningError('Isi teks wajib dan batas panjang harus sesuai.'); return v.trim(); }
export function safeLearningUrl(v: unknown) { const raw = text(v ?? '', 2000, true); if (!raw)
    return ''; let u; try {
    u = new URL(raw);
}
catch {
    throw new LearningError('Tautan tidak valid.');
} if (u.protocol !== 'https:' || u.username || u.password)
    throw new LearningError('Gunakan tautan HTTPS tanpa kredensial.'); return u.href; }
export function safePrivatePath(v: unknown) { const s = text(v ?? '', 300, true); if (s && (!/^[a-zA-Z0-9_./-]+$/.test(s) || s.startsWith('/') || s.split('/').some(x => x === '..' || !x)))
    throw new LearningError('Path file privat tidak valid.'); return s; }
export class LearningService {
    private db: CommerceDatabase;
    constructor(db: CommerceDatabase) { this.db = db; }
    private async audit(q: CommerceQuery, actor: string, action: string, entity: unknown, payload: unknown = {}) { await q.query('INSERT INTO learning_audit(actor,action,entity,payload) VALUES($1,$2,$3,$4::text::jsonb)', [actor, action, String(entity), JSON.stringify(payload)]); }
    private async lockUser(q: CommerceQuery, user: string) { if (!(await q.query('SELECT id FROM platform_users WHERE id=$1 AND active=true FOR UPDATE', [user])).length)
        throw new LearningError('Akun aktif diperlukan.'); }
    async catalog(admin = false) { return this.db.query(`SELECT id,slug,title,description,kind,state,price,access_days,commission_bps,attribution_enabled,source_product_key,price_note FROM learning_products ${admin ? '' : "WHERE state='published'"} ORDER BY source_product_key NULLS LAST,id DESC LIMIT 200`); }
    async publicProduct(identifier: string, service = false) {
        return (await this.db.query(`SELECT id,slug,title,description,kind,state,price,access_days,commission_bps,attribution_enabled,source_product_key,price_note FROM learning_products WHERE ${service ? 'source_product_key' : 'slug'}=$1 AND state='published' ${service ? '' : 'AND source_product_key IS NULL'}`, [identifier]))[0] ?? null;
    }
    async saveProduct(input: Row, actor: string): Promise<Row & {
        id: number;
    }> {
        const title = text(input.title), requestedSlug = text(input.slug ?? '', 100, true);
        if (requestedSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedSlug))
            throw new LearningError('Slug tidak valid.');
        const kind = text(input.kind), state = text(input.state);
        if (!['course', 'ebook', 'webinar', 'consultation', 'bundle'].includes(kind) || !['draft', 'published', 'archived'].includes(state))
            throw new LearningError('Jenis atau status tidak valid.');
        // Bundles need their fulfillment content defined first; publish only implemented kinds.
        if (kind === 'bundle' && state === 'published')
            throw new LearningError('Bundel belum dapat diterbitkan pada rilis ini.');
        const price = integer(input.price), days = (input.accessDays === undefined ? input.access_days : input.accessDays) === null || (input.accessDays === undefined ? input.access_days : input.accessDays) === undefined || input.accessDays === '' ? null : integer(input.accessDays === undefined ? input.access_days : input.accessDays, 1, 36500), bps = integer(input.commissionBps ?? input.commission_bps ?? 0, 0, 10000);
        if (input.attributionEnabled !== true && input.attribution_enabled !== true && bps)
            throw new LearningError('Aktifkan kebijakan atribusi sebelum menetapkan komisi.');
        return this.db.transaction(async (q) => {
        // Serialize slug allocation with product updates/deletes, including concurrent inserts.
        await q.query('LOCK TABLE learning_products IN SHARE ROW EXCLUSIVE MODE');
        const current = input.id ? (await q.query('SELECT * FROM learning_products WHERE id=$1 FOR UPDATE', [positive(input.id)]))[0] : null;
        if (input.id && !current) throw new LearningError('Produk tidak ditemukan.');
        if (current?.source_product_key && kind !== 'consultation') throw new LearningError('Layanan lama harus tetap bertipe layanan.');
        if (current && current.kind !== kind && (await q.query('SELECT id FROM learning_purchases WHERE product_id=$1 UNION ALL SELECT id FROM learning_grants WHERE product_id=$1 LIMIT 1', [current.id])).length)
            throw new LearningError('Jenis produk yang sudah digunakan tidak dapat diganti. Buat produk baru.');
        let slug = requestedSlug || (current ? String(current.slug) : productSlug(title));
        const existing = await q.query('SELECT id,slug FROM learning_products WHERE id<>$1', [current?.id ?? 0]);
        if (requestedSlug && existing.some(p => p.slug === slug)) throw new LearningError('Slug sudah digunakan. Kosongkan untuk membuat otomatis atau pilih slug lain.');
        if (!requestedSlug && !current) { const base = slug; let suffix = 2; while (existing.some(p => p.slug === slug)) slug = base + '-' + suffix++; }
        const ebookFile = kind === 'ebook' ? safePrivatePath(input.ebookFilePath) : '';
        const downloads = current ? await q.query("SELECT * FROM learning_lessons WHERE product_id=$1 AND kind='file' ORDER BY id", [current.id]) : [];
        if (kind === 'ebook' && state === 'published' && !ebookFile && !downloads.some(l => l.state === 'published'))
            throw new LearningError('Unggah file ebook sebelum menerbitkan produk.');
        const args = [slug, title, text(input.description ?? '', 20000, true), kind, state, price, days, bps, input.attributionEnabled === true || input.attribution_enabled === true];
        let rows; if (input.id) {
            rows = await q.query('UPDATE learning_products SET slug=$1,title=$2,description=$3,kind=$4,state=$5,price=$6,access_days=$7,commission_bps=$8,attribution_enabled=$9,updated_at=now() WHERE id=$10 RETURNING *', [...args, positive(input.id)]);
        }
        else {
            rows = await q.query('INSERT INTO learning_products(slug,title,description,kind,state,price,access_days,commission_bps,attribution_enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', args);
        } if (!rows[0])
            throw new LearningError('Produk tidak ditemukan.');
        if (ebookFile) {
            const download = downloads[0];
            if (download) await q.query("UPDATE learning_lessons SET title=$1,file_path=$2,state=$3,preview=false,unlock_days=0,required=false WHERE id=$4", [title, ebookFile, state === 'published' ? 'published' : 'draft', download.id]);
            else await q.query("INSERT INTO learning_lessons(product_id,module,title,kind,file_path,required,preview,state) VALUES($1,'Ebook',$2,'file',$3,false,false,$4)", [rows[0].id, title, ebookFile, state === 'published' ? 'published' : 'draft']);
        }
        if (current?.source_product_key) await q.query('UPDATE public_products SET title=$1,description=$2,price=$3,active=$4,features=COALESCE($6::text::jsonb,features),bonuses=COALESCE($7::text::jsonb,bonuses),price_note=COALESCE($8,price_note),eyebrow=COALESCE($9,eyebrow),updated_at=now() WHERE product_key=$5', [title, args[2], 'Rp' + price.toLocaleString('id-ID'), state === 'published', current.source_product_key, typeof input.featuresText==='string'?JSON.stringify(text(input.featuresText,20000,true).split('\n').map(s=>s.trim()).filter(Boolean)):null,typeof input.bonusesText==='string'?JSON.stringify(text(input.bonusesText,20000,true).split('\n').map(s=>s.trim()).filter(Boolean)):null,typeof input.priceNote==='string'?text(input.priceNote,500,true):null,typeof input.eyebrow==='string'?text(input.eyebrow,200,true):null]);
        if (kind === 'ebook') await q.query("UPDATE learning_lessons SET preview=false,unlock_days=0,required=false,state=CASE WHEN kind='file' THEN state ELSE 'archived' END WHERE product_id=$1", [rows[0].id]);
        await this.audit(q, actor, 'product.save', rows[0].id, { title, price, bps, days }); return { ...rows[0], id: Number(rows[0].id) }; });
    }
    async removeProduct(id: number, actor: string) {
        return this.db.transaction(async q => {
            await q.query('LOCK TABLE learning_products IN SHARE ROW EXCLUSIVE MODE');
            const p = (await q.query('SELECT * FROM learning_products WHERE id=$1 FOR UPDATE', [positive(id)]))[0];
            if (!p) throw new LearningError('Produk tidak ditemukan.');
            if (p.source_product_key) {
                await q.query("UPDATE learning_products SET state='archived',updated_at=now() WHERE id=$1", [id]);
                await q.query('UPDATE public_products SET active=false,updated_at=now() WHERE product_key=$1', [p.source_product_key]);
                await this.audit(q, actor, 'product.archive', id);
                return { archived: true, message: 'Layanan disembunyikan dari katalog dan halaman publik. Riwayat tetap tersimpan.' };
            }
            const used = await q.query('SELECT id FROM learning_purchases WHERE product_id=$1 UNION ALL SELECT id FROM learning_grants WHERE product_id=$1 UNION ALL SELECT 1 FROM learning_certificates WHERE product_id=$1 LIMIT 1', [id]);
            if (used.length) {
                await q.query("UPDATE learning_products SET state='archived',updated_at=now() WHERE id=$1", [id]);
                await this.audit(q, actor, 'product.archive', id);
                return { archived: true, message: 'Produk diarsipkan karena memiliki riwayat. Akses pembeli dan transaksi tetap tersimpan.' };
            }
            await q.query('DELETE FROM learning_lessons WHERE product_id=$1', [id]);
            await q.query('DELETE FROM learning_coupons WHERE product_id=$1', [id]);
            await q.query('DELETE FROM learning_products WHERE id=$1', [id]);
            await this.audit(q, actor, 'product.delete', id, { title: p.title });
            return { deleted: true, message: 'Produk dan materi yang belum digunakan berhasil dihapus.' };
        });
    }
    async removeLesson(id: number, actor: string) {
        return this.db.transaction(async q => {
            // Same lock order as checkout: product, then lesson.
            const ref = (await q.query('SELECT product_id FROM learning_lessons WHERE id=$1', [positive(id)]))[0];
            if (!ref) throw new LearningError('Materi tidak ditemukan.');
            await q.query('SELECT id FROM learning_products WHERE id=$1 FOR UPDATE', [ref.product_id]);
            const l = (await q.query('SELECT * FROM learning_lessons WHERE id=$1 FOR UPDATE', [id]))[0];
            if (!l) throw new LearningError('Materi tidak ditemukan.');
            const used = await q.query('SELECT id FROM learning_grants WHERE product_id=$1 UNION ALL SELECT id FROM learning_purchases WHERE product_id=$1 UNION ALL SELECT 1 FROM learning_progress WHERE lesson_id=$2 LIMIT 1', [l.product_id, id]);
            if (used.length) await q.query("UPDATE learning_lessons SET state='archived' WHERE id=$1", [id]);
            else await q.query('DELETE FROM learning_lessons WHERE id=$1', [id]);
            await this.audit(q, actor, used.length ? 'lesson.archive' : 'lesson.delete', id);
            return { archived: !!used.length, message: used.length ? 'Materi diarsipkan. Materi wajib pada pembelian lama tetap dapat diselesaikan.' : 'Materi berhasil dihapus.' };
        });
    }
    async saveLesson(input: Row, actor: string): Promise<Row & {
        id: number;
    }> {
        const productId = positive(input.productId), kind = text(input.kind), state = text(input.state ?? 'draft');
        if (!['text', 'video', 'link', 'file'].includes(kind) || !['draft', 'published', 'archived'].includes(state))
            throw new LearningError('Jenis atau status materi tidak valid.');
        const args = [productId, text(input.module), text(input.title), kind, text(input.body ?? '', 100000, true), safeLearningUrl(input.url), safePrivatePath(input.filePath), integer(input.position ?? 0, 0, 100000), integer(input.unlockDays ?? 0, 0, 36500), input.required !== false, input.preview === true, state];
        if (kind === 'file' && !args[6] || ['video', 'link'].includes(kind) && !args[5])
            throw new LearningError('Isi tautan atau file materi.');
        return this.db.transaction(async (q) => {
        const parent = (await q.query('SELECT * FROM learning_products WHERE id=$1 FOR UPDATE', [productId]))[0];
        if (!parent) throw new LearningError('Produk tidak ditemukan.');
        if (parent.kind === 'ebook' && (kind !== 'file' || input.preview === true || Number(input.unlockDays ?? 0) > 0)) throw new LearningError('Ebook menggunakan file privat tanpa pratinjau atau jadwal modul.');
        if (input.id && (await q.query('SELECT id FROM learning_grants WHERE product_id=$1 UNION ALL SELECT id FROM learning_purchases WHERE product_id=$1 LIMIT 1', [productId])).length) {
            const original = (await q.query('SELECT required FROM learning_lessons WHERE id=$1 AND product_id=$2', [positive(input.id), productId]))[0];
            if (original?.required && state !== 'published' && state !== 'archived') throw new LearningError('Materi wajib sudah digunakan. Gunakan arsip agar pembeli lama tetap dapat menyelesaikannya.');
        }
        let rows; if (input.id) {
            rows = await q.query('UPDATE learning_lessons SET product_id=$1,module=$2,title=$3,kind=$4,body=$5,url=$6,file_path=$7,position=$8,unlock_days=$9,required=$10,preview=$11,state=$12 WHERE id=$13 AND product_id=$1 RETURNING *', [...args, positive(input.id)]);
        }
        else
            rows = await q.query('INSERT INTO learning_lessons(product_id,module,title,kind,body,url,file_path,position,unlock_days,required,preview,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *', args); if (!rows[0])
            throw new LearningError('Materi tidak ditemukan.'); await this.audit(q, actor, 'lesson.save', rows[0].id); return { ...rows[0], id: Number(rows[0].id) }; });
    }
    async saveCoupon(input: Row, actor: string) { const code = text(input.code, 40).toUpperCase(); if (!/^[A-Z0-9-]+$/.test(code))
        throw new LearningError('Kode kupon tidak valid.'); const values = [code, positive(input.productId), integer(input.discount, 1), integer(input.maxUses, 1, 1000000), integer(input.perUser ?? 1, 1, 1000000), input.expiresAt ? new Date(String(input.expiresAt)).toISOString() : null]; return this.db.transaction(async (q) => { await q.query('INSERT INTO learning_coupons(code,product_id,discount,max_uses,per_user,expires_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(code) DO UPDATE SET discount=$3,max_uses=$4,per_user=$5,expires_at=$6', values); await this.audit(q, actor, 'coupon.save', code); return { code }; }); }
    async checkout(user: string, input: Row, referralToken: string | null) {
        const productId = positive(input.productId), key = text(input.key, 100), name = text(input.name), phone = text(input.phone, 40), coupon = text(input.coupon ?? '', 40, true).toUpperCase();
        const payload = JSON.stringify({ productId, name, phone, coupon });
        return this.db.transaction(async (q) => {
            await this.lockUser(q, user);
            const previous = (await q.query('SELECT * FROM learning_purchases WHERE user_id=$1 AND request_key=$2', [user, key]))[0];
            if (previous) {
                if (previous.payload !== payload)
                    throw new LearningError('Kunci permintaan telah digunakan untuk data berbeda.');
                return this.purchaseResult(q, previous);
            }
            const p = (await q.query("SELECT * FROM learning_products WHERE id=$1 AND state='published' FOR SHARE", [productId]))[0];
            if (!p)
                throw new LearningError('Produk belum tersedia.');
            if (p.source_product_key) throw new LearningError('Layanan tes dipesan melalui formulir layanan untuk koordinasi jadwal dan peserta.');
            let price = Number(p.price);
            if (coupon) {
                const cp = (await q.query('SELECT * FROM learning_coupons WHERE code=$1 AND product_id=$2 AND active=true AND (expires_at IS NULL OR expires_at>now()) FOR UPDATE', [coupon, productId]))[0];
                if (!cp)
                    throw new LearningError('Kupon tidak berlaku.');
                const uses = await q.query('SELECT user_id FROM learning_purchases WHERE coupon_code=$1', [coupon]);
                if (uses.length >= Number(cp.max_uses) || uses.filter(r => r.user_id === user).length >= Number(cp.per_user))
                    throw new LearningError('Batas penggunaan kupon tercapai.');
                price = Math.max(0, price - Number(cp.discount));
            }
            let ref: Row | undefined;
            if (p.attribution_enabled === true && referralToken) {
                ref = (await q.query(`SELECT a.user_id,v.alias FROM platform_referral_visits v JOIN platform_referral_aliases a ON a.alias=v.alias JOIN platform_users u ON u.id=a.user_id WHERE v.token_hash=$1 AND v.expires_at>now() AND u.active=true AND u.id<>$2 AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('promoter','affiliate'))`, [createHash('sha256').update(referralToken).digest('hex'), user]))[0];
            }
            const required = (await q.query("SELECT id FROM learning_lessons WHERE product_id=$1 AND state='published' AND required=true ORDER BY position,id", [productId])).map(r => Number(r.id));
            const snapshot = { title: p.title, kind: p.kind, price, listPrice: Number(p.price), accessDays: p.access_days, commissionBps: Number(p.commission_bps), attribution: 'first-touch-30-days-per-checkout; self-excluded', required };
            let order: Row | undefined;
            if (price > 0) {
                const account = (await q.query('SELECT email FROM platform_users WHERE id=$1', [user]))[0];
                const number = 'KS-' + randomUUID().toUpperCase();
                order = (await q.query("INSERT INTO commerce_orders(number,lead_id,customer_name,customer_phone,customer_email,state,lines,total,create_key,create_payload,created_by) VALUES($1,NULL,$2,$3,$4,'issued',$5::text::jsonb,$6,$7,$8,$9) RETURNING *", [number, name, phone, account.email, JSON.stringify([{ name: String(p.title), unitPrice: price, quantity: 1 }]), price, 'learning:' + user + ':' + key, payload, user]))[0];
                await q.query('INSERT INTO commerce_audit(order_id,action,operation_key,payload,actor) VALUES($1,$2,$3,$4,$5)', [order.id, 'create', key, payload, user]);
            }
            const purchase = (await q.query('INSERT INTO learning_purchases(user_id,product_id,order_id,request_key,payload,snapshot,partner_user_id,referral_alias,coupon_code) VALUES($1,$2,$3,$4,$5,$6::text::jsonb,$7,$8,$9) RETURNING *', [user, productId, order?.id ?? null, key, payload, JSON.stringify(snapshot), ref?.user_id ?? null, ref?.alias ?? '', coupon || null]))[0];
            if (!price)
                await this.grant(q, purchase, 'free');
            await this.audit(q, user, 'checkout', purchase.id, { productId, orderId: order?.id ?? null });
            return this.purchaseResult(q, purchase);
        });
    }
    /** Called in the same transaction as CRM order creation. No invented customer account. */
    async attachServiceOrder(q: CommerceQuery, orderId: number, leadId: number, total: number) {
        const lead = (await q.query('SELECT * FROM public_interest_leads WHERE id=$1', [leadId]))[0];
        if (!lead?.product_key) return;
        const p = (await q.query("SELECT * FROM learning_products WHERE source_product_key=$1 AND state='published' FOR SHARE", [lead.product_key]))[0];
        if (!p) return;
        const partner = lead.source_partner_user_id && p.attribution_enabled ? (await q.query("SELECT id FROM platform_users WHERE id=$1 AND active=true AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=platform_users.id AND r.role IN ('promoter','affiliate')) AND lower(email)<>lower($2)", [lead.source_partner_user_id, lead.email || '']))[0] : null;
        const buyer = lead.email ? (await q.query('SELECT id FROM platform_users WHERE lower(email)=lower($1) AND active=true', [lead.email]))[0] : null;
        const snapshot = { title: p.title, kind: 'service', price: total, listPrice: total, commissionBps: Number(p.commission_bps), accessDays: null, required: [], productKey: lead.product_key, leadId };
        await q.query('INSERT INTO learning_purchases(user_id,product_id,order_id,request_key,payload,snapshot,partner_user_id,referral_alias) VALUES($8,$1,$2,$3,$4,$5::text::jsonb,$6,$7) ON CONFLICT(order_id) DO NOTHING', [p.id, orderId, 'service:' + orderId, JSON.stringify({ leadId, orderId }), JSON.stringify(snapshot), partner?.id ?? null, partner ? lead.source_referral_alias || '' : '', buyer?.id ?? null]);
    }
    private async purchaseResult(q: CommerceQuery, p: Row) { if (p.order_id) {
        const row = (await q.query('SELECT id,number,total,state FROM commerce_orders WHERE id=$1', [p.order_id]))[0];
        return { ...row, id: Number(row.id), purchaseId: Number(p.id), free: false };
    } return { id: null, purchaseId: Number(p.id), total: 0, free: true }; }
    private async grant(q: CommerceQuery, p: Row, source = 'payment') {
        const snap = p.snapshot as Row;
        const existing = await q.query('SELECT id FROM learning_grants WHERE purchase_id=$1', [p.id]);
        if (existing.length)
            return;
        const previous = (await q.query("SELECT * FROM learning_grants WHERE user_id=$1 AND product_id=$2 AND status='active' AND (expires_at IS NULL OR expires_at>now()) ORDER BY expires_at DESC NULLS FIRST LIMIT 1", [p.user_id, p.product_id]))[0];
        const now = new Date();
        const start = previous?.started_at ?? now.toISOString();
        const base = previous?.expires_at ? Math.max(new Date(String(previous.expires_at)).getTime(), now.getTime()) : now.getTime();
        const expires = previous && previous.expires_at === null ? null : snap.accessDays ? new Date(base + Number(snap.accessDays) * 86400000).toISOString() : null;
        await q.query('INSERT INTO learning_grants(user_id,product_id,purchase_id,source,started_at,expires_at,required_lessons,duration_days) VALUES($1,$2,$3,$4,$5,$6,$7::text::jsonb,$8)', [p.user_id, p.product_id, p.id, source, start, expires, JSON.stringify(snap.required ?? []), snap.accessDays ?? null]);
        await q.query("INSERT INTO learning_notifications(event_key,user_id,message) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", ['grant:' + p.id, p.user_id, 'Akses tersedia: ' + String(snap.title)]);
    }
    private async rebalanceGrants(q: CommerceQuery, user: string, productId: number) {
        const grants = await q.query("SELECT * FROM learning_grants WHERE user_id=$1 AND product_id=$2 AND status='active' ORDER BY created_at,id FOR UPDATE", [user, productId]);
        let end: number | null | undefined;
        for (const g of grants) {
            const at = new Date(String(g.created_at)).getTime();
            const expiry = end === null || g.duration_days === null ? null : Math.max(at, end ?? at) + Number(g.duration_days) * 86400000;
            await q.query('UPDATE learning_grants SET expires_at=$1 WHERE id=$2', [expiry === null ? null : new Date(expiry).toISOString(), g.id]);
            end = expiry;
        }
    }
    private async lockCommissionOrders(q: CommerceQuery, user: string) {
        await q.query('SELECT o.id FROM commerce_orders o WHERE EXISTS(SELECT 1 FROM learning_purchases p JOIN affiliate_entries e ON e.purchase_id=p.id WHERE p.order_id=o.id AND e.user_id=$1) ORDER BY o.id FOR UPDATE', [user]);
    }
    private async assertPayable(q: CommerceQuery, user: string, payoutId?: number) {
        const invalid = await q.query(`SELECT e.id FROM affiliate_entries e JOIN learning_purchases p ON p.id=e.purchase_id JOIN commerce_orders o ON o.id=p.order_id WHERE e.user_id=$1 AND ((e.state='available' AND $2::bigint IS NULL) OR e.payout_id=$2) AND (o.state<>'issued' OR (SELECT COALESCE(sum(amount),0) FROM commerce_ledger WHERE order_id=o.id)<>o.total OR EXISTS(SELECT 1 FROM learning_jobs j WHERE j.order_id=o.id)) LIMIT 1`, [user, payoutId ?? null]);
        if (invalid.length)
            throw new LearningError('Pembayaran komisi berubah atau masih perlu rekonsiliasi. Periksa sebelum pencairan.');
    }
    async reconcile(orderId: number) {
        return this.db.transaction(async (q) => {
            // Lock order then buyer. Receipt and refund serialize on the existing order lock.
            const order = (await q.query('SELECT * FROM commerce_orders WHERE id=$1 FOR UPDATE', [positive(orderId)]))[0];
            if (!order)
                return;
            const p = (await q.query('SELECT * FROM learning_purchases WHERE order_id=$1', [orderId]))[0];
            if (!p)
                return;
            await q.query('SELECT id FROM platform_users WHERE id=$1 OR id=$2 ORDER BY id FOR UPDATE', [p.user_id, p.partner_user_id ?? p.user_id]);
            const ledger = await q.query('SELECT * FROM commerce_ledger WHERE order_id=$1 ORDER BY id', [orderId]);
            const balance = ledger.reduce((a, e) => a + Number(e.amount), 0);
            const paid = balance === Number(order.total) && order.state === 'issued';
            const grant = (await q.query('SELECT * FROM learning_grants WHERE purchase_id=$1', [p.id]))[0];
            if (paid && !grant && (p.snapshot as Row).kind !== 'service')
                await this.grant(q, p);
            if (!paid && grant) {
                await q.query("UPDATE learning_grants SET status='suspended',reason='Pembayaran berkurang; perlu peninjauan admin' WHERE purchase_id=$1 AND status='active'", [p.id]);
                await q.query("UPDATE learning_certificates SET revoked_at=COALESCE(revoked_at,now()),reason='Perubahan pembayaran; perlu peninjauan' WHERE user_id=$1 AND product_id=$2", [p.user_id, p.product_id]);
                await this.rebalanceGrants(q, String(p.user_id), Number(p.product_id));
            }
            const snap = p.snapshot as Row, commission = Number(BigInt(String(snap.price)) * BigInt(String(snap.commissionBps)) / BigInt(10000));
            if (p.partner_user_id && commission > 0) {
                // Lock partner before changing any available balance. Payout takes the same lock.
                // Buyer and partner already locked in UUID order above.
                if (paid)
                    await q.query("INSERT INTO affiliate_entries(user_id,purchase_id,amount,event_key) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING", [p.partner_user_id, p.id, commission, 'commission:' + p.id]);
                const original = (await q.query("SELECT * FROM affiliate_entries WHERE event_key=$1", ['commission:' + p.id]))[0];
                if (!paid && original) {
                    await q.query("INSERT INTO affiliate_entries(user_id,purchase_id,amount,state,event_key,reverses_id,reason) VALUES($1,$2,$3,'reversed',$4,$5,'Pembayaran dikurangi; penyelesaian manual bila sudah dibayar') ON CONFLICT DO NOTHING", [p.partner_user_id, p.id, -Number(original.amount), 'reversal:' + p.id, original.id]);
                    if (['pending', 'approved', 'available'].includes(String(original.state)))
                        await q.query("UPDATE affiliate_entries SET state='reversed' WHERE id=$1", [original.id]);
                }
            }
            await q.query('DELETE FROM learning_jobs WHERE order_id=$1', [orderId]);
        });
    }
    async processPending(limit = 20) { const rows = await this.db.query('SELECT order_id FROM learning_jobs ORDER BY updated_at LIMIT $1', [limit]); for (const row of rows) {
        try {
            await this.reconcile(Number(row.order_id));
        }
        catch {
            await this.db.query("UPDATE learning_jobs SET attempts=attempts+1,last_error='Rekonsiliasi gagal; periksa akun/database' WHERE order_id=$1", [row.order_id]);
        }
    } return rows.length; }
    async manualGrant(user: string, productId: number, reason: string, actor: string) { text(reason, 1000); return this.db.transaction(async (q) => { await this.lockUser(q, user); const p = (await q.query('SELECT * FROM learning_products WHERE id=$1', [positive(productId)]))[0]; if (!p)
        throw new LearningError('Produk tidak ditemukan.'); if (p.source_product_key) throw new LearningError('Layanan tes dikelola melalui CRM dan pesanan, bukan hak akses kelas.'); const required = (await q.query("SELECT id FROM learning_lessons WHERE product_id=$1 AND required=true AND state='published'", [productId])).map(r => Number(r.id)); const row = (await q.query('INSERT INTO learning_grants(user_id,product_id,source,reason,expires_at,required_lessons,duration_days) VALUES($1,$2,$3,$4,CASE WHEN $5::int IS NULL THEN NULL ELSE now()+$5::int*interval \'1 day\' END,$6::text::jsonb,$5) RETURNING id', [user, productId, 'admin', reason, p.access_days, JSON.stringify(required)]))[0]; await this.audit(q, actor, 'grant.manual', row.id, { reason, user }); return row; }); }
    async syllabus(user: string, productId: number) { return this.db.query(`SELECT l.id,l.product_id,l.module,l.title,l.kind,l.position,l.unlock_days,l.required,l.preview FROM learning_lessons l WHERE l.product_id=$1 AND (l.state='published' OR (l.state='archived' AND EXISTS(SELECT 1 FROM learning_grants g WHERE g.product_id=l.product_id AND g.user_id=$2 AND g.status='active' AND (g.expires_at IS NULL OR g.expires_at>now()) AND g.required_lessons @> to_jsonb(l.id)))) ORDER BY l.position,l.id`, [positive(productId), user]); }
    private async accessible(q: CommerceQuery, user: string, lessonId: number) {
        const l = (await q.query("SELECT l.* FROM learning_lessons l JOIN learning_products p ON p.id=l.product_id WHERE l.id=$1 AND l.state IN ('published','archived') AND p.state<>'draft'", [positive(lessonId)]))[0];
        if (!l)
            throw new LearningError('Materi tidak ditemukan.');
        const g = (await q.query("SELECT * FROM learning_grants WHERE user_id=$1 AND product_id=$2 AND status='active' AND (expires_at IS NULL OR expires_at>now()) ORDER BY started_at LIMIT 1", [user, l.product_id]))[0];
        if (l.state === 'archived' && (!g || !(g.required_lessons as number[]).includes(Number(l.id)))) throw new LearningError('Materi telah diarsipkan.');
        if (!g && !l.preview)
            throw new LearningError('Akses kelas belum aktif atau sudah berakhir.');
        if (!l.preview && g && new Date(String(g.started_at)).getTime() + Number(l.unlock_days) * 86400000 > Date.now())
            throw new LearningError('Materi masih terkunci.');
        return { l, g };
    }
    async material(user: string, lessonId: number) { return this.db.transaction(async (q) => { const { l, g } = await this.accessible(q, user, lessonId); if (g)
        await q.query('UPDATE learning_grants SET last_lesson_id=$1 WHERE user_id=$2 AND product_id=$3 AND status=$4', [lessonId, user, l.product_id, 'active']); return l; }); }
    async complete(user: string, lessonId: number) { return this.db.transaction(async (q) => { const { g } = await this.accessible(q, user, lessonId); if (!g)
        throw new LearningError('Daftar kelas sebelum menyimpan progres.'); await q.query('INSERT INTO learning_progress(user_id,lesson_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [user, lessonId]); return { saved: true }; }); }
    async dashboard(user: string) { return this.db.transaction(async q=>{ const [grants, progress, purchases, notifications, tickets, certificates] = [await q.query('SELECT g.*,p.title,p.kind,p.source_product_key FROM learning_grants g JOIN learning_products p ON p.id=g.product_id WHERE g.user_id=$1 ORDER BY g.id DESC LIMIT 200', [user]),
await q.query('SELECT pr.*,l.product_id FROM learning_progress pr JOIN learning_lessons l ON l.id=pr.lesson_id WHERE user_id=$1', [user]),
await q.query('SELECT p.id,p.product_id,p.snapshot,p.created_at,o.id AS order_id,o.number,o.total,o.state AS order_state,EXISTS(SELECT 1 FROM commerce_ledger refund WHERE refund.order_id=o.id AND refund.kind=\'refund\') AS has_refund,COALESCE((SELECT sum(amount) FROM commerce_ledger WHERE order_id=o.id),0) AS balance FROM learning_purchases p LEFT JOIN commerce_orders o ON o.id=p.order_id WHERE p.user_id=$1 ORDER BY p.id DESC LIMIT 100', [user]),
await q.query('SELECT message,created_at FROM learning_notifications WHERE user_id=$1 ORDER BY id DESC LIMIT 50', [user]),
await q.query('SELECT * FROM learning_tickets WHERE user_id=$1 ORDER BY id DESC LIMIT 50', [user]),
await q.query('SELECT * FROM learning_certificates WHERE user_id=$1', [user])]; return { grants, progress, purchases, notifications, tickets, certificates }; }); }
    async partner(user: string) { return this.db.transaction(async q=>{ const [commissions, payouts] = [await q.query("SELECT e.id,e.purchase_id,e.amount,e.state,e.payout_id,e.reason,e.created_at,p.snapshot->>'title' AS product_title,o.number AS order_number FROM affiliate_entries e LEFT JOIN learning_purchases p ON p.id=e.purchase_id LEFT JOIN commerce_orders o ON o.id=p.order_id WHERE e.user_id=$1 ORDER BY e.id DESC LIMIT 200", [user]),
await q.query('SELECT * FROM affiliate_payouts WHERE user_id=$1 ORDER BY id DESC LIMIT 100', [user])]; const [r] = await q.query("SELECT COALESCE(sum(amount) FILTER(WHERE state='available'),0) AS available,COALESCE(sum(amount) FILTER(WHERE state='reversed' AND amount<0 AND reverses_id IN (SELECT id FROM affiliate_entries WHERE state IN ('paid','reserved'))),0) AS debt FROM affiliate_entries WHERE user_id=$1", [user]); return { commissions: commissions.map((r): Row & {
            amount: number;
        } => ({ ...r, amount: Number(r.amount) })), payouts, available: Math.max(0, Number(r.available) + Number(r.debt)), debt: Number(r.debt) }; }); }
    async commissionCommand(entryId: number, state: string, reason: string, actor: string) { if (!['approved', 'available', 'rejected'].includes(state))
        throw new LearningError('Status komisi tidak valid.'); text(reason, 1000); return this.db.transaction(async (q) => { const e = (await q.query('SELECT * FROM affiliate_entries WHERE id=$1', [positive(entryId)]))[0]; if (!e)
        throw new LearningError('Komisi tidak ditemukan.'); await q.query('SELECT id FROM platform_users WHERE id=$1 FOR UPDATE', [e.user_id]); const fresh = (await q.query('SELECT * FROM affiliate_entries WHERE id=$1 FOR UPDATE', [entryId]))[0]; const allowed: Record<string, string[]> = { pending: ['approved', 'rejected'], approved: ['available', 'rejected'] }; if (!allowed[String(fresh.state)]?.includes(state))
        throw new LearningError('Urutan status komisi tidak valid.'); await q.query('UPDATE affiliate_entries SET state=$1,reason=$2 WHERE id=$3', [state, reason, entryId]); await this.audit(q, actor, 'commission.' + state, entryId, { reason }); }); }
    async requestPayout(user: string, input: Row) {
        const key = text(input.key, 100), details = text(input.details, 1000);
        return this.db.transaction(async (q) => {
            await this.lockCommissionOrders(q, user);
            await this.lockUser(q, user);
            await this.assertPayable(q, user);
            const previous = (await q.query('SELECT * FROM affiliate_payouts WHERE user_id=$1 AND request_key=$2', [user, key]))[0];
            if (previous) {
                if (previous.details !== details)
                    throw new LearningError('Kunci pencairan berbeda data.');
                return previous;
            }
            const entries = await q.query("SELECT * FROM affiliate_entries WHERE user_id=$1 AND state='available' FOR UPDATE", [user]);
            const debt = (await q.query("SELECT id FROM affiliate_entries WHERE user_id=$1 AND amount<0 AND reverses_id IN (SELECT id FROM affiliate_entries WHERE state IN ('paid','reserved'))", [user])).length;
            if (debt)
                throw new LearningError('Ada koreksi komisi yang perlu diselesaikan admin.');
            const amount = entries.reduce((a, e) => a + Number(e.amount), 0);
            if (amount <= 0)
                throw new LearningError('Saldo tersedia belum ada.');
            const payout = (await q.query('INSERT INTO affiliate_payouts(user_id,request_key,amount,details) VALUES($1,$2,$3,$4) RETURNING *', [user, key, amount, details]))[0];
            await q.query("UPDATE affiliate_entries SET state='reserved',payout_id=$1 WHERE user_id=$2 AND state='available'", [payout.id, user]);
            await this.audit(q, user, 'payout.request', payout.id);
            return payout;
        });
    }
    async payoutCommand(payoutId: number, state: string, reason: string, actor: string) { text(reason, 1000); if (!['approved', 'paid', 'rejected'].includes(state))
        throw new LearningError('Status pencairan tidak valid.'); return this.db.transaction(async (q) => { const row = (await q.query('SELECT * FROM affiliate_payouts WHERE id=$1', [positive(payoutId)]))[0]; if (!row)
        throw new LearningError('Pengajuan tidak ditemukan.'); await this.lockCommissionOrders(q, String(row.user_id)); if (state !== 'rejected')
        await this.assertPayable(q, String(row.user_id), payoutId); await q.query('SELECT id FROM platform_users WHERE id=$1 FOR UPDATE', [row.user_id]); const p = (await q.query('SELECT * FROM affiliate_payouts WHERE id=$1 FOR UPDATE', [payoutId]))[0]; if ((state === 'paid' && p.state !== 'approved') || (state === 'approved' && p.state !== 'requested') || (!['requested', 'approved'].includes(String(p.state))))
        throw new LearningError('Urutan pencairan tidak valid.'); const reversed = await q.query("SELECT id FROM affiliate_entries WHERE reverses_id IN (SELECT id FROM affiliate_entries WHERE payout_id=$1)", [payoutId]); if (state !== 'rejected' && reversed.length)
        throw new LearningError('Komisi dibalik; tolak pencairan untuk pemeriksaan.'); await q.query('UPDATE affiliate_payouts SET state=$1,reason=$2,reference=$3,actor=$4,updated_at=now() WHERE id=$5', [state, reason, state === 'paid' ? reason : '', actor, payoutId]); if (state === 'paid')
        await q.query("UPDATE affiliate_entries SET state='paid' WHERE payout_id=$1", [payoutId]); if (state === 'rejected')
        await q.query("UPDATE affiliate_entries SET state=CASE WHEN EXISTS(SELECT 1 FROM affiliate_entries rev WHERE rev.reverses_id=affiliate_entries.id) THEN 'reversed' ELSE 'available' END,payout_id=NULL WHERE payout_id=$1", [payoutId]); await this.audit(q, actor, 'payout.' + state, payoutId, { reason }); }); }
    async issueCertificate(user: string, productId: number, name: string, actor: string) { text(name); return this.db.transaction(async (q) => { await this.lockUser(q, user); const g = (await q.query("SELECT * FROM learning_grants WHERE user_id=$1 AND product_id=$2 AND status='active' AND (expires_at IS NULL OR expires_at>now()) ORDER BY id LIMIT 1", [user, positive(productId)]))[0]; if (!g)
        throw new LearningError('Akses aktif diperlukan.'); const required = g.required_lessons as number[]; const done = (await q.query('SELECT lesson_id FROM learning_progress WHERE user_id=$1', [user])).map(r => Number(r.lesson_id)); if (!required.length || required.some(id => !done.includes(id)))
        throw new LearningError('Materi wajib belum lengkap.'); const p = (await q.query('SELECT title FROM learning_products WHERE id=$1', [productId]))[0]; const cert = (await q.query('INSERT INTO learning_certificates(code,user_id,product_id,participant_name,program_name) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,product_id) DO UPDATE SET participant_name=learning_certificates.participant_name RETURNING *', ['KS-' + randomUUID(), user, productId, name, p.title]))[0]; await this.audit(q, actor, 'certificate.issue', cert.code); return cert; }); }
    async verifyCertificate(code: string) { return (await this.db.query('SELECT code,participant_name,program_name,issued_at,revoked_at FROM learning_certificates WHERE code=$1', [text(code, 100)]))[0] ?? null; }
    async revokeCertificate(code: string, reason: string, actor: string) { text(reason, 1000); await this.db.transaction(async (q) => { await q.query('UPDATE learning_certificates SET revoked_at=now(),reason=$1 WHERE code=$2', [reason, text(code, 100)]); await this.audit(q, actor, 'certificate.revoke', code, { reason }); }); }
    async ticket(user: string, subject: string, message: string) { return (await this.db.query('INSERT INTO learning_tickets(user_id,subject,message) VALUES($1,$2,$3) RETURNING id', [user, text(subject), text(message, 5000)]))[0]; }
    async searchUsers(term:string){if(typeof term!=='string'||term.trim().length<2||term.length>254)throw new LearningError('Ketik 2–254 karakter email untuk mencari akun.');return this.db.query('SELECT id,email,active FROM platform_users WHERE email ILIKE $1 ORDER BY email LIMIT 50',['%'+term.trim()+'%']);}
    async readiness(){const rows=await this.db.query("SELECT name,to_regclass('public.'||name) AS relation FROM (VALUES ('learning_products'),('learning_lessons'),('learning_coupons'),('learning_purchases'),('learning_grants'),('learning_progress'),('learning_jobs'),('affiliate_payouts'),('affiliate_entries'),('learning_audit'),('learning_notifications'),('learning_certificates'),('learning_tickets')) AS expected(name)");const missing=rows.filter(r=>!r.relation).map(r=>String(r.name));const columns=await this.db.query("SELECT column_name FROM information_schema.columns WHERE table_name='learning_products' AND column_name IN ('source_product_key','price_note')");if(columns.length<2)missing.push('catalog_0_10');return {ready:missing.length===0,missing};}
    async adminData() { return this.db.transaction(async q=>{ const [products, lessons, grants, commissions, payouts, jobs, tickets, coupons, users] = [await q.query('SELECT * FROM learning_products ORDER BY id DESC LIMIT 200'),
await q.query('SELECT * FROM learning_lessons ORDER BY product_id,position,id LIMIT 1000'),
await q.query('SELECT g.*,u.email,p.title,(SELECT count(*) FROM learning_progress pr JOIN learning_lessons ll ON ll.id=pr.lesson_id WHERE pr.user_id=g.user_id AND ll.product_id=g.product_id) AS completed_count FROM learning_grants g JOIN platform_users u ON u.id=g.user_id JOIN learning_products p ON p.id=g.product_id ORDER BY g.id DESC LIMIT 200'),
await q.query('SELECT e.*,u.email FROM affiliate_entries e JOIN platform_users u ON u.id=e.user_id ORDER BY e.id DESC LIMIT 200'),
await q.query('SELECT * FROM affiliate_payouts ORDER BY id DESC LIMIT 100'),
await q.query('SELECT * FROM learning_jobs ORDER BY updated_at LIMIT 100'),
await q.query('SELECT * FROM learning_tickets ORDER BY id DESC LIMIT 100'),
await q.query('SELECT * FROM learning_coupons ORDER BY code'),
await q.query('SELECT id,email,active FROM platform_users ORDER BY created_at DESC LIMIT 300')]; return { products, lessons, grants, commissions, payouts, jobs, tickets, coupons, users }; }); }
    async replyTicket(id: number, reply: string, actor: string) { text(reply, 5000); await this.db.transaction(async (q) => { await q.query("UPDATE learning_tickets SET reply=$1,state='closed' WHERE id=$2", [reply, positive(id)]); await this.audit(q, actor, 'ticket.reply', id); }); }
    async logDownload(user: string, id: number) { await this.audit(this.db, user, 'file.download', id); }
}

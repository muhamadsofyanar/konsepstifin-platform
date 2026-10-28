/** Presentation policies only. API authorization remains on the server. */
export type MemberLink = {
    href: string;
    label: string;
};
export function memberLinks(roles: readonly string[]): MemberLink[] { const admin = roles.some(r => ['admin', 'super_admin'].includes(r)), promoter = roles.includes('promoter'), affiliate = promoter || roles.includes('affiliate'); return [{ href: '/akun', label: 'Ringkasan' }, { href: '/belajar?tab=classes', label: 'Akses saya' }, { href: '/belajar?tab=orders', label: 'Pembelian' }, ...(promoter ? [{ href: '/akun/voucher', label: 'Voucher' }] : []), ...(affiliate ? [{ href: '/akun/mitra', label: 'Produk & affiliate' }] : []), { href: '/belajar?tab=support', label: 'Bantuan' }, ...(admin ? [{ href: '/admin', label: 'Ruang admin' }] : [])]; }
const statuses: Record<string, string> = { refunded: 'Dikembalikan', partial_refund: 'Pengembalian sebagian', expired: 'Kedaluwarsa', draft: 'Draf', published: 'Terbit', archived: 'Diarsipkan', course: 'E-course', ebook: 'Ebook', webinar: 'Webinar', consultation: 'Konsultasi', bundle: 'Bundel', pending: 'Menunggu tinjauan', approved: 'Disetujui', available: 'Siap dicairkan', reserved: 'Dicadangkan', paid: 'Dibayar', rejected: 'Ditolak', reversed: 'Dibalik', requested: 'Diajukan', active: 'Aktif', suspended: 'Ditangguhkan', revoked: 'Dicabut', open: 'Menunggu jawaban', closed: 'Selesai', issued: 'Menunggu pembayaran', cancelled: 'Dibatalkan', partial: 'Dibayar sebagian', unpaid: 'Belum dibayar', inbox: 'Dalam akun' };
export function statusLabel(value: unknown) { return statuses[String(value)] ?? String(value ?? ''); }
export function learningAccess(grant: Record<string, unknown>, days = 0, now = Date.now()) { const active = grant.status === 'active' && (!grant.expires_at || new Date(String(grant.expires_at)).getTime() > now); const unlockAt = new Date(String(grant.started_at ?? 0)).getTime() + days * 86400000; return { active, locked: !active || unlockAt > now, unlockAt }; }
export function purchaseState(p: Record<string, unknown>) { const total = Number(p.total ?? 0), balance = Number(p.balance ?? 0); if (p.order_state === 'cancelled')
    return 'cancelled'; if (!total)
    return 'active'; if (p.has_refund && balance < total)
    return balance > 0 ? 'partial_refund' : 'refunded'; return balance >= total ? 'paid' : balance > 0 ? 'partial' : 'unpaid'; }
export function groupLearningGrants(rows: Record<string, unknown>[], now = Date.now()): Record<string, unknown>[] { const groups = new Map<string, Record<string, unknown>[]>(); for (const r of rows) {
    const k = String(r.product_id);
    groups.set(k, [...(groups.get(k) ?? []), r]);
} return [...groups.values()].map(all => { const active = all.filter(g => learningAccess(g, 0, now).active); const earliest = [...active].sort((a, b) => new Date(String(a.started_at)).getTime() - new Date(String(b.started_at)).getTime())[0]; const display = [...active].sort((a, b) => !a.expires_at ? -1 : !b.expires_at ? 1 : new Date(String(b.expires_at)).getTime() - new Date(String(a.expires_at)).getTime())[0] ?? all[0]; return { ...display, ...(earliest ? { started_at: earliest.started_at, required_lessons: earliest.required_lessons } : {}), last_lesson_id: display.last_lesson_id ?? active.find(g => g.last_lesson_id)?.last_lesson_id }; }); }

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { leadStatuses, updateLead, type LeadStatus } from '@/lib/interest-store';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  try {
    const id = Number((await context.params).id); const body = await request.json() as Record<string, unknown>;
    const status = String(body.status) as LeadStatus;
    if (!leadStatuses.includes(status)) return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
    await updateLead(id, { status, assignedPromoterCode: String(body.assignedPromoterCode ?? ''), internalNotes: String(body.internalNotes ?? ''), scheduledAt: body.scheduledAt ? String(body.scheduledAt) : null }, process.env.ADMIN_EMAIL || 'admin');
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Lead belum dapat diperbarui.' }, { status: 400 }); }
}

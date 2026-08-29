import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getLeadById, getLeadHistory, updateLead, type LeadStatus, type PaymentStatus } from '@/lib/interest-store';

type RouteContext = { params: Promise<{ id: string }> };

function leadId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const id = leadId((await context.params).id);
  if (!id) return NextResponse.json({ error: 'Referensi lead tidak valid.' }, { status: 400 });
  try {
    const lead = await getLeadById(id);
    if (!lead) return NextResponse.json({ error: 'Lead tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ lead, history: await getLeadHistory(id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Lead belum dapat dibuka.' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  const id = leadId((await context.params).id);
  if (!id) return NextResponse.json({ error: 'Referensi lead tidak valid.' }, { status: 400 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const lead = await updateLead(id, {
      status: String(body.status ?? '') as LeadStatus,
      assignedPromoterCode: body.assignedPromoterCode == null ? undefined : String(body.assignedPromoterCode),
      pic: body.pic == null ? undefined : String(body.pic),
      scheduledAt: body.scheduledAt ? String(body.scheduledAt) : null,
      internalNotes: body.internalNotes == null ? undefined : String(body.internalNotes),
      paymentStatus: body.paymentStatus == null ? undefined : String(body.paymentStatus) as PaymentStatus,
      sejoliOrderId: body.sejoliOrderId == null ? undefined : String(body.sejoliOrderId),
      saleAmount: body.saleAmount == null ? undefined : Number(body.saleAmount),
      promoterPayout: body.promoterPayout == null ? undefined : Number(body.promoterPayout),
      otherCost: body.otherCost == null ? undefined : Number(body.otherCost),
    }, process.env.ADMIN_EMAIL || 'admin');
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Lead belum dapat diperbarui.' }, { status: 400 });
  }
}

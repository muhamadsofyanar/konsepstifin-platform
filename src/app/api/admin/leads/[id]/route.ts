import { getLeadOrders } from '@/lib/commerce-store';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminPrincipal } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/lib/admin-request';
import { assertCrmContactFields, getLeadById, getLeadHistory, updateLead, type LeadStatus } from '@/lib/interest-store';

function privateJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers); headers.set('Cache-Control','no-store');
  return NextResponse.json(data,{...init,headers});
}

type RouteContext = { params: Promise<{ id: string }> };

function leadId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!await getAdminPrincipal()) return privateJson({ error: 'Akses ditolak.' }, { status: 401 });
  const id = leadId((await context.params).id);
  if (!id) return privateJson({ error: 'Referensi lead tidak valid.' }, { status: 400 });
  try {
    const lead = await getLeadById(id);
    if (!lead) return privateJson({ error: 'Lead tidak ditemukan.' }, { status: 404 });
    return privateJson({ lead, history: await getLeadHistory(id), orders: await getLeadOrders(id) },{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    return privateJson({ error: error instanceof Error ? error.message : 'Lead belum dapat dibuka.' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const principal = await requireAdminRequest(request);
  if (!principal) return privateJson({ error: 'Akses ditolak.' }, { status: 401 });
  const id = leadId((await context.params).id);
  if (!id) return privateJson({ error: 'Referensi lead tidak valid.' }, { status: 400 });
  try {
    const body = await request.json() as Record<string, unknown>;
    assertCrmContactFields(body);
    const lead = await updateLead(id, {
      name: body.name == null ? undefined : String(body.name),
      phone: body.phone == null ? undefined : String(body.phone),
      email: body.email == null ? undefined : String(body.email),
      city: body.city == null ? undefined : String(body.city),
      status: String(body.status ?? '') as LeadStatus,
      assignedPromoterCode: body.assignedPromoterCode == null ? undefined : String(body.assignedPromoterCode),
      pic: body.pic == null ? undefined : String(body.pic),
      scheduledAt: body.scheduledAt === undefined ? undefined : body.scheduledAt ? String(body.scheduledAt) : null,
      internalNotes: body.internalNotes == null ? undefined : String(body.internalNotes),
    }, principal.userId);
    return privateJson({ ok: true, lead },{headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    return privateJson({ error: error instanceof Error ? error.message : 'Lead belum dapat diperbarui.' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createInterestLead, validateInterestInput, validateIdempotencyKey } from '@/lib/interest-store';
import { crmGroups, crmType, crmInitialStatus, type CrmGroup } from '@/lib/crm-domain';

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  let command;
  try {
    const body = await request.json();
    if (!crmGroups.includes(body.group)) throw new Error('Kelompok CRM tidak valid.');
    const group = body.group as CrmGroup;
    const leadType = crmType(group);
    command = {
      interest: validateInterestInput({ ...body, leadType, productKey: leadType === 'test_service' ? 'bantuanTes' : 'bantuanPromotor', sourcePath: '/admin/leads' }),
      status: crmInitialStatus(group),
      idempotencyKey: validateIdempotencyKey(body.idempotencyKey),
      actor: process.env.ADMIN_EMAIL || 'admin',
    };
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Data tidak valid.' }, { status: 400 });
  }
  try {
    return NextResponse.json({ lead: await createInterestLead(command) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Data belum tersimpan. Periksa koneksi database lalu coba lagi.' }, { status: 503 });
  }
}

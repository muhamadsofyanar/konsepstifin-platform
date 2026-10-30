import { NextRequest, NextResponse } from 'next/server';
import { getAdminPrincipal } from '@/lib/admin-auth';
import { requireAdminRequest } from '@/lib/admin-request';
import { getCrmLeads, assertCrmContactFields, createInterestLead, validateInterestInput, validateIdempotencyKey } from '@/lib/interest-store';
import { crmGroups, crmType, crmInitialStatus, type CrmGroup } from '@/lib/crm-domain';

function privateJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers); headers.set('Cache-Control','no-store');
  return NextResponse.json(data,{...init,headers});
}

export async function POST(request: NextRequest) {
  const principal = await requireAdminRequest(request);
  if (!principal) return privateJson({ error: 'Akses ditolak.' }, { status: 401 });
  let command;
  try {
    const body = await request.json();
    assertCrmContactFields(body);
    if (!crmGroups.includes(body.group)) throw new Error('Kelompok CRM tidak valid.');
    const group = body.group as CrmGroup;
    const leadType = crmType(group);
    command = {
      interest: validateInterestInput({ ...body, leadType, productKey: leadType === 'test_service' ? 'bantuanTes' : 'bantuanPromotor', sourcePath: '/admin/leads' }),
      status: crmInitialStatus(group),
      idempotencyKey: validateIdempotencyKey(body.idempotencyKey),
      actor: principal.userId,
    };
  } catch (error) {
    return privateJson({ error: error instanceof Error ? error.message : 'Data tidak valid.' }, { status: 400 });
  }
  try {
    return privateJson({ lead: await createInterestLead(command) }, { status: 201, headers: {'Cache-Control':'no-store'} });
  } catch {
    return privateJson({ error: 'Data belum tersimpan. Periksa koneksi database lalu coba lagi.' }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  if (!await getAdminPrincipal()) return privateJson({error:'Akses ditolak.'},{status:401,headers:{'Cache-Control':'no-store'}});
  try {
    const values=Object.fromEntries(request.nextUrl.searchParams);
    return privateJson(await getCrmLeads({...values,page:Number(values.page)||1,pageSize:Number(values.pageSize)||25}),{headers:{'Cache-Control':'no-store'}});
  } catch {return privateJson({error:'Daftar belum dapat dimuat.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { updateLead, validateLeadAdminUpdate } from '@/lib/interest-store';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  try {
    const id = Number((await context.params).id);
    const body = await request.json() as Record<string, unknown>;
    const validated = validateLeadAdminUpdate(body);
    const lead = await updateLead(id, validated, process.env.ADMIN_EMAIL || 'admin');
    return NextResponse.json({ ok: true, lead });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Lead belum dapat diperbarui.' }, { status: 400 }); }
}

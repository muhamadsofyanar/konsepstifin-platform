import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { updateLead, validateLeadAdminUpdate } from '@/lib/interest-store';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
  try {
    const { id } = await context.params;
    const lead = await updateLead(Number(id), validateLeadAdminUpdate(await request.json()));
    if (!lead) return NextResponse.json({ error: 'Lead tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lead gagal diperbarui.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

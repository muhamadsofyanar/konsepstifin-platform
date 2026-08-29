import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  assignPromoter,
  buildWhatsAppTemplates,
  createClaimLink,
  getLead,
  getLeadCounts,
  getLeadStatusHistory,
  listClaims,
  listLeads,
  setLeadSchedule,
  type LeadFilter,
  type LeadStatus,
  updateInternalNotes,
  updateLeadStatus,
  decideClaim,
  VALID_LEAD_STATUSES,
  listClaimLinks,
  deactivateClaimLink,
} from '@/lib/interest-store';
import { getPromotersForRegion, isPromoterCodeActive } from '@/lib/promoter-store';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const view = searchParams.get('view') || 'list';

  try {
    if (view === 'counts') {
      return NextResponse.json({ counts: await getLeadCounts() });
    }

    if (view === 'summary') {
      const counts = await getLeadCounts();
      const baru = await listLeads({ status: ['baru', 'mencari_promotor', 'ditawarkan'] as LeadStatus[] }, 50);
      return NextResponse.json({ counts, recent: baru });
    }

    const id = searchParams.get('id');
    if (id) {
      const leadId = Number(id);
      if (!Number.isInteger(leadId) || leadId <= 0) return NextResponse.json({ message: 'ID lead tidak valid.' }, { status: 400 });
      const lead = await getLead(leadId);
      if (!lead) return NextResponse.json({ message: 'Lead tidak ditemukan.' }, { status: 404 });
      const history = await getLeadStatusHistory(leadId);
      const claims = await listClaims(leadId);
      const claimLinks = await listClaimLinks(leadId);
      let candidates: unknown[] = [];
      try {
        const match = await getPromotersForRegion({
          provinceCode: lead.provinceCode,
          provinceName: lead.provinceName,
          regencyCode: lead.regencyCode,
          regencyName: lead.regencyName,
        });
        candidates = [...match.direct, ...match.candidates].slice(0, 10);
      } catch { /* ignore */ }
      const templates = buildWhatsAppTemplates(lead, lead.assignedPromoterCode);
      return NextResponse.json({ lead, history, claims, claimLinks, candidates, templates });
    }

    const statusParam = searchParams.get('status');
    const statuses = statusParam
      ? statusParam.split(',').filter((s): s is LeadStatus => VALID_LEAD_STATUSES.includes(s as LeadStatus))
      : undefined;

    const filter: LeadFilter = {
      status: statuses,
      provinceCode: searchParams.get('provinceCode') || undefined,
      regencyCode: searchParams.get('regencyCode') || undefined,
      service: searchParams.get('service') || undefined,
      assignedPromoterCode: searchParams.get('assignedPromoterCode') || undefined,
      fromDate: searchParams.get('from') || undefined,
      toDate: searchParams.get('to') || undefined,
    };
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') || '200')));
    const leads = await listLeads(filter, limit);
    return NextResponse.json({ leads, total: leads.length, filter });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat data lead.';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? '');
    const leadId = Number(body.leadId);
    if (!Number.isInteger(leadId) || leadId <= 0) return NextResponse.json({ message: 'ID lead tidak valid.' }, { status: 400 });
    const actor = String(body.actor ?? 'admin');

    switch (action) {
      case 'update_status': {
        const status = String(body.status) as LeadStatus;
        if (!VALID_LEAD_STATUSES.includes(status)) return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
        const note = body.note ? String(body.note).slice(0, 500) : undefined;
        const updated = await updateLeadStatus(leadId, status, actor, note);
        if (!updated) return NextResponse.json({ message: 'Lead tidak ditemukan.' }, { status: 404 });
        return NextResponse.json({ ok: true, lead: updated });
      }
      case 'assign_promoter': {
        const code = String(body.promoterCode ?? '').trim().toUpperCase();
        if (!code) return NextResponse.json({ message: 'Kode promotor wajib.' }, { status: 400 });
        const updated = await assignPromoter(leadId, code, actor);
        if (!updated) return NextResponse.json({ message: 'Lead tidak ditemukan.' }, { status: 404 });
        return NextResponse.json({ ok: true, lead: updated });
      }
      case 'set_schedule': {
        const at = new Date(String(body.scheduleAt ?? ''));
        if (Number.isNaN(at.getTime())) return NextResponse.json({ message: 'Jadwal tidak valid.' }, { status: 400 });
        const updated = await setLeadSchedule(leadId, at, actor);
        if (!updated) return NextResponse.json({ message: 'Lead tidak ditemukan.' }, { status: 404 });
        return NextResponse.json({ ok: true, lead: updated });
      }
      case 'update_notes': {
        const notes = String(body.internalNotes ?? '').slice(0, 5000);
        const updated = await updateInternalNotes(leadId, notes, actor);
        if (!updated) return NextResponse.json({ message: 'Lead tidak ditemukan.' }, { status: 404 });
        return NextResponse.json({ ok: true, lead: updated });
      }
      case 'create_claim_link': {
        const expires = Number(body.expiresInHours ?? 48);
        const link = await createClaimLink(leadId, actor, Math.max(1, Math.min(720, expires)));
        return NextResponse.json({ ok: true, link });
      }
      case 'deactivate_claim_link': {
        const linkId = Number(body.linkId);
        if (!Number.isInteger(linkId) || linkId <= 0) return NextResponse.json({ message: 'ID link tidak valid.' }, { status: 400 });
        const ok = await deactivateClaimLink(linkId);
        return NextResponse.json({ ok });
      }
      case 'decide_claim': {
        const claimId = Number(body.claimId);
        if (!Number.isInteger(claimId) || claimId <= 0) return NextResponse.json({ message: 'ID klaim tidak valid.' }, { status: 400 });
        const decision = String(body.decision);
        if (decision !== 'disetujui' && decision !== 'ditolak') return NextResponse.json({ message: 'Keputusan tidak valid.' }, { status: 400 });
        const ok = await decideClaim(claimId, decision, actor, body.note ? String(body.note).slice(0, 500) : undefined);
        return NextResponse.json({ ok: Boolean(ok), claim: ok });
      }
      case 'validate_promoter_code': {
        const code = String(body.code ?? '').trim().toUpperCase();
        if (!code) return NextResponse.json({ active: false });
        const active = await isPromoterCodeActive(code);
        return NextResponse.json({ code, active });
      }
      default:
        return NextResponse.json({ message: `Aksi tidak dikenal: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memproses permintaan.';
    return NextResponse.json({ message }, { status: 400 });
  }
}

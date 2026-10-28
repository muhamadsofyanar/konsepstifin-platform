import { getAccountPrincipal } from '@/lib/identity/server';
import { ACCOUNT_COOKIE } from '@/lib/identity/http';
import { getReferralService } from '@/lib/referral-store';
import { REFERRAL_COOKIE } from '@/lib/referral-service';
import { NextRequest, NextResponse } from 'next/server';
import { submitInterest } from '@/lib/interest-service';
import { createInterestLead } from '@/lib/interest-store';
import { getPromotersForRegion } from '@/lib/promoter-store';
import { checkRateLimit } from '@/lib/rate-limit';

export function publicInterestErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Permintaan belum dapat disimpan.';
  const status = /belum|perlu|minimal|valid|lengkap|pilih|persetujuan|sesuai/i.test(message) ? 400 : 500;
  if (status === 500) console.error('Gagal menyimpan formulir minat.', message);
  return NextResponse.json({
    error: status === 400 ? message : 'Permintaan belum dapat disimpan. Silakan coba kembali.',
  }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(request, 'public-interest', 8, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba kembali nanti.' }, {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfter) },
      });
    }
    const body = await request.json() as Record<string, unknown>;
    if (String(body.website ?? '')) return NextResponse.json({ ok: true });
    const startedAt = Number(body.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1_500) {
      return NextResponse.json({ error: 'Formulir dikirim terlalu cepat. Silakan coba kembali.' }, { status: 400 });
    }

    const principal = request.cookies.has(ACCOUNT_COOKIE) ? await getAccountPrincipal() : null;
    const registeredSource = principal?.active && principal.sessionValid ? await getReferralService().resolveRegistered(principal.userId) : null;
    const referralSource = registeredSource ?? (request.cookies.get(REFERRAL_COOKIE)?.value ? await getReferralService().resolveToken(request.cookies.get(REFERRAL_COOKIE)?.value) : null);
    const result = await submitInterest(body, {
      referralSource,
      findPromoters: getPromotersForRegion,
      createLead: createInterestLead,
    });
    const isTestLead = result.lead.leadType === 'test_service';
    return NextResponse.json({
      ok: true,
      reference: result.reference,
      referralRecorded: 'sourcePartnerUserId' in result.lead && Boolean(result.lead.sourcePartnerUserId),
      referralAlias: 'sourceReferralAlias' in result.lead ? result.lead.sourceReferralAlias : '',
      status: result.status,
      match: isTestLead ? result.match : null,
    }, { status: 201 });
  } catch (error) {
    return publicInterestErrorResponse(error);
  }
}

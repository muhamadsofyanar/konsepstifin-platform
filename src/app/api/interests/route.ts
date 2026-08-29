import { NextRequest, NextResponse } from 'next/server';
import { createInterestLead, validateInterestInput } from '@/lib/interest-store';
import { getPublicPromoters } from '@/lib/promoter-store';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(request, 'public-interest', 8, 15 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba kembali nanti.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    const body = await request.json() as Record<string, unknown>;
    if (String(body.website ?? '')) return NextResponse.json({ ok: true });
    const startedAt = Number(body.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1_500) {
      return NextResponse.json({ error: 'Formulir dikirim terlalu cepat. Silakan coba kembali.' }, { status: 400 });
    }
    const input = validateInterestInput(body);
    let hasCandidate = false;
    try { hasCandidate = (await getPublicPromoters(input.regencyCode || input.provinceCode)).some((item) => item.active); } catch { /* Jalur nasional tetap tersedia. */ }
    const status = hasCandidate ? 'ditawarkan' : 'mencari_promotor';
    const id = await createInterestLead(input, status);
    return NextResponse.json({ ok: true, id, status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Permintaan belum dapat disimpan.';
    const status = /belum|perlu|minimal|valid|lengkap|pilih/i.test(message) ? 400 : 500;
    if (status === 500) console.error('Gagal menyimpan formulir minat.', error);
    return NextResponse.json({ error: message }, { status });
  }
}

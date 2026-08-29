import { NextRequest, NextResponse } from 'next/server';
import { submitInterest } from '@/lib/interest-service';
import { createGenericInterestLead, validateGenericInterestInput } from '@/lib/interest-store';
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
    if (body.requirePrecheckout === true) {
      const result = await submitInterest(body);
      return NextResponse.json({ ok: true, ...result }, { status: 201 });
    }
    const input = validateGenericInterestInput(body);
    const id = await createGenericInterestLead(input);
    return NextResponse.json({ ok: true, id, status: 'baru' }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Permintaan belum dapat disimpan.';
    const status = /checkout produk/i.test(message) ? 503 : /belum|perlu|minimal|valid|lengkap|pilih|persetujuan/i.test(message) ? 400 : 500;
    if (status === 500) console.error('Gagal menyimpan formulir minat.');
    return NextResponse.json({ error: message }, { status });
  }
}

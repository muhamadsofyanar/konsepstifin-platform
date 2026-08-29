import { NextRequest, NextResponse } from 'next/server';
import { createInterestLead, validateInterestInput } from '@/lib/interest-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (String(body.website ?? '')) return NextResponse.json({ ok: true });
    const startedAt = Number(body.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1_500) {
      return NextResponse.json({ error: 'Formulir dikirim terlalu cepat. Silakan coba kembali.' }, { status: 400 });
    }
    const input = validateInterestInput(body);
    const id = await createInterestLead(input);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Permintaan belum dapat disimpan.';
    const status = /belum|perlu|minimal|valid|lengkap|pilih/i.test(message) ? 400 : 500;
    if (status === 500) console.error('Gagal menyimpan formulir minat.', error);
    return NextResponse.json({ error: message }, { status });
  }
}

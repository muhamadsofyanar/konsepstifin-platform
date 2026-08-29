import { NextRequest, NextResponse } from 'next/server';
import { createInterestLead, validateInterestInput, type LeadStatus } from '@/lib/interest-store';
import { getPromotersForRegion } from '@/lib/promoter-store';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await checkRateLimit(request, 'interests', 10, 60_000);
    const body = await request.json() as Record<string, unknown>;
    if (String(body.website ?? '')) return NextResponse.json({ ok: true });
    const startedAt = Number(body.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1_500) {
      return NextResponse.json({ error: 'Formulir dikirim terlalu cepat. Silakan coba kembali.' }, { status: 400 });
    }

    const input = validateInterestInput(body);

    let initialStatus: LeadStatus = 'baru';
    try {
      const { available } = await getPromotersForRegion({
        provinceCode: input.provinceCode,
        provinceName: input.provinceName,
        regencyCode: input.regencyCode,
        regencyName: input.regencyName,
      });
      initialStatus = available ? 'ditawarkan' : 'mencari_promotor';
    } catch {
      initialStatus = input.provinceCode || input.regencyCode ? 'mencari_promotor' : 'baru';
    }
    input.initialStatus = initialStatus;

    const id = await createInterestLead(input);
    return NextResponse.json({ ok: true, id, status: initialStatus }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Permintaan belum dapat disimpan.';
    const status = /belum|perlu|minimal|valid|lengkap|pilih|terlalu banyak/i.test(message) ? 400 : 500;
    if (status === 500) console.error('Gagal menyimpan formulir minat.', error);
    return NextResponse.json({ error: message }, { status });
  }
}

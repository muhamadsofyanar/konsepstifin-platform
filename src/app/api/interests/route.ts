import { NextRequest, NextResponse } from 'next/server';
import { isOfficialSejoliUrl } from '@/app/site-config';
import { submitInterest } from '@/lib/interest-service';
import { createInterestLead } from '@/lib/interest-store';
import { getPublicProductByKey } from '@/lib/product-store';
import { getPromotersForRegion } from '@/lib/promoter-store';
import { checkRateLimit } from '@/lib/rate-limit';

async function resolveTestCheckout(productKey: string) {
  const product = await getPublicProductByKey(productKey);
  if (!product || product.groupName !== 'test' || !product.checkoutUrl || !isOfficialSejoliUrl(product.checkoutUrl)) {
    throw new Error('Checkout produk belum tersedia.');
  }
  return product.checkoutUrl;
}

export function publicInterestErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Permintaan belum dapat disimpan.';
  const status = /belum|perlu|minimal|valid|lengkap|pilih|persetujuan|sesuai|checkout/i.test(message) ? 400 : 500;
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

    const result = await submitInterest(body, {
      findPromoters: getPromotersForRegion,
      createLead: createInterestLead,
      resolveCheckout: resolveTestCheckout,
    });
    const isTestLead = result.lead.leadType === 'test_service';
    const checkoutUrl = isTestLead && result.checkoutUrl && isOfficialSejoliUrl(result.checkoutUrl)
      ? result.checkoutUrl
      : '';
    return NextResponse.json({
      ok: true,
      reference: result.reference,
      status: result.status,
      match: isTestLead ? result.match : null,
      ...(checkoutUrl ? { checkoutUrl } : {}),
    }, { status: 201 });
  } catch (error) {
    return publicInterestErrorResponse(error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  submitClaim,
  validateAndGetClaimLink,
} from '@/lib/interest-store';
import { isPromoterCodeActive } from '@/lib/promoter-store';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!token) return NextResponse.json({ error: 'Token tidak disertakan.' }, { status: 400 });
  try {
    const linkData = await validateAndGetClaimLink(token);
    if (!linkData) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan.' }, { status: 404 });
    }
    const { lead } = linkData;
    const ref = `KSF-${String(lead.id).padStart(5, '0')}`;
    const safe = {
      refCode: ref,
      regencyName: lead.regencyName,
      provinceName: lead.provinceName,
      service: lead.service,
      scheduleSafe: lead.notes
        ? lead.notes.replace(/(\+?\d{8,14}|\b\d{3,}[- ]\d{3,}[- ]\d{3,}\b|@[a-z0-9._-]+)/gi, '[tersedia di admin]')
            .slice(0, 220)
        : 'Menunggu konfirmasi',
      expiresAt: linkData.expiresAt,
      active: linkData.active,
    };
    return NextResponse.json(safe, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Security-Policy': "default-src 'self'",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Tautan tidak dapat diperiksa.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await checkRateLimit(request, 'claim', 15, 60_000);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Terlalu banyak permintaan.' }, { status: 429 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = String(body.token ?? '').trim();
    const promoterCode = String(body.promoterCode ?? '').trim().toUpperCase();

    if (!token) return NextResponse.json({ error: 'Token tidak valid.' }, { status: 400 });
    if (!promoterCode) return NextResponse.json({ error: 'Kode ID promotor wajib diisi.' }, { status: 400 });

    const linkData = await validateAndGetClaimLink(token);
    if (!linkData || !linkData.active) {
      return NextResponse.json({ error: 'Tautan klaim tidak valid, kedaluwarsa, atau telah dinonaktifkan.' }, { status: 410 });
    }

    let active = false;
    try {
      active = await isPromoterCodeActive(promoterCode);
    } catch { /* ignore API errors, allow submit for admin review */ }
    if (!active) {
      return NextResponse.json({
        error: 'Kode ID tidak terdaftar sebagai promotor aktif pada sumber nasional. Hubungi admin jika Anda merasa ini salah.',
      }, { status: 400 });
    }

    const id = await submitClaim(linkData.id, linkData.leadId, promoterCode);
    return NextResponse.json({ ok: true, claimId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Klaim belum dapat disimpan.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

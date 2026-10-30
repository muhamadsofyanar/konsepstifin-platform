import { getAccountPrincipal } from '@/lib/identity/server';
import { ACCOUNT_COOKIE } from '@/lib/identity/http';
import { getReferralService } from '@/lib/referral-store';
import { REFERRAL_COOKIE } from '@/lib/referral-service';
import { NextRequest, NextResponse } from 'next/server';
import { submitInterest } from '@/lib/interest-service';
import { createInterestLead } from '@/lib/interest-store';
import { getPromotersForRegion } from '@/lib/promoter-store';
import { checkRateLimit } from '@/lib/rate-limit';
import { getActivePromotion, familyScheme } from '@/lib/promotion-store';
import { getPublicIntegrationSettings } from '@/lib/integration-settings';
import { queueWhatsAppMessage, stableNotificationKey } from '@/lib/notification-outbox';

export function publicInterestErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Permintaan belum dapat disimpan.';
  const status = /belum|perlu|minimal|valid|lengkap|pilih|persetujuan|sesuai|promo|aktif|skema|berlaku/i.test(message) ? 400 : 500;
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

    const promoKey = String(body.familyPromoKey ?? '').trim();
    if (promoKey) {
      const productKey = String(body.productKey ?? '').trim();
      if (!['paketKeluarga', 'paketKeluargaPlus'].includes(productKey)) throw new Error('Promo Family Test hanya berlaku untuk permintaan tes keluarga.');
      const promo = await getActivePromotion();
      if (!promo.familyActive) throw new Error('Promo Family Test tidak sedang aktif. Silakan muat ulang halaman atau hubungi tim.');
      const scheme = familyScheme(promo.settings, promoKey);
      if (!scheme) throw new Error('Skema promo tidak tersedia. Pilih skema yang aktif pada halaman layanan.');
      const minimum = scheme.paidTests * promo.settings.minimumPaidTestPrice;
      const currentNotes = String(body.notes ?? '').replace(/PROMO PUSAT (?:FAMILY TEST|YEAR-END WORKSHOP):[^|]*/gi, '').trim().slice(0, 400);
      const verifiedPromoNote = `PROMO PUSAT FAMILY TEST: ${scheme.label}; ${scheme.paidTests} tes berbayar + ${scheme.freeTests} tes gratis; total ${scheme.paidTests + scheme.freeTests} peserta; minimum pembayaran Rp${minimum.toLocaleString('id-ID')}; periode ${promo.settings.startDate} s.d. ${promo.settings.endDate}. Harga akhir dikonfirmasi admin.`;
      body.notes = [currentNotes, verifiedPromoNote].filter(Boolean).join(' | ').slice(0, 600);
    } else {
      const productKey = String(body.productKey ?? '').trim();
      if (['wsl1', 'wsl2', 'wst'].includes(productKey)) {
        const promo = await getActivePromotion();
        if (promo.workshopActive) {
          const price = promo.settings.workshopPrices[productKey as 'wsl1'|'wsl2'|'wst'];
          const note = `PROMO PUSAT YEAR-END WORKSHOP: ${productKey.toUpperCase()}; harga promo Rp${price.toLocaleString('id-ID')}; periode ${promo.settings.startDate} s.d. ${promo.settings.endDate}; jadwal dan rincian dikonfirmasi admin.`;
          body.notes = [String(body.notes ?? '').replace(/PROMO PUSAT (?:FAMILY TEST|YEAR-END WORKSHOP):[^|]*/gi, '').trim().slice(0, 400), note].filter(Boolean).join(' | ').slice(0, 600);
        }
      }
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
    // Queue onboarding instructions for promoter candidates. The notification worker
    // keeps this in awaiting_inbound until the candidate starts the WhatsApp chat.
    if (!isTestLead && 'phone' in result.lead && 'consentToContact' in result.lead && result.lead.phone && result.lead.consentToContact) {
      const candidateName = String(result.lead.name || 'Bapak/Ibu').trim().slice(0, 100) || 'Bapak/Ibu';
      const candidateService = String(result.lead.service || body.service || 'Paket Promotor').trim().slice(0, 120);
      try {
        await queueWhatsAppMessage({
          eventType: 'promoter_candidate_instructions',
          leadId: result.lead.id,
          phone: result.lead.phone,
          name: candidateName,
          message: `Assalamu'alaikum ${candidateName}. Terima kasih telah mengajukan ${candidateService} melalui KonsepSTIFIn. Referensi: ${result.reference}. Untuk menerima panduan tahapan, persyaratan, biaya, dan langkah berikutnya, balas pesan ini atau kirim nomor referensi tersebut ke chat resmi KonsepSTIFIn. Tim akan membantu setelah percakapan dimulai. Pengajuan ini belum berarti pendaftaran promotor telah disetujui.`,
          dedupeKey: stableNotificationKey('promoter-candidate-instructions', `${result.lead.id}:${result.lead.phone}`),
          createdBy: 'public-interest-form',
        });
      } catch (queueError) {
        // Do not turn a successfully saved lead into a failed form submission.
        console.error('Instruksi calon promotor gagal masuk antrean WhatsApp.', queueError instanceof Error ? queueError.message : 'Unknown error');
      }
    }
    let whatsappContact = '';
    try { whatsappContact = (await getPublicIntegrationSettings()).starsender.businessNumber || ''; } catch { /* A settings read must not turn a saved lead into a failed submission. */ }
    return NextResponse.json({
      ok: true,
      reference: result.reference,
      referralRecorded: 'sourcePartnerUserId' in result.lead && Boolean(result.lead.sourcePartnerUserId),
      referralAlias: 'sourceReferralAlias' in result.lead ? result.lead.sourceReferralAlias : '',
      status: result.status,
      match: isTestLead ? result.match : null,
      whatsappContact,
    }, { status: 201 });
  } catch (error) {
    return publicInterestErrorResponse(error);
  }
}

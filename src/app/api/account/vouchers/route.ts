import { getVoucherPortal, createVoucherOrder, getVoucherOrder } from '@/lib/voucher-store';
import { createMootaPaymentForOrder } from '@/lib/moota-store';
import { getPublicIntegrationSettings } from '@/lib/integration-settings';
import { readAdminJson } from '@/lib/admin-json';
import { voucherGuard, voucherJson, voucherFailure } from './http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try { const guard = await voucherGuard(request); if (guard.response) return guard.response; const portal = await getVoucherPortal(guard.principal!.userId); let whatsappContact=''; try { whatsappContact=(await getPublicIntegrationSettings()).starsender.businessNumber || ''; } catch { /* Contact number is optional; the voucher portal must still load. */ } return voucherJson({ ...portal, whatsappContact }); } catch (error) { return voucherFailure(error); }
}
export async function POST(request: Request) {
  try {
    const guard = await voucherGuard(request, true); if (guard.response) return guard.response;
    let input; try { input = await readAdminJson(request); } catch { return voucherJson({ message: 'Data permintaan tidak valid.' }, 400); }
    if (Object.keys(input).some(key => !['quantity', 'key', 'phone'].includes(key)) || !Number.isSafeInteger(input.quantity) || Number(input.quantity) < 1 || typeof input.key !== 'string' || !/^[a-zA-Z0-9-]{16,100}$/.test(input.key) || (input.phone !== undefined && typeof input.phone !== 'string')) return voucherJson({ message: 'Jumlah atau kunci permintaan tidak valid.' }, 400);
    let order = await createVoucherOrder(guard.principal!.userId, { quantity: Number(input.quantity), key: input.key, phone: input.phone });
    let paymentSetupWarning = '';
    if (order.mode === 'live' && order.paymentStatus !== 'paid' && !order.paymentUrl) {
      try { await createMootaPaymentForOrder(order.id, guard.principal!.userId); order = (await getVoucherOrder(guard.principal!.userId, order.id)) || order; }
      catch { paymentSetupWarning = 'Pesanan voucher sudah dibuat, tetapi link pembayaran belum berhasil disiapkan. Jangan transfer manual dulu. Coba buat pesanan lagi dengan jumlah yang sama atau hubungi admin.'; order = (await getVoucherOrder(guard.principal!.userId, order.id)) || order; }
    }
    return voucherJson({ order, paymentSetupWarning }, 201);
  } catch (error) { return voucherFailure(error); }
}

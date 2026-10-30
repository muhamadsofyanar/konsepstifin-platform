import { getAdminVouchers, saveVoucherSettings } from '@/lib/voucher-store';
import { commerceGuard } from '@/lib/commerce-http';
import { readAdminJson } from '@/lib/admin-json';
import { voucherJson, voucherFailure } from '../../account/vouchers/http';
export const runtime = 'nodejs';
export async function GET(request: Request) { try { const guard = await commerceGuard(request); if (guard.response) return guard.response; return voucherJson(await getAdminVouchers()); } catch (error) { return voucherFailure(error); } }
export async function POST(request: Request) {
  try { const guard = await commerceGuard(request, true); if (guard.response) return guard.response; let input; try { input = await readAdminJson(request); } catch { return voucherJson({ message: 'Data permintaan tidak valid.' }, 400); }
    if (Object.keys(input).some(key => !['unitPrice', 'maxQuantity'].includes(key)) || !Number.isSafeInteger(input.unitPrice) || Number(input.unitPrice) < 1 || !Number.isSafeInteger(input.maxQuantity) || Number(input.maxQuantity) < 1) return voucherJson({ message: 'Harga dan batas jumlah harus bilangan bulat positif.' }, 400);
    return voucherJson({ settings: await saveVoucherSettings(guard.principal!.userId, { unitPrice: Number(input.unitPrice), maxQuantity: Number(input.maxQuantity) }) });
  } catch (error) { return voucherFailure(error); }
}

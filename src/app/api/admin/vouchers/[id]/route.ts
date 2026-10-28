import { getVoucherFulfillment, reconcileVoucherOrder } from '@/lib/voucher-store';
import { commerceGuard } from '@/lib/commerce-http';
import { readAdminJson } from '@/lib/admin-json';
import { voucherJson, voucherFailure, validId } from '../../../account/vouchers/http';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try { const guard = await commerceGuard(request); if (guard.response) return guard.response; const id = validId((await context.params).id); if (!id) return voucherJson({ message: 'Pesanan tidak ditemukan.' }, 404); return voucherJson({ fulfillment: await getVoucherFulfillment(id) }); } catch (error) { return voucherFailure(error); }
}
export async function POST(request: Request, context: Context) {
  try { const guard = await commerceGuard(request, true); if (guard.response) return guard.response; const id = validId((await context.params).id); if (!id) return voucherJson({ message: 'Pesanan tidak ditemukan.' }, 404); let input; try { input = await readAdminJson(request); } catch { return voucherJson({ message: 'Data permintaan tidak valid.' }, 400); }
    if (Object.keys(input).some(key => !['action', 'note', 'reference'].includes(key)) || !['confirm_success', 'confirm_not_delivered'].includes(String(input.action)) || typeof input.note !== 'string' || !input.note.trim() || input.note.length > 2000 || typeof input.reference !== 'string' || !input.reference.trim() || input.reference.length > 200) return voucherJson({ message: 'Tindakan, catatan, dan referensi pemeriksaan diperlukan.' }, 400);
    return voucherJson({ fulfillment: await reconcileVoucherOrder(guard.principal!.userId, id, { action: input.action as 'confirm_success' | 'confirm_not_delivered', note: input.note, reference: input.reference }) });
  } catch (error) { return voucherFailure(error); }
}

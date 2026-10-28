import { getVoucherOrder } from '@/lib/voucher-store';
import { voucherGuard, voucherJson, voucherFailure, validId } from '../http';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const guard = await voucherGuard(request); if (guard.response) return guard.response; const id = validId((await context.params).id); if (!id) return voucherJson({ message: 'Pesanan tidak ditemukan.' }, 404); const order = await getVoucherOrder(guard.principal!.userId, id); return order ? voucherJson({ order }) : voucherJson({ message: 'Pesanan tidak ditemukan.' }, 404); } catch (error) { return voucherFailure(error); }
}

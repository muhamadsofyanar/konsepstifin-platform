import { getVoucherPortal, createVoucherOrder } from '@/lib/voucher-store';
import { readAdminJson } from '@/lib/admin-json';
import { voucherGuard, voucherJson, voucherFailure } from './http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try { const guard = await voucherGuard(request); if (guard.response) return guard.response; return voucherJson(await getVoucherPortal(guard.principal!.userId)); } catch (error) { return voucherFailure(error); }
}
export async function POST(request: Request) {
  try {
    const guard = await voucherGuard(request, true); if (guard.response) return guard.response;
    let input; try { input = await readAdminJson(request); } catch { return voucherJson({ message: 'Data permintaan tidak valid.' }, 400); }
    if (Object.keys(input).some(key => !['quantity', 'key'].includes(key)) || !Number.isSafeInteger(input.quantity) || Number(input.quantity) < 1 || typeof input.key !== 'string' || !/^[a-zA-Z0-9-]{16,100}$/.test(input.key)) return voucherJson({ message: 'Jumlah atau kunci permintaan tidak valid.' }, 400);
    return voucherJson({ order: await createVoucherOrder(guard.principal!.userId, { quantity: Number(input.quantity), key: input.key }) }, 201);
  } catch (error) { return voucherFailure(error); }
}

import { getVoucherBalance } from '@/lib/voucher-store';
import { voucherGuard, voucherJson, voucherFailure } from '../http';
export const runtime = 'nodejs';
export async function GET(request: Request) { try { const guard = await voucherGuard(request); if (guard.response) return guard.response; return voucherJson(await getVoucherBalance(guard.principal!.userId)); } catch (error) { return voucherFailure(error); } }

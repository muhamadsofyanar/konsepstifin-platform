import { VoucherError } from '@/lib/voucher-domain';
import { getAccountPrincipal } from '@/lib/identity/server';
import { isSameOriginMutation } from '@/lib/admin-request';
export const voucherJson = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
export async function voucherGuard(request: Request, write = false) {
  const principal = await getAccountPrincipal();
  if (!principal || !principal.active || !principal.sessionValid) return { response: voucherJson({ message: 'Silakan masuk.' }, 401) };
  if (!principal.roles.some(role => ['promoter', 'admin', 'super_admin'].includes(role))) return { response: voucherJson({ message: 'Akses promotor diperlukan.' }, 403) };
  if (write && !isSameOriginMutation(request)) return { response: voucherJson({ message: 'Origin permintaan tidak valid.' }, 403) };
  return { principal };
}
export function voucherFailure(error: unknown) {
  if (error instanceof SyntaxError || error instanceof VoucherError) return voucherJson({ message: error.message }, 400);
  return voucherJson({ message: 'Layanan voucher belum tersedia. Coba kembali nanti.' }, 503);
}
export function validId(value: string) { const id = Number(value); return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null; }

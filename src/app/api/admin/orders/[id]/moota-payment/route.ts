import { requireAdminRequest } from '@/lib/admin-request';
import { createMootaPaymentForOrder } from '@/lib/moota-store';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  const principal = await requireAdminRequest(request);
  if (!principal) return Response.json({ message: 'Akses ditolak atau origin tidak valid.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const id = Number((await context.params).id);
  try {
    const result = await createMootaPaymentForOrder(id, principal.userId);
    return Response.json({ order: result.order, invoice: { invoiceId: result.invoice.invoiceId, paymentUrl: result.invoice.paymentUrl, paymentAmount: result.invoice.paymentAmount, expiresAt: result.invoice.expiresAt }, message: 'Link pembayaran Moota berhasil dibuat.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Tagihan Moota gagal dibuat.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}

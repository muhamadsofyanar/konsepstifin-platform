import { requireAdminRequest } from '@/lib/admin-request';
import { reconcileMootaEvent } from '@/lib/moota-store';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const actor = await requireAdminRequest(request);
  if (!actor) return Response.json({ message: 'Akses ditolak atau origin tidak valid.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  try {
    const input = await request.json() as Record<string, unknown>;
    const result = await reconcileMootaEvent(String(input.eventId ?? ''), Number(input.orderId), actor.userId);
    return Response.json({ ...result, message: `Webhook berhasil direkonsiliasi ke pesanan #${result.orderId}.` }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : 'Rekonsiliasi gagal.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}

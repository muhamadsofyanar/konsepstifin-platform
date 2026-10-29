import { verifyMootaSignature } from '@/lib/moota-client';
import { processMootaWebhookPayload } from '@/lib/moota-store';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 1_000_000) return Response.json({ message: 'Payload terlalu besar.' }, { status: 413 });
  const signature = request.headers.get('signature') || request.headers.get('Signature') || '';
  if (!verifyMootaSignature(raw, signature)) return Response.json({ message: 'Signature Moota tidak valid.' }, { status: 403 });
  let payload: unknown;
  try { payload = JSON.parse(raw) as unknown; } catch { return Response.json({ message: 'JSON Moota tidak valid.' }, { status: 400 }); }
  try {
    const result = await processMootaWebhookPayload(payload);
    return Response.json({ message: 'Webhook diterima.', ...result }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // A 5xx response lets Moota retry when database processing has not completed.
    return Response.json({ message: 'Webhook belum dapat diproses. Moota dapat mencoba kembali.' }, { status: 503 });
  }
}

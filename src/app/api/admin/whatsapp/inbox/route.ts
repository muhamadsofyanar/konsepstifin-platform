import { getAccountPrincipal } from '@/lib/identity/server';
import { accessScope } from '@/lib/identity/access-policy';
import { isSameOriginMutation } from '@/lib/admin-request';
import { getWhatsappConversation, getWhatsappInboxSummary, listWhatsappConversations, queueWhatsappReply, setWhatsappConversationMode } from '@/lib/whatsapp-store';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
async function actor() { const principal = await getAccountPrincipal(); return principal && accessScope(principal).kind !== 'none' ? principal : null; }
export async function GET(request: Request) {
  try {
    const principal = await actor();
    if (!principal) return json({ message: 'Akses inbox tidak tersedia.' }, 401);
    const url = new URL(request.url);
    const id = url.searchParams.get('conversationId');
    if (id) {
      const result = await getWhatsappConversation(principal, id);
      return result ? json(result) : json({ message: 'Percakapan tidak ditemukan atau akses tidak tersedia.' }, 404);
    }
    const [conversations, summary] = await Promise.all([
      listWhatsappConversations(principal, url.searchParams.get('q') || '', url.searchParams.get('status') || 'all'),
      getWhatsappInboxSummary(principal),
    ]);
    return json({ conversations, summary });
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Inbox belum dapat dimuat. Pastikan migrasi 015 sudah dijalankan.' }, 503); }
}
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return json({ message: 'Origin permintaan tidak valid.' }, 403);
  try {
    const principal = await actor();
    if (!principal) return json({ message: 'Akses inbox tidak tersedia.' }, 401);
    const input = await request.json() as Record<string, unknown>;
    const conversationId = String(input.conversationId || '');
    if (!/^[0-9a-f-]{36}$/i.test(conversationId)) throw new Error('ID percakapan tidak valid.');
    if (input.action === 'send') {
      if (typeof input.message !== 'string') throw new Error('Isi pesan tidak valid.');
      return json(await queueWhatsappReply(principal, conversationId, input.message), 202);
    }
    if (input.action === 'mode' && (input.mode === 'bot' || input.mode === 'human' || input.mode === 'closed')) {
      return json({ conversation: await setWhatsappConversationMode(principal, conversationId, input.mode) });
    }
    throw new Error('Tindakan inbox tidak dikenal.');
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Tindakan inbox gagal.' }, 400); }
}

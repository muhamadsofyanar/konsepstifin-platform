import { getAccountPrincipal } from '@/lib/identity/server';
import { isSameOriginMutation } from '@/lib/admin-request';
import { getIntegrationConfig } from '@/lib/integration-settings';
import { getWhatsappBotSettings, saveWhatsappBotSettings } from '@/lib/whatsapp-store';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
function admin(principal: Awaited<ReturnType<typeof getAccountPrincipal>>) { return Boolean(principal?.active && principal.sessionValid && principal.roles.some(role => role === 'admin' || role === 'super_admin')); }
export async function GET() {
  try {
    const principal = await getAccountPrincipal();
    if (!admin(principal)) return json({ message: 'Akses admin diperlukan.' }, 403);
    const [bot, config] = await Promise.all([getWhatsappBotSettings(), getIntegrationConfig()]);
    return json({ bot, openai: { configured: Boolean(config.openai.apiKey), model: config.openai.model }, starsender: { configured: Boolean(config.starsender.apiKey), webhookConfigured: Boolean(config.starsender.webhookSecret) } });
  } catch { return json({ message: 'Pengaturan WhatsApp belum tersedia. Jalankan migrasi 015.' }, 503); }
}
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return json({ message: 'Origin permintaan tidak valid.' }, 403);
  try {
    const principal = await getAccountPrincipal();
    if (!admin(principal)) return json({ message: 'Hanya admin yang dapat mengubah pengaturan chatbot.' }, 403);
    const input = await request.json() as Record<string, unknown>;
    if (input.action !== 'bot') throw new Error('Tindakan pengaturan tidak dikenal.');
    if (input.enabled === true) {
      const config = await getIntegrationConfig();
      if (!config.starsender.apiKey || !config.starsender.webhookSecret) throw new Error('Konfigurasikan Device API key dan Webhook Premium StarSender sebelum mengaktifkan chatbot.');
    }
    const bot = await saveWhatsappBotSettings(principal!, { enabled: input.enabled === true, systemInstructions: String(input.systemInstructions ?? ''), aiProcessingAcknowledged: input.aiProcessingAcknowledged === true });
    return json({ bot, message: bot.enabled ? 'Chatbot internal diaktifkan.' : 'Chatbot internal dinonaktifkan.' });
  } catch (error) { return json({ message: error instanceof Error ? error.message : 'Pengaturan chatbot gagal disimpan.' }, 400); }
}

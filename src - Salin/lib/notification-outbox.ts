import { createHash } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { starsenderStatus } from '@/lib/starsender-client';

export type QueuedMessage = {
  eventType: string;
  phone: string;
  name?: string;
  message: string;
  dedupeKey: string;
  leadId?: number | null;
  orderId?: number | null;
  campaignId?: string | null;
  createdBy?: string;
};

export async function queueWhatsAppMessage(input: QueuedMessage): Promise<boolean> {
  if (!(await starsenderStatus()).configured || !input.phone.trim() || !input.message.trim()) return false;
  const sql = getDatabaseClient();
  const [row] = await sql`
    INSERT INTO notification_outbox
      (event_type, lead_id, order_id, campaign_id, recipient_phone, recipient_name, message, dedupe_key, created_by)
    VALUES
      (${input.eventType}, ${input.leadId ?? null}, ${input.orderId ?? null}, ${input.campaignId ?? null},
       ${input.phone.trim()}, ${(input.name ?? '').slice(0, 160)}, ${input.message.trim()}, ${input.dedupeKey}, ${(input.createdBy ?? 'system').slice(0, 200)})
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING id`;
  return Boolean(row);
}

export function stableNotificationKey(prefix: string, value: string) {
  return `${prefix}:${createHash('sha256').update(value).digest('hex').slice(0, 48)}`;
}

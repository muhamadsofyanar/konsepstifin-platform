import { createHash } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { createMootaInvoice, type MootaInvoiceResult } from '@/lib/moota-client';
import { stableNotificationKey } from '@/lib/notification-outbox';
import { normalizeWhatsAppNumber, starsenderStatus } from '@/lib/starsender-client';
import { getLearningService } from '@/lib/learning-store';
import { processVoucherOrder } from '@/lib/voucher-store';
import type { CommerceOrder } from '@/lib/commerce-service';

function asString(value: unknown) { return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''; }
function asAmount(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[,_\s]/g, ''));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 999999999999 ? amount : 0;
}
function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function createMootaPaymentForOrder(orderId: number, actor: string): Promise<{ order: CommerceOrder; invoice: MootaInvoiceResult }> {
  if (!Number.isSafeInteger(orderId) || orderId < 1) throw new Error('ID pesanan tidak valid.');
  const sql = getDatabaseClient();
  const [row] = await sql`
    SELECT o.*, COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0) AS balance
    FROM commerce_orders o WHERE o.id=${orderId}`;
  if (!row) throw new Error('Pesanan tidak ditemukan.');
  if (row.state !== 'issued') throw new Error('Terbitkan pesanan sebelum membuat tagihan Moota.');
  if (Number(row.balance) >= Number(row.total)) throw new Error('Pesanan sudah lunas.');
  if (asString(row.moota_payment_url)) throw new Error('Link pembayaran Moota sudah dibuat untuk pesanan ini.');
  const lines = Array.isArray(row.lines) ? row.lines as Array<Record<string, unknown>> : [];
  const description = lines.map(line => asString(line.name)).filter(Boolean).join(', ').slice(0, 250) || `Pesanan ${asString(row.number)}`;
  const invoice = await createMootaInvoice({
    orderNumber: asString(row.number), customerName: asString(row.customer_name),
    customerPhone: asString(row.customer_phone), customerEmail: asString(row.customer_email),
    amount: Number(row.total) - Number(row.balance), description,
  });
  const phone = asString(row.customer_phone);
  const customerName = asString(row.customer_name) || 'Bapak/Ibu';
  await sql.begin(async tx => {
    const [updated] = await tx`
      UPDATE commerce_orders
      SET moota_invoice_id=${invoice.invoiceId}, moota_payment_url=${invoice.paymentUrl},
          moota_payment_amount=${invoice.paymentAmount}, moota_expires_at=${invoice.expiresAt}, updated_at=now()
      WHERE id=${orderId} AND state='issued' AND (moota_payment_url IS NULL OR moota_payment_url='')
      RETURNING id`;
    if (!updated) throw new Error('Tagihan Moota dibuat, tetapi pesanan berubah saat proses berlangsung. Periksa dashboard Moota sebelum membuat tagihan ulang.');
    await tx`
      INSERT INTO commerce_audit(order_id,action,operation_key,payload,actor)
      VALUES (${orderId},'moota.invoice.created',${`moota-invoice:${invoice.invoiceId}`},${JSON.stringify({invoiceId:invoice.invoiceId,paymentUrl:invoice.paymentUrl})},${actor})
      ON CONFLICT (order_id,operation_key) DO NOTHING`;
    let validPhone = false;
    if (phone && starsenderStatus().configured) {
      try { normalizeWhatsAppNumber(phone); validPhone = true; } catch { /* Invalid recipient numbers are not queued. */ }
    }
    if (validPhone) {
      await tx`
        INSERT INTO notification_outbox(event_type,order_id,recipient_phone,recipient_name,message,dedupe_key,created_by)
        VALUES ('payment_link_created',${orderId},${phone},${customerName},${`Halo ${customerName}, tagihan KonsepSTIFIn ${asString(row.number)} sebesar Rp${invoice.paymentAmount.toLocaleString('id-ID')} sudah tersedia. Silakan lanjutkan pembayaran melalui tautan berikut: ${invoice.paymentUrl}\n\nJika Anda sudah membayar, abaikan pesan ini.`},${`moota-invoice:${invoice.invoiceId}`},${actor})
        ON CONFLICT(dedupe_key) DO NOTHING`;
    }
  });
  const [fresh] = await sql`SELECT id FROM commerce_orders WHERE id=${orderId}`;
  const { getOrder } = await import('@/lib/commerce-store');
  const order = await getOrder(Number(fresh.id));
  if (!order) throw new Error('Tagihan dibuat, tetapi rincian pesanan gagal dimuat.');
  return { order, invoice };
}

function isIncoming(event: Record<string, unknown>) {
  const type = asString(event.type ?? event.transaction_type ?? event.direction ?? event.mutation_type).toLowerCase();
  const status = asString(event.status ?? event.payment_status ?? event.state).toLowerCase();
  if (['dr','debit','out','outgoing','withdrawal'].includes(type)) return false;
  if (['cr','credit','in','incoming','deposit','receive','received'].includes(type)) return true;
  return ['paid','success','successful','settled','completed','complete'].includes(status);
}
function eventIdentity(event: Record<string, unknown>) {
  const supplied = asString(event.mutation_id ?? event.transaction_id ?? event.event_id ?? event.payment_id ?? event.id);
  if (!supplied) return `moota:sha256:${createHash('sha256').update(JSON.stringify(event)).digest('hex')}`;
  return supplied.length <= 160 ? `moota:${supplied}` : `moota:sha256:${createHash('sha256').update(supplied).digest('hex')}`;
}
function eventInvoiceId(event: Record<string, unknown>) {
  return asString(event.invoice_id ?? event.invoiceId ?? event.terima_uang_id ?? event.receive_money_id ?? event.payment_id ?? event.payment_reference);
}
function eventReference(event: Record<string, unknown>) {
  return asString(event.description ?? event.note ?? event.notes ?? event.order_number ?? event.reference ?? event.merchant_reference ?? event.transaction_description).slice(0, 500);
}

export async function processMootaWebhookPayload(payload: unknown) {
  const root = asObject(payload);
  const nested = root.data;
  const events = Array.isArray(payload) ? payload : Array.isArray(nested) ? nested : nested && typeof nested === 'object' && !('amount' in root) && !('mutation_id' in root) ? [nested] : [payload];
  if (!events.length || events.length > 100) throw new Error('Payload Moota kosong atau melebihi 100 transaksi.');
  const results: Array<{ eventId: string; state: string; orderId?: number }> = [];
  for (const raw of events) {
    const event = asObject(raw);
    if (!Object.keys(event).length) continue;
    const eventId = eventIdentity(event);
    const amount = asAmount(event.amount ?? event.paid_amount ?? event.total_amount ?? event.payment_amount);
    const reference = eventReference(event);
    const invoiceId = eventInvoiceId(event);
    const eventType = asString(event.type ?? event.status ?? event.event ?? event.event_type).slice(0, 80);
    const sql = getDatabaseClient();
    let outcome: { state: string; orderId?: number } = { state: 'unmatched' };
    await sql.begin(async tx => {
      const inserted = await tx`
        INSERT INTO moota_webhook_events(event_id,event_type,amount,reference,payload,processing_state)
        VALUES (${eventId},${eventType},${amount || null},${reference},${JSON.stringify(event)},'received')
        ON CONFLICT(event_id) DO NOTHING RETURNING event_id`;
      if (!inserted.length) { outcome = { state: 'duplicate' }; return; }
      if (!isIncoming(event) || !amount) {
        await tx`UPDATE moota_webhook_events SET processing_state='ignored',processing_note=${!isIncoming(event) ? 'Mutasi bukan dana masuk.' : 'Nominal tidak valid.'},processed_at=now() WHERE event_id=${eventId}`;
        outcome = { state: 'ignored' }; return;
      }
      let candidates: Record<string, unknown>[] = [];
      if (invoiceId) {
        candidates = await tx`
          SELECT o.id,o.number,o.total,o.state,o.customer_name,o.customer_phone,o.moota_payment_amount,
            COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0) AS balance
          FROM commerce_orders o WHERE o.moota_invoice_id=${invoiceId} AND o.state='issued' FOR UPDATE`;
      }
      if (!candidates.length && reference) {
        const [number] = await tx`SELECT number FROM commerce_orders WHERE ${reference} LIKE '%' || number || '%' AND state='issued' ORDER BY id DESC LIMIT 1`;
        if (number) candidates = await tx`
          SELECT o.id,o.number,o.total,o.state,o.customer_name,o.customer_phone,o.moota_payment_amount,
            COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0) AS balance
          FROM commerce_orders o WHERE o.number=${number.number} AND o.state='issued' FOR UPDATE`;
      }
      if (!candidates.length) {
        candidates = await tx`
          SELECT o.id,o.number,o.total,o.state,o.customer_name,o.customer_phone,o.moota_payment_amount,
            COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0) AS balance
          FROM commerce_orders o
          WHERE o.state='issued' AND o.moota_payment_url IS NOT NULL AND o.moota_payment_url<>''
            AND COALESCE(o.moota_payment_amount,o.total)=${amount}
            AND COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0)<o.total
          ORDER BY o.id DESC LIMIT 2 FOR UPDATE`;
      }
      if (candidates.length !== 1) {
        const note = candidates.length > 1 ? 'Transaksi cocok dengan lebih dari satu pesanan; perlu rekonsiliasi manual.' : 'Pesanan yang cocok tidak ditemukan; perlu rekonsiliasi manual.';
        await tx`UPDATE moota_webhook_events SET processing_state='unmatched',processing_note=${note},processed_at=now() WHERE event_id=${eventId}`;
        outcome = { state: 'unmatched' }; return;
      }
      const order = candidates[0];
      const balance = Number(order.balance);
      const outstanding = Number(order.total) - balance;
      if (amount > outstanding || (amount !== outstanding && !invoiceId && !reference.includes(asString(order.number)))) {
        await tx`UPDATE moota_webhook_events SET processing_state='unmatched',order_id=${Number(order.id)},processing_note='Nominal tidak cocok dengan sisa tagihan; perlu pemeriksaan manual.',processed_at=now() WHERE event_id=${eventId}`;
        outcome = { state: 'unmatched', orderId: Number(order.id) }; return;
      }
      const auditKey = `moota:${eventId}`;
      const [existingAudit] = await tx`SELECT id FROM commerce_audit WHERE order_id=${Number(order.id)} AND operation_key=${auditKey}`;
      if (existingAudit) {
        await tx`UPDATE moota_webhook_events SET processing_state='processed',order_id=${Number(order.id)},processing_note='Pembayaran sebelumnya telah tercatat.',processed_at=now() WHERE event_id=${eventId}`;
        outcome = { state: 'duplicate', orderId: Number(order.id) }; return;
      }
      await tx`
        INSERT INTO commerce_ledger(order_id,kind,amount,reason,reference,actor)
        VALUES (${Number(order.id)},'receipt',${amount},'Pembayaran otomatis terverifikasi melalui Moota',${eventId},'moota:webhook')`;
      await tx`
        INSERT INTO commerce_audit(order_id,action,operation_key,payload,actor)
        VALUES (${Number(order.id)},'receipt',${auditKey},${JSON.stringify({provider:'moota',eventId,amount,reference})},'moota:webhook')`;
      const received = balance + amount;
      const customerPhone = asString(order.customer_phone);
      const customerName = asString(order.customer_name) || 'Bapak/Ibu';
      const paid = received >= Number(order.total);
      let validCustomerPhone = false;
      if (customerPhone && starsenderStatus().configured) {
        try { normalizeWhatsAppNumber(customerPhone); validCustomerPhone = true; } catch { /* Invalid recipient numbers are not queued. */ }
      }
      if (validCustomerPhone) {
        const amountText = `Rp${received.toLocaleString('id-ID')}`;
        const message = paid
          ? `Halo ${customerName}, pembayaran untuk pesanan KonsepSTIFIn ${asString(order.number)} sudah terverifikasi. Terima kasih. Nilai pembayaran tercatat: ${amountText}.`
          : `Halo ${customerName}, pembayaran sebagian untuk pesanan KonsepSTIFIn ${asString(order.number)} sudah terverifikasi. Nilai yang tercatat: ${amountText}. Silakan hubungi tim kami untuk informasi sisa tagihan.`;
        await tx`
          INSERT INTO notification_outbox(event_type,order_id,recipient_phone,recipient_name,message,dedupe_key,created_by)
          VALUES ('moota_payment_received',${Number(order.id)},${customerPhone},${customerName},${message},${stableNotificationKey('moota-paid', eventId)},'moota:webhook')
          ON CONFLICT(dedupe_key) DO NOTHING`;
      }
      await tx`UPDATE moota_webhook_events SET processing_state='processed',order_id=${Number(order.id)},processing_note='Pembayaran tercatat otomatis.',processed_at=now() WHERE event_id=${eventId}`;
      outcome = { state: 'processed', orderId: Number(order.id) };
    });
    if (outcome.state === 'processed' && outcome.orderId) {
      try { await processVoucherOrder(outcome.orderId); } catch { /* worker will recover fulfillment */ }
      try { await getLearningService().reconcile(outcome.orderId); } catch { /* learning worker reconciles durable pending jobs */ }
    }
    results.push({ eventId, state: outcome.state, ...(outcome.orderId ? { orderId: outcome.orderId } : {}) });
  }
  return { received: events.length, results };
}


export async function reconcileMootaEvent(eventId: string, orderId: number, actor: string) {
  const key = eventId.trim();
  if (!key || key.length > 200) throw new Error('ID webhook tidak valid.');
  if (!Number.isSafeInteger(orderId) || orderId < 1) throw new Error('ID pesanan tidak valid.');
  const sql = getDatabaseClient();
  await sql.begin(async tx => {
    const [event] = await tx`SELECT event_id,amount,payload,processing_state FROM moota_webhook_events WHERE event_id=${key} FOR UPDATE`;
    if (!event) throw new Error('Event Moota tidak ditemukan.');
    if (event.processing_state !== 'unmatched') throw new Error('Hanya event yang belum cocok yang dapat direkonsiliasi.');
    const amount = asAmount(event.amount);
    const payload = asObject(event.payload);
    if (!amount || !isIncoming(payload)) throw new Error('Event bukan pembayaran masuk yang valid.');
    const [order] = await tx`
      SELECT o.id,o.number,o.total,o.state,o.customer_name,o.customer_phone,
        COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0) AS balance
      FROM commerce_orders o WHERE o.id=${orderId} FOR UPDATE`;
    if (!order || order.state !== 'issued') throw new Error('Pesanan tidak ditemukan atau belum diterbitkan.');
    const outstanding = Number(order.total) - Number(order.balance);
    if (amount > outstanding) throw new Error('Nominal webhook melebihi sisa tagihan. Periksa pesanan sebelum melanjutkan.');
    const operationKey = `moota-manual:${key}`;
    const [existing] = await tx`SELECT id FROM commerce_audit WHERE order_id=${orderId} AND operation_key=${operationKey}`;
    if (existing) throw new Error('Event ini sudah direkonsiliasi.');
    await tx`
      INSERT INTO commerce_ledger(order_id,kind,amount,reason,reference,actor)
      VALUES (${orderId},'receipt',${amount},'Rekonsiliasi manual webhook Moota',${key},${actor})`;
    await tx`
      INSERT INTO commerce_audit(order_id,action,operation_key,payload,actor)
      VALUES (${orderId},'receipt',${operationKey},${JSON.stringify({provider:'moota',eventId:key,amount,manual:true})},${actor})`;
    const received = Number(order.balance) + amount;
    const phone = asString(order.customer_phone);
    let validPhone = false;
    if (phone && starsenderStatus().configured) {
      try { normalizeWhatsAppNumber(phone); validPhone = true; } catch { /* Invalid recipient numbers are not queued. */ }
    }
    if (validPhone) {
      const name = asString(order.customer_name) || 'Bapak/Ibu';
      const message = received >= Number(order.total)
        ? `Halo ${name}, pembayaran untuk pesanan KonsepSTIFIn ${asString(order.number)} sudah diverifikasi. Terima kasih.`
        : `Halo ${name}, pembayaran sebagian untuk pesanan KonsepSTIFIn ${asString(order.number)} sudah diverifikasi. Silakan hubungi tim kami untuk informasi sisa tagihan.`;
      await tx`
        INSERT INTO notification_outbox(event_type,order_id,recipient_phone,recipient_name,message,dedupe_key,created_by)
        VALUES ('moota_manual_reconciliation',${orderId},${phone},${name},${message},${stableNotificationKey('moota-manual',key)},${actor})
        ON CONFLICT(dedupe_key) DO NOTHING`;
    }
    await tx`
      UPDATE moota_webhook_events SET processing_state='processed',order_id=${orderId},processing_note=${`Direkonsiliasi manual oleh ${actor}.`},processed_at=now()
      WHERE event_id=${key}`;
  });
  try { await processVoucherOrder(orderId); } catch { /* worker will recover fulfillment */ }
  try { await getLearningService().reconcile(orderId); } catch { /* learning worker reconciles durable pending jobs */ }
  return { reconciled: true, orderId };
}

export async function listMootaUnmatchedEvents(limit = 100) {
  const sql = getDatabaseClient();
  return await sql`
    SELECT event_id,event_type,amount,reference,processing_state,processing_note,received_at,order_id
    FROM moota_webhook_events WHERE processing_state='unmatched' ORDER BY received_at DESC LIMIT ${Math.max(1, Math.min(250, Math.trunc(limit)))}`;
}

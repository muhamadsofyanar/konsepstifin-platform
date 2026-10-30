import { createHash } from 'node:crypto';
import { getDatabaseClient } from '@/lib/article-store';
import { createMootaInvoice, type MootaInvoiceResult } from '@/lib/moota-client';
import { stableNotificationKey } from '@/lib/notification-outbox';
import { normalizeWhatsAppNumber } from '@/lib/starsender-client';
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }

async function queueInvoiceNotifications(tx: any, row: Record<string, unknown>, invoice: MootaInvoiceResult, actor: string) {
  const orderId = Number(row.id);
  const orderNumber = asString(row.number);
  const customerName = asString(row.customer_name) || 'Bapak/Ibu';
  const customerPhone = asString(row.customer_phone);
  const customerEmail = asString(row.customer_email).toLowerCase();
  const amountText = `Rp${invoice.paymentAmount.toLocaleString('id-ID')}`;
  const expiresText = invoice.expiresAt ? ` Tautan berlaku sampai ${new Date(invoice.expiresAt).toLocaleString('id-ID')}.` : '';
  if (customerPhone) {
    try {
      normalizeWhatsAppNumber(customerPhone);
      const message = `Halo ${customerName}, tagihan KonsepSTIFIn ${orderNumber} sebesar ${amountText} sudah tersedia. Silakan buka tautan pembayaran berikut: ${invoice.paymentUrl}${expiresText}\n\nJika sudah membayar, abaikan pesan ini. Untuk menerima instruksi WhatsApp, kirim pesan terlebih dahulu ke nomor KonsepSTIFIn. Balas STOP jika tidak ingin menerima pesan WhatsApp lagi.`;
      await tx`INSERT INTO notification_outbox(event_type,order_id,recipient_phone,recipient_name,message,dedupe_key,created_by,expires_at)
        VALUES ('payment_link_created',${orderId},${customerPhone},${customerName},${message},${`moota-invoice:${invoice.invoiceId}`},${actor},${invoice.expiresAt})
        ON CONFLICT(dedupe_key) DO NOTHING`;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Nomor WhatsApp tidak valid')) { /* email remains available */ }
      else throw error;
    }
  }
  if (validEmail(customerEmail)) {
    const safeName = escapeHtml(customerName), safeOrder = escapeHtml(orderNumber), safeAmount = escapeHtml(amountText), safeUrl = escapeHtml(invoice.paymentUrl);
    const expiryHtml = invoice.expiresAt ? `<p>Tautan berlaku sampai <strong>${escapeHtml(new Date(invoice.expiresAt).toLocaleString('id-ID'))}</strong>.</p>` : '';
    const content = `<html><body style="font-family:Arial,sans-serif;color:#173c2e;line-height:1.6"><h2>Instruksi pembayaran KonsepSTIFIn</h2><p>Halo ${safeName},</p><p>Pesanan <strong>${safeOrder}</strong> sudah dibuat dengan total tagihan <strong>${safeAmount}</strong>.</p><p><a href="${safeUrl}" style="display:inline-block;background:#087f63;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Bayar sekarang</a></p><p>Gunakan tautan resmi di atas untuk menyelesaikan pembayaran. Status pesanan akan diperbarui setelah Moota mengonfirmasi transaksi.</p>${expiryHtml}<p>Jika Anda sudah membayar, abaikan email ini. Jangan kirim kata sandi, OTP, atau data perbankan melalui email.</p><p>KonsepSTIFIn</p></body></html>`;
    await tx`INSERT INTO email_notification_outbox(event_type,order_id,recipient_email,recipient_name,subject,content,dedupe_key,expires_at,created_by)
      VALUES ('payment_link_created',${orderId},${customerEmail},${customerName},${`Instruksi pembayaran ${orderNumber} | KonsepSTIFIn`},${content},${`moota-invoice:${invoice.invoiceId}`},${invoice.expiresAt},${actor})
      ON CONFLICT(dedupe_key) DO NOTHING`;
  }
}

export async function createMootaPaymentForOrder(orderId: number, actor: string): Promise<{ order: CommerceOrder; invoice: MootaInvoiceResult }> {
  if (!Number.isSafeInteger(orderId) || orderId < 1) throw new Error('ID pesanan tidak valid.');
  const sql = getDatabaseClient();
  const claim: { row: Record<string, unknown>; existing: boolean; blockedError?: string } = await sql.begin(async tx => {
    const [row] = await tx`SELECT o.*, COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0) AS balance
      FROM commerce_orders o WHERE o.id=${orderId} FOR UPDATE`;
    if (!row) throw new Error('Pesanan tidak ditemukan.');
    if (row.state !== 'issued') throw new Error('Terbitkan pesanan sebelum membuat tagihan Moota.');
    if (row.is_simulation === true) throw new Error('Pesanan simulasi tidak membuat tagihan Moota.');
    if (Number(row.balance) >= Number(row.total)) throw new Error('Pesanan sudah lunas.');
    if (asString(row.moota_payment_url)) {
      const expiry = row.moota_expires_at ? new Date(String(row.moota_expires_at)).getTime() : 0;
      if (expiry && expiry <= Date.now()) {
        await tx`INSERT INTO commerce_audit(order_id,action,operation_key,payload,actor)
          VALUES (${orderId},'moota.invoice.expired',${`moota-expired:${asString(row.moota_invoice_id)}`},${JSON.stringify({invoiceId:asString(row.moota_invoice_id),expiredAt:row.moota_expires_at})},${actor})
          ON CONFLICT (order_id,operation_key) DO NOTHING`;
        await tx`UPDATE commerce_orders SET moota_invoice_id=NULL,moota_payment_url=NULL,moota_payment_amount=NULL,moota_expires_at=NULL,moota_invoice_status='failed',moota_invoice_error='Link sebelumnya kedaluwarsa; tagihan baru perlu dibuat.',updated_at=now() WHERE id=${orderId}`;
        row.moota_invoice_id = null; row.moota_payment_url = null; row.moota_payment_amount = null; row.moota_expires_at = null; row.moota_invoice_status = 'failed';
      } else return { row: row as Record<string, unknown>, existing: true };
    }
    const status = asString(row.moota_invoice_status || 'not_created');
    const requestedAt = row.moota_invoice_requested_at ? new Date(String(row.moota_invoice_requested_at)).getTime() : 0;
    if (status === 'creating') {
      if (requestedAt && Date.now() - requestedAt > 5 * 60 * 1000) {
        return { row: row as Record<string, unknown>, existing: false, blockedError: 'Status pembuatan tagihan belum pasti. Periksa transaksi di Moota sebelum mencoba lagi agar tidak membuat tagihan ganda.' };
      }
      throw new Error('Tagihan Moota sedang dibuat. Muat ulang pesanan sebentar lagi.');
    }
    if (status === 'unknown') throw new Error('Status tagihan Moota belum pasti. Periksa dashboard Moota sebelum mencoba lagi agar tidak membuat tagihan ganda.');
    await tx`UPDATE commerce_orders SET moota_invoice_status='creating',moota_invoice_error='',moota_invoice_requested_at=now(),updated_at=now() WHERE id=${orderId}`;
    return { row: row as Record<string, unknown>, existing: false };
  });

  if (claim.blockedError) {
    await sql`UPDATE commerce_orders SET moota_invoice_status='unknown',moota_invoice_error='Proses create melewati batas waktu. Periksa dashboard Moota sebelum mencoba lagi.',updated_at=now() WHERE id=${orderId} AND moota_invoice_status='creating'`;
    throw new Error(claim.blockedError);
  }
  const row = claim.row;
  let invoice: MootaInvoiceResult;
  if (claim.existing) {
    invoice = { invoiceId: asString(row.moota_invoice_id), paymentUrl: asString(row.moota_payment_url), paymentAmount: Number(row.moota_payment_amount || row.total), expiresAt: row.moota_expires_at ? new Date(String(row.moota_expires_at)).toISOString() : null, response: { existing: true } };
    await sql.begin(async tx => { await queueInvoiceNotifications(tx, row, invoice, actor); });
  } else {
    const lines = Array.isArray(row.lines) ? row.lines as Array<Record<string, unknown>> : [];
    const description = lines.map(line => asString(line.name)).filter(Boolean).join(', ').slice(0, 250) || `Pesanan ${asString(row.number)}`;
    try {
      invoice = await createMootaInvoice({ orderNumber: asString(row.number), customerName: asString(row.customer_name), customerPhone: asString(row.customer_phone), customerEmail: asString(row.customer_email), amount: Number(row.total) - Number(row.balance), description });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Moota gagal membuat tagihan.';
      const match = message.match(/HTTP (\d{3})/);
      const status = match ? Number(match[1]) : 0;
      const localConfigurationError = /belum dikonfigurasi|belum diatur|path api moota tidak valid|nominal tagihan moota tidak valid/i.test(message);
      const state = localConfigurationError || (status >= 400 && status < 500) ? 'failed' : 'unknown';
      await sql`UPDATE commerce_orders SET moota_invoice_status=${state},moota_invoice_error=${message.slice(0,500)},updated_at=now() WHERE id=${orderId} AND moota_invoice_status='creating'`;
      throw error;
    }
    await sql.begin(async tx => {
      const [updated] = await tx`UPDATE commerce_orders SET moota_invoice_id=${invoice.invoiceId},moota_payment_url=${invoice.paymentUrl},moota_payment_amount=${invoice.paymentAmount},moota_expires_at=${invoice.expiresAt},moota_invoice_status='created',moota_invoice_error='',updated_at=now()
        WHERE id=${orderId} AND state='issued' AND (moota_payment_url IS NULL OR moota_payment_url='') AND moota_invoice_status='creating' RETURNING id`;
      if (!updated) throw new Error('Moota membuat tagihan, tetapi pesanan berubah saat proses berlangsung. Periksa dashboard Moota sebelum mencoba lagi.');
      await tx`INSERT INTO commerce_audit(order_id,action,operation_key,payload,actor)
        VALUES (${orderId},'moota.invoice.created',${`moota-invoice:${invoice.invoiceId}`},${JSON.stringify({invoiceId:invoice.invoiceId,paymentUrl:invoice.paymentUrl,paymentAmount:invoice.paymentAmount})},${actor})
        ON CONFLICT (order_id,operation_key) DO NOTHING`;
      await queueInvoiceNotifications(tx, row, invoice, actor);
    });
  }
  const { getOrder } = await import('@/lib/commerce-store');
  const order = await getOrder(orderId);
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
  const explicit = asString(event.event_id ?? event.webhook_id ?? event.mutation_id ?? event.payment_id);
  const status = asString(event.status ?? event.event_type ?? event.type).toLowerCase();
  const amount = asString(event.amount ?? event.paid_amount ?? event.amount_paid ?? event.total_amount ?? event.payment_amount);
  const transaction = asString(event.transaction_id ?? event.transactionId ?? event.id);
  const supplied = explicit || (transaction ? `${transaction}:${status}:${amount}` : '');
  if (!supplied) return `moota:sha256:${createHash('sha256').update(JSON.stringify(event)).digest('hex')}`;
  return supplied.length <= 160 ? `moota:${supplied}` : `moota:sha256:${createHash('sha256').update(supplied).digest('hex')}`;
}
function eventInvoiceId(event: Record<string, unknown>) {
  return asString(event.invoice_id ?? event.invoiceId ?? event.terima_uang_id ?? event.receive_money_id ?? event.payment_id ?? event.paymentId ?? event.payment_link_id ?? event.paymentLinkId ?? event.transaction_id ?? event.transactionId ?? event.payment_reference ?? event.reference_id ?? event.external_id);
}
function eventReference(event: Record<string, unknown>) {
  const metadata = asObject(event.metadata ?? event.meta);
  return asString(event.description ?? event.note ?? event.notes ?? event.order_number ?? event.orderNumber ?? event.external_reference ?? event.reference ?? event.merchant_reference ?? event.transaction_description ?? metadata.order_number ?? metadata.orderNumber ?? metadata.reference).slice(0, 500);
}

export async function processMootaWebhookPayload(payload: unknown) {
  const root = asObject(payload);
  let current: Record<string, unknown> = root;
  let events: unknown[] | null = Array.isArray(payload) ? payload : null;
  for (let depth = 0; !events && depth < 5; depth++) {
    const nested = current.data ?? current.transaction ?? current.payment ?? current.invoice ?? current.event_data;
    if (Array.isArray(nested)) { events = nested; break; }
    if (!nested || typeof nested !== 'object') break;
    const candidate = asObject(nested);
    if (['amount','paid_amount','payment_amount','total_amount','mutation_id','transaction_id','invoice_id','status','type'].some(key => key in candidate)) { current = candidate; break; }
    current = candidate;
  }
  if (!events) events = [current];
  if (!events.length || events.length > 100) throw new Error('Payload Moota kosong atau melebihi 100 transaksi.');
  const results: Array<{ eventId: string; state: string; orderId?: number }> = [];
  for (const raw of events) {
    const event = asObject(raw);
    if (!Object.keys(event).length) continue;
    const eventId = eventIdentity(event);
    const amount = asAmount(event.amount ?? event.paid_amount ?? event.amount_paid ?? event.total_amount ?? event.payment_amount ?? event.amount_to_pay ?? event.amount_received ?? event.settlement_amount);
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
          SELECT o.id,o.number,o.total,o.state,o.customer_name,o.customer_phone,o.customer_email,o.moota_payment_amount,
            COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0) AS balance
          FROM commerce_orders o WHERE o.moota_invoice_id=${invoiceId} AND o.state='issued' FOR UPDATE`;
      }
      if (!candidates.length && reference) {
        const [number] = await tx`SELECT number FROM commerce_orders WHERE ${reference} LIKE '%' || number || '%' AND state='issued' ORDER BY id DESC LIMIT 1`;
        if (number) candidates = await tx`
          SELECT o.id,o.number,o.total,o.state,o.customer_name,o.customer_phone,o.customer_email,o.moota_payment_amount,
            COALESCE((SELECT SUM(l.amount) FROM commerce_ledger l WHERE l.order_id=o.id),0) AS balance
          FROM commerce_orders o WHERE o.number=${number.number} AND o.state='issued' FOR UPDATE`;
      }
      if (!candidates.length) {
        candidates = await tx`
          SELECT o.id,o.number,o.total,o.state,o.customer_name,o.customer_phone,o.customer_email,o.moota_payment_amount,
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
      if (customerPhone) {
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
      const customerEmail = asString(order.customer_email).toLowerCase();
      if (validEmail(customerEmail)) {
        const amountText = `Rp${received.toLocaleString('id-ID')}`;
        const title = paid ? 'Pembayaran berhasil diverifikasi' : 'Pembayaran sebagian berhasil diverifikasi';
        const detail = paid ? 'Pesanan Anda sudah lunas. Terima kasih telah menggunakan KonsepSTIFIn.' : `Masih ada sisa tagihan ${`Rp${Math.max(0, Number(order.total)-received).toLocaleString('id-ID')}`}. Silakan buka akun Anda atau hubungi tim KonsepSTIFIn untuk tindak lanjut.`;
        const content = `<html><body style="font-family:Arial,sans-serif;color:#173c2e;line-height:1.6"><h2>${escapeHtml(title)}</h2><p>Halo ${escapeHtml(customerName)},</p><p>Pembayaran pesanan <strong>${escapeHtml(asString(order.number))}</strong> telah tercatat.</p><p>Jumlah yang diterima: <strong>${escapeHtml(amountText)}</strong></p><p>${escapeHtml(detail)}</p><p>KonsepSTIFIn</p></body></html>`;
        await tx`INSERT INTO email_notification_outbox(event_type,order_id,recipient_email,recipient_name,subject,content,dedupe_key,created_by)
          VALUES ('moota_payment_received',${Number(order.id)},${customerEmail},${customerName},${`${title} | ${asString(order.number)}`},${content},${stableNotificationKey('moota-paid-email',eventId)},'moota:webhook')
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
      SELECT o.id,o.number,o.total,o.state,o.customer_name,o.customer_phone,o.customer_email,
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
    if (phone) {
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
    const customerEmail = asString(order.customer_email).toLowerCase();
    if (validEmail(customerEmail)) {
      const name = asString(order.customer_name) || 'Bapak/Ibu';
      const paid = received >= Number(order.total);
      const title = paid ? 'Pembayaran berhasil diverifikasi' : 'Pembayaran sebagian berhasil diverifikasi';
      const amountText = `Rp${received.toLocaleString('id-ID')}`;
      const detail = paid ? 'Pesanan Anda sudah lunas. Terima kasih telah menggunakan KonsepSTIFIn.' : `Sisa tagihan ${`Rp${Math.max(0,Number(order.total)-received).toLocaleString('id-ID')}`}. Hubungi tim KonsepSTIFIn untuk tindak lanjut.`;
      const content = `<html><body style="font-family:Arial,sans-serif;color:#173c2e;line-height:1.6"><h2>${escapeHtml(title)}</h2><p>Halo ${escapeHtml(name)},</p><p>Pembayaran pesanan <strong>${escapeHtml(asString(order.number))}</strong> tercatat sebesar <strong>${escapeHtml(amountText)}</strong>.</p><p>${escapeHtml(detail)}</p><p>KonsepSTIFIn</p></body></html>`;
      await tx`INSERT INTO email_notification_outbox(event_type,order_id,recipient_email,recipient_name,subject,content,dedupe_key,created_by)
        VALUES ('moota_manual_reconciliation',${orderId},${customerEmail},${name},${`${title} | ${asString(order.number)}`},${content},${stableNotificationKey('moota-manual-email',key)},${actor})
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

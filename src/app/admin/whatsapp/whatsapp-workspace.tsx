'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

type Conversation = { id: string; phone_e164: string; display_name: string; status: string; bot_mode: string; last_message_text: string; last_message_at: string; unread_count: number; assigned_promoter_code: string; lead_id: number | null; lead_name: string | null; lead_city: string | null; lead_service: string | null; lead_status: string | null; consent_to_share?: boolean; whatsapp_marketing_consent?: boolean };
type Message = { id: number; provider_message_id: string; direction: 'incoming' | 'outgoing'; sender_type: string; content: string; media_url: string; media_type: string; delivery_status: string; created_at: string };
type DripContact = { id: number; name: string; phone: string; service: string; status: string; whatsapp_marketing_consent: boolean };
type Step = { delayMinutes: number; message: string };
type Template = { id: number; title: string; category: string; body: string; active: boolean };
type Summary = { total: number; unread: number; waiting: number; open: number; bot_active: number };
const time = (value: string) => value ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
const dateTime = (value: string) => value ? new Date(value).toLocaleString('id-ID') : '—';
const deliveryLabel = (value: string) => ({ queued: 'Menunggu kirim', sent: 'Terkirim', delivered: 'Diterima', read: 'Dibaca', failed: 'Gagal', unknown: 'Perlu diperiksa' } as Record<string,string>)[value] || ''; 
const quickReplies: Array<{ id: string; title: string; body: string; active: boolean }> = [
  { id: 'fallback-1', title: 'Sapaan', body: 'Assalamu’alaikum {{nama}}. Terima kasih telah menghubungi KonsepSTIFIn. Ada yang dapat kami bantu?', active: true },
  { id: 'fallback-2', title: 'Informasi tes', body: 'Tes STIFIn merupakan layanan pemetaan kecenderungan mesin kecerdasan. Pelaksanaannya dibantu promotor. Apakah Anda ingin dibantu mencari promotor di wilayah Anda?', active: true },
  { id: 'fallback-3', title: 'Minta domisili', body: 'Boleh diinformasikan kabupaten/kota dan provinsi domisili Anda agar kami dapat membantu mencari promotor terdekat?', active: true },
  { id: 'fallback-4', title: 'Tindak lanjut', body: 'Kami ingin memastikan apakah masih ada informasi yang perlu dibantu terkait permintaan Anda. Silakan sampaikan pertanyaan atau kebutuhan Anda.', active: true },
];

export default function WhatsappWorkspace({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<'inbox'|'automation'>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, unread: 0, waiting: 0, open: 0, bot_active: 0 });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateEditingId, setTemplateEditingId] = useState<number | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState('umum');
  const [templateBody, setTemplateBody] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [botEnabled, setBotEnabled] = useState(false);
  const [botInstructions, setBotInstructions] = useState('');
  const [openaiConfigured, setOpenaiConfigured] = useState(false);
  const [aiProcessingAcknowledged, setAiProcessingAcknowledged] = useState(false);
  const [starsenderConfigured, setStarsenderConfigured] = useState(false);
  const [starsenderWebhookConfigured, setStarsenderWebhookConfigured] = useState(false);
  const [openaiModel, setOpenaiModel] = useState('');
  const [contacts, setContacts] = useState<DripContact[]>([]);
  const [dripCampaigns, setDripCampaigns] = useState<Record<string, unknown>[]>([]);
  const [dripSelected, setDripSelected] = useState<number[]>([]);
  const [dripSearch, setDripSearch] = useState('');
  const [dripName, setDripName] = useState('');
  const [dripDescription, setDripDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { delayMinutes: 0, message: 'Halo {{nama}}, terima kasih sudah menghubungi KonsepSTIFIn. Kami siap membantu kebutuhan Anda.' },
    { delayMinutes: 1440, message: 'Halo {{nama}}, apakah ada informasi tentang layanan STIFIn yang ingin Anda tanyakan? Tim kami siap membantu.' },
  ]);

  const refreshConversations = useCallback(async () => {
    const response = await fetch(`/api/admin/whatsapp/inbox?q=${encodeURIComponent(search)}&status=${filter}`, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Daftar percakapan gagal dimuat.');
    const rows = Array.isArray(result.conversations) ? result.conversations as Conversation[] : [];
    if (result.summary) setSummary(result.summary as Summary);
    setConversations(rows);
    if (!selectedId && rows.length) setSelectedId(rows[0].id);
    else if (selectedId && !rows.some(row => row.id === selectedId)) setSelectedId(rows[0]?.id || '');
  }, [search, filter, selectedId]);

  const refreshSelected = useCallback(async (id: string) => {
    if (!id) return;
    const response = await fetch(`/api/admin/whatsapp/inbox?conversationId=${encodeURIComponent(id)}`, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Percakapan gagal dimuat.');
    setSelected(result.conversation as Conversation);
    setMessages(Array.isArray(result.messages) ? result.messages as Message[] : []);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => { try { await refreshConversations(); if (active && selectedId) await refreshSelected(selectedId); } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Inbox gagal dimuat.'); } };
    void load();
    const timer = window.setInterval(() => { if (active) void load(); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refreshConversations, refreshSelected, selectedId]);

  useEffect(() => {
    if (!selectedId) { setSelected(null); setMessages([]); return; }
    void refreshSelected(selectedId).catch(e => setError(e instanceof Error ? e.message : 'Percakapan gagal dimuat.'));
  }, [selectedId, refreshSelected]);

  const loadAutomation = useCallback(async () => {
    if (!isAdmin) return;
    const [settingsResponse, dripResponse, contactsResponse] = await Promise.all([
      fetch('/api/admin/whatsapp/settings', { cache: 'no-store' }),
      fetch('/api/admin/whatsapp/drip', { cache: 'no-store' }),
      fetch('/api/admin/marketing', { cache: 'no-store' }),
    ]);
    const settings = await settingsResponse.json();
    const drip = await dripResponse.json();
    const marketing = await contactsResponse.json();
    const templateResponse = await fetch('/api/admin/whatsapp/templates', { cache: 'no-store' });
    const templateResult = await templateResponse.json();
    if (!settingsResponse.ok) throw new Error(settings.message || 'Pengaturan chatbot gagal dimuat.');
    if (!dripResponse.ok) throw new Error(drip.message || 'Campaign gagal dimuat.');
    if (!contactsResponse.ok) throw new Error(marketing.message || 'Kontak marketing gagal dimuat.');
    if (!templateResponse.ok) throw new Error(templateResult.message || 'Template WhatsApp gagal dimuat.');
    setTemplates(Array.isArray(templateResult.templates) ? templateResult.templates as Template[] : []);
    setBotEnabled(settings.bot?.enabled === true);
    setBotInstructions(String(settings.bot?.system_instructions || ''));
    setOpenaiConfigured(settings.openai?.configured === true);
    setAiProcessingAcknowledged(settings.bot?.ai_processing_acknowledged === true);
    setStarsenderConfigured(settings.starsender?.configured === true);
    setStarsenderWebhookConfigured(settings.starsender?.webhookConfigured === true);
    setOpenaiModel(String(settings.openai?.model || ''));
    setDripCampaigns(Array.isArray(drip.campaigns) ? drip.campaigns : []);
    setContacts(Array.isArray(marketing.contacts) ? marketing.contacts as DripContact[] : []);
  }, [isAdmin]);

  useEffect(() => { if (isAdmin && tab === 'automation') void loadAutomation().catch(e => setError(e instanceof Error ? e.message : 'Otomasi gagal dimuat.')); }, [isAdmin, tab, loadAutomation]);
  useEffect(() => { let active = true; void fetch('/api/admin/whatsapp/templates', { cache: 'no-store' }).then(r=>r.json()).then(result=>{if(active&&Array.isArray(result.templates))setTemplates(result.templates as Template[]);}).catch(()=>{}); return ()=>{active=false;}; }, []);

  const replyOptions = useMemo(() => templates.length ? templates.filter(template => template.active) : quickReplies, [templates]);

  const filteredContacts = useMemo(() => {
    const q = dripSearch.trim().toLowerCase();
    return contacts.filter(contact => contact.whatsapp_marketing_consent && (!q || `${contact.name} ${contact.phone} ${contact.service}`.toLowerCase().includes(q)));
  }, [contacts, dripSearch]);

  async function post(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Permintaan gagal.');
    return result;
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setBusy('send'); setError(''); setNotice('');
    try {
      const result = await post('/api/admin/whatsapp/inbox', { action: 'send', conversationId: selectedId, message: draft });
      setDraft(''); setNotice(result.message || 'Balasan masuk antrean.');
      await refreshConversations();
    } catch (e) { setError(e instanceof Error ? e.message : 'Pesan gagal dikirim.'); }
    finally { setBusy(''); }
  }

  async function setMode(mode: 'bot'|'human'|'closed') {
    if (!selectedId) return;
    setBusy('mode'); setError(''); setNotice('');
    try { await post('/api/admin/whatsapp/inbox', { action: 'mode', conversationId: selectedId, mode }); await refreshSelected(selectedId); await refreshConversations(); setNotice(mode === 'bot' ? 'Chatbot mengambil alih percakapan.' : mode === 'human' ? 'Percakapan dialihkan ke petugas.' : 'Percakapan ditandai selesai.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Status percakapan gagal diubah.'); }
    finally { setBusy(''); }
  }

  async function saveBot(event: FormEvent) {
    event.preventDefault(); setBusy('bot'); setError(''); setNotice('');
    try { const result = await post('/api/admin/whatsapp/settings', { action: 'bot', enabled: botEnabled, systemInstructions: botInstructions, aiProcessingAcknowledged }); setNotice(result.message); }
    catch (e) { setError(e instanceof Error ? e.message : 'Pengaturan chatbot gagal disimpan.'); }
    finally { setBusy(''); }
  }

  async function saveTemplate(event: FormEvent) {
    event.preventDefault(); setBusy('template'); setError(''); setNotice('');
    try { const result = await post('/api/admin/whatsapp/templates', { id: templateEditingId || undefined, title: templateTitle, category: templateCategory, body: templateBody, active: true }); setNotice(result.message || 'Template tersimpan.'); setTemplateEditingId(null); setTemplateTitle(''); setTemplateCategory('umum'); setTemplateBody(''); const response = await fetch('/api/admin/whatsapp/templates',{cache:'no-store'}); const data = await response.json(); if(response.ok)setTemplates(data.templates as Template[]); }
    catch (e) { setError(e instanceof Error ? e.message : 'Template gagal disimpan.'); }
    finally { setBusy(''); }
  }
  async function toggleTemplate(template: Template) {
    setBusy(`template-${template.id}`); setError(''); setNotice('');
    try { await post('/api/admin/whatsapp/templates', { action: 'toggle', id: template.id, active: !template.active }); const response = await fetch('/api/admin/whatsapp/templates',{cache:'no-store'}); const data = await response.json(); if(response.ok)setTemplates(data.templates as Template[]); setNotice('Status template diperbarui.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Status template gagal diubah.'); }
    finally { setBusy(''); }
  }

  async function toggleDripCampaign(campaignId: string, active: boolean) {
    setBusy(`campaign-${campaignId}`); setError(''); setNotice('');
    try { const result = await post('/api/admin/whatsapp/drip', { action: 'toggle', campaignId, active }); setNotice(result.message); await loadAutomation(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Status campaign gagal diubah.'); }
    finally { setBusy(''); }
  }

  async function createDrip(event: FormEvent) {
    event.preventDefault(); setBusy('drip'); setError(''); setNotice('');
    try {
      const result = await post('/api/admin/whatsapp/drip', { name: dripName, description: dripDescription, leadIds: dripSelected, steps });
      setNotice(result.message); setDripName(''); setDripDescription(''); setDripSelected([]); await loadAutomation();
    } catch (e) { setError(e instanceof Error ? e.message : 'Campaign gagal dibuat.'); }
    finally { setBusy(''); }
  }

  function toggleDripContact(id: number, checked: boolean) { setDripSelected(current => checked ? [...new Set([...current,id])] : current.filter(value => value !== id)); }

  return <>
    {error && <p className="portal-error" role="alert">{error}</p>}
    {notice && <p className="portal-success" role="status">{notice}</p>}
    {isAdmin && <div className="wa-tabs" role="tablist" aria-label="Modul WhatsApp"><button type="button" role="tab" aria-selected={tab==='inbox'} className={tab==='inbox'?'active':''} onClick={()=>setTab('inbox')}>Inbox</button><button type="button" role="tab" aria-selected={tab==='automation'} className={tab==='automation'?'active':''} onClick={()=>setTab('automation')}>Chatbot &amp; Automasi</button><Link href="/admin/marketing">Broadcast &amp; persetujuan ↗</Link></div>}

    {tab === 'inbox' && <><div className="wa-summary-grid"><div><small>Total percakapan</small><strong>{summary.total}</strong></div><div><small>Belum dibaca</small><strong>{summary.unread}</strong></div><div><small>Menunggu petugas</small><strong>{summary.waiting}</strong></div><div><small>Bot menangani</small><strong>{summary.bot_active}</strong></div></div><section className="wa-inbox-shell">
      <aside className="wa-conversation-list">
        <div className="wa-list-heading"><div><span className="portal-eyebrow">PESAN MASUK</span><h2>Percakapan</h2></div><span className="wa-count">{conversations.length}</span></div>
        <input className="wa-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, nomor, wilayah…" aria-label="Cari percakapan" />
        <div className="wa-filter-row">{[['all','Semua'],['open','Aktif'],['waiting','Menunggu'],['closed','Selesai']].map(([value,label])=><button type="button" key={value} className={filter===value?'selected':''} onClick={()=>setFilter(value)}>{label}</button>)}</div>
        <div className="wa-conversation-scroll">
          {conversations.map(item=><button type="button" key={item.id} className={`wa-conversation-item ${selectedId===item.id?'selected':''}`} onClick={()=>setSelectedId(item.id)}>
            <span className="wa-avatar">{(item.lead_name || item.display_name || item.phone_e164).slice(0,1).toUpperCase()}</span>
            <span className="wa-contact-copy"><strong>{item.lead_name || item.display_name || item.phone_e164}</strong><small>{item.last_message_text || 'Belum ada pesan'}</small><small>{item.lead_city || item.phone_e164}</small></span>
            <span className="wa-contact-meta"><small>{time(item.last_message_at)}</small>{item.unread_count>0&&<b>{item.unread_count}</b>}</span>
          </button>)}
          {!conversations.length && <div className="wa-empty"><span>Belum ada percakapan</span><small>Pesan masuk dari pelanggan akan tampil di sini setelah webhook StarSender Premium diterima.</small></div>}
        </div>
      </aside>

      <section className="wa-chat-panel">
        {selected ? <>
          <header className="wa-chat-header"><div className="wa-chat-person"><span className="wa-avatar large">{(selected.lead_name || selected.display_name || selected.phone_e164).slice(0,1).toUpperCase()}</span><div><strong>{selected.lead_name || selected.display_name || selected.phone_e164}</strong><small>{selected.phone_e164} · {selected.lead_city || 'Wilayah belum tercatat'}</small></div></div><div className="wa-chat-actions"><span className={`wa-mode ${selected.bot_mode==='bot'?'bot':'human'}`}>{selected.bot_mode==='bot'?'Bot aktif':'Petugas'}</span><button type="button" disabled={busy==='mode'} onClick={()=>void setMode(selected.bot_mode==='bot'?'human':'bot')}>{selected.bot_mode==='bot'?'Ambil alih':'Aktifkan bot'}</button><button type="button" disabled={busy==='mode'} onClick={()=>void setMode('closed')}>Selesaikan</button></div></header>
          <div className="wa-chat-context"><span>{selected.lead_service || 'Layanan belum dipilih'}</span><span>Referensi: {selected.lead_id ? `KSF-${selected.lead_id}` : 'Belum terhubung'}</span><span>Status: {selected.lead_status || selected.status}</span></div>
          <div className="wa-message-list">
            {messages.map(message=><div key={message.id} className={`wa-message-row ${message.direction==='outgoing'?'outgoing':''}`}><div className="wa-message-bubble"><span>{message.content}</span>{message.media_url&&<a href={message.media_url} target="_blank" rel="noreferrer">Lihat lampiran</a>}<small>{message.sender_type==='bot'?'Bot AI':message.sender_type==='agent'?'Petugas':message.direction==='incoming'?'Pelanggan':'Sistem'} · {time(message.created_at)}{message.direction==='outgoing'&&deliveryLabel(message.delivery_status)?` · ${deliveryLabel(message.delivery_status)}`:''}</small></div></div>)}
            {!messages.length&&<div className="wa-empty"><span>Belum ada riwayat pesan</span><small>Pesan masuk dan keluar akan disimpan di percakapan ini.</small></div>}
          </div>
          <form className="wa-composer" onSubmit={sendMessage}><div className="wa-composer-tools"><select aria-label="Pilih balasan cepat" defaultValue="" onChange={e=>{const item=replyOptions.find(reply=>String(reply.id)===e.target.value);if(item){const name=selected?.lead_name||selected?.display_name||'Bapak/Ibu';setDraft(item.body.replace(/\{\{\s*nama\s*\}\}/gi,name).replace(/\{\{\s*kota\s*\}\}/gi,selected?.lead_city||'wilayah Anda').replace(/\{\{\s*referensi\s*\}\}/gi,selected?.lead_id?`KSF-${selected.lead_id}`:'belum tersedia'));}e.currentTarget.value='';}}><option value="">Balasan cepat…</option>{replyOptions.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select><small>Balasan manual akan mengambil alih chatbot.</small></div><textarea value={draft} onChange={e=>setDraft(e.target.value)} maxLength={4000} rows={2} placeholder="Tulis balasan kepada pelanggan…" aria-label="Tulis pesan" /><div><small>Balasan hanya dapat dikirim dalam jendela 24 jam sejak pesan pelanggan terakhir.</small><button className="portal-primary" type="submit" disabled={busy==='send'||!draft.trim()}>{busy==='send'?'Memasukkan…':'Kirim pesan'}</button></div></form>
        </> : <div className="wa-empty wa-empty-main"><span>Pilih percakapan</span><small>Pilih pelanggan di sisi kiri untuk membaca riwayat dan membalas pesan.</small></div>}
      </section>

      <aside className="wa-profile-panel">
        {selected ? <><span className="portal-eyebrow">PROFIL PELANGGAN</span><h3>{selected.lead_name || selected.display_name || 'Kontak WhatsApp'}</h3><dl><dt>Nomor WhatsApp</dt><dd>{selected.phone_e164}</dd><dt>Domisili</dt><dd>{selected.lead_city || 'Belum tercatat'}</dd><dt>Layanan</dt><dd>{selected.lead_service || 'Belum dipilih'}</dd><dt>Status lead</dt><dd>{selected.lead_status || 'Belum terhubung'}</dd><dt>Penanggung jawab</dt><dd>{selected.assigned_promoter_code || 'Belum ditugaskan'}</dd><dt>Izin promosi WhatsApp</dt><dd>{selected.whatsapp_marketing_consent===true?'Disetujui':'Belum disetujui'}</dd><dt>Referensi</dt><dd>{selected.lead_id ? `KSF-${selected.lead_id}` : 'Belum ada'}</dd><dt>Pesan terakhir</dt><dd>{dateTime(selected.last_message_at)}</dd></dl><div className="wa-profile-actions">{isAdmin&&selected.lead_id&&<Link href="/admin/leads">Buka data lead ↗</Link>}<a href={`https://wa.me/${selected.phone_e164}`} target="_blank" rel="noreferrer">Buka WhatsApp Web ↗</a></div></> : <div className="wa-empty"><span>Informasi pelanggan</span><small>Profil dan data lead akan tampil setelah percakapan dipilih.</small></div>}
      </aside>
    </section></>}

    {isAdmin && tab === 'automation' && <div className="wa-automation-grid">
      <section className="portal-card wa-bot-card"><div className="wa-section-heading"><div><span className="portal-eyebrow">AI CUSTOMER SERVICE</span><h2>Chatbot internal</h2></div><span className={`wa-mode ${botEnabled?'bot':'human'}`}>{botEnabled?'Aktif':'Nonaktif'}</span></div>
        <p>Chatbot berjalan di server KonsepSTIFIn. StarSender hanya mengirim dan menerima pesan. Jika AI API belum dikonfigurasi, worker menggunakan jawaban dasar yang aman.</p>
        <div className="wa-integration-checks"><span><i className={starsenderConfigured?'ready':'missing'}/>StarSender Device API: {starsenderConfigured?'terkonfigurasi':'belum dikonfigurasi'}</span><span><i className={starsenderWebhookConfigured?'ready':'missing'}/>Webhook Premium: {starsenderWebhookConfigured?'terkonfigurasi':'belum dikonfigurasi'}</span><span><i className={openaiConfigured?'ready':'missing'}/>OpenAI API: {openaiConfigured?`tersedia (${openaiModel})`:'belum dikonfigurasi'}</span></div>
        {!openaiConfigured&&<p className="wa-warning">Masukkan OpenAI API key melalui Admin → Pengaturan → Integrasi eksternal. Kunci disimpan terenkripsi dan tidak ditampilkan kembali.</p>}
        {openaiConfigured&&<p className="wa-warning">Saat chatbot AI aktif, isi percakapan terbaru dan konteks layanan yang relevan dikirim ke OpenAI API untuk menyusun jawaban. Jangan meminta atau mengirim OTP, kata sandi, PIN, foto sidik jari, maupun data rekening penuh.</p>}
        <form className="portal-form" onSubmit={saveBot}>{openaiConfigured&&<label className="wa-toggle-label"><input type="checkbox" checked={aiProcessingAcknowledged} onChange={e=>setAiProcessingAcknowledged(e.target.checked)}/> Saya menyetujui pemrosesan percakapan oleh OpenAI API untuk chatbot KonsepSTIFIn.</label>}<label className="wa-toggle-label"><input type="checkbox" checked={botEnabled} disabled={!starsenderConfigured||!starsenderWebhookConfigured||(openaiConfigured&&!aiProcessingAcknowledged)} onChange={e=>setBotEnabled(e.target.checked)}/> Aktifkan chatbot untuk pesan masuk baru</label><label>Instruksi tambahan chatbot<textarea rows={5} maxLength={6000} value={botInstructions} onChange={e=>setBotInstructions(e.target.value)} placeholder="Contoh: selalu tanyakan domisili sebelum mencari promotor."/></label><button className="portal-primary" disabled={busy==='bot'}>{busy==='bot'?'Menyimpan…':'Simpan pengaturan chatbot'}</button></form>
        <small className="wa-muted">Chatbot berhenti ketika petugas mengambil alih percakapan. Pesan pelanggan yang masuk setelah itu tidak memicu balasan AI sampai bot diaktifkan kembali.</small>
      </section>
      <section className="portal-card wa-drip-card"><div className="wa-section-heading"><div><span className="portal-eyebrow">CUSTOMER NURTURE</span><h2>Buat drip campaign</h2></div><span className="wa-mode human">Persetujuan wajib</span></div>
        <p>Campaign hanya dapat diikuti kontak yang sudah memiliki persetujuan promosi WhatsApp. Pengiriman tetap melewati pemeriksaan opt-out dan jendela 24 jam.</p>
        <form className="portal-form" onSubmit={createDrip}><label>Nama campaign<input required maxLength={120} value={dripName} onChange={e=>setDripName(e.target.value)} placeholder="Contoh: Edukasi calon peserta tes"/></label><label>Deskripsi internal<input maxLength={500} value={dripDescription} onChange={e=>setDripDescription(e.target.value)} placeholder="Tujuan campaign"/></label>
          <div className="wa-contact-picker"><div className="wa-section-heading"><strong>Pilih penerima</strong><span>{dripSelected.length} dipilih</span></div><input className="wa-search" value={dripSearch} onChange={e=>setDripSearch(e.target.value)} placeholder="Cari kontak yang setuju promosi…"/>{filteredContacts.slice(0,100).map(contact=><label className="wa-pick-contact" key={contact.id}><input type="checkbox" checked={dripSelected.includes(contact.id)} onChange={e=>toggleDripContact(contact.id,e.target.checked)}/><span><strong>{contact.name}</strong><small>{contact.phone} · {contact.service || 'Layanan belum dipilih'}</small></span></label>)}{!filteredContacts.length&&<small className="wa-muted">Belum ada kontak dengan persetujuan promosi aktif.</small>}</div>
          <div className="wa-steps-heading"><strong>Urutan pesan</strong><button type="button" onClick={()=>setSteps(current=>current.length<10?[...current,{delayMinutes:1440,message:''}]:current)}>Tambah tahap</button></div>
          {steps.map((step,index)=><div className="wa-step-editor" key={index}><div className="wa-section-heading"><strong>Tahap {index+1}</strong>{steps.length>1&&<button type="button" onClick={()=>setSteps(current=>current.filter((_,i)=>i!==index))}>Hapus</button>}</div><label>Jeda sebelum tahap (menit)<input type="number" min={0} max={525600} value={step.delayMinutes} onChange={e=>setSteps(current=>current.map((item,i)=>i===index?{...item,delayMinutes:Number(e.target.value)}:item))}/></label><label>Isi pesan<textarea required maxLength={2000} rows={3} value={step.message} onChange={e=>setSteps(current=>current.map((item,i)=>i===index?{...item,message:e.target.value}:item))} placeholder="Gunakan {{nama}} untuk nama pelanggan."/></label></div>)}
          <button className="portal-primary" type="submit" disabled={busy==='drip'||dripSelected.length===0}>{busy==='drip'?'Membuat campaign…':'Buat dan daftarkan penerima'}</button>
        </form>
      </section>
      <section className="portal-card wa-template-manager"><div className="wa-section-heading"><div><span className="portal-eyebrow">QUICK REPLIES</span><h2>Template pesan</h2></div><span className="wa-mode bot">{templates.filter(t=>t.active).length} aktif</span></div><p>Template tersedia pada Inbox untuk admin dan promotor. Gunakan variabel {'{{nama}}'}, {'{{kota}}'}, dan {'{{referensi}}'} untuk personalisasi.</p><form className="portal-form" onSubmit={saveTemplate}><label>Judul template<input required maxLength={100} value={templateTitle} onChange={e=>setTemplateTitle(e.target.value)} placeholder="Contoh: Konfirmasi jadwal"/></label><label>Kategori<select value={templateCategory} onChange={e=>setTemplateCategory(e.target.value)}><option value="umum">Umum</option><option value="tes">Tes STIFIn</option><option value="promotor">Promotor</option><option value="pembayaran">Pembayaran</option><option value="follow_up">Follow-up</option></select></label><label>Isi pesan<textarea required rows={3} maxLength={4000} value={templateBody} onChange={e=>setTemplateBody(e.target.value)} placeholder="Tulis pesan template…"/></label><div className="wa-template-actions"><button className="portal-primary" disabled={busy==='template'}>{templateEditingId?'Simpan perubahan':'Tambah template'}</button>{templateEditingId&&<button type="button" onClick={()=>{setTemplateEditingId(null);setTemplateTitle('');setTemplateCategory('umum');setTemplateBody('');}}>Batal</button>}</div></form><div className="wa-template-list">{templates.map(template=><div key={template.id}><span><strong>{template.title}</strong><small>{template.category} · {template.active?'Aktif':'Nonaktif'}</small></span><span><button type="button" onClick={()=>{setTemplateEditingId(template.id);setTemplateTitle(template.title);setTemplateCategory(template.category);setTemplateBody(template.body);}}>Edit</button><button type="button" disabled={busy===`template-${template.id}`} onClick={()=>void toggleTemplate(template)}>{template.active?'Nonaktifkan':'Aktifkan'}</button></span></div>)}{!templates.length&&<small className="wa-muted">Belum ada template.</small>}</div></section>
      <section className="portal-card wa-campaign-history"><div className="wa-section-heading"><h2>Riwayat drip campaign</h2><button type="button" onClick={()=>void loadAutomation().catch(e=>setError(e instanceof Error?e.message:'Gagal memuat campaign.'))}>Perbarui</button></div><div className="wa-campaign-table"><table><thead><tr><th>Campaign</th><th>Tahap</th><th>Peserta</th><th>Aktif</th><th>Jeda</th><th>Selesai</th><th>Status</th></tr></thead><tbody>{dripCampaigns.map(row=><tr key={String(row.id)}><td><strong>{String(row.name||'')}</strong><small>{dateTime(String(row.created_at||''))}</small></td><td>{Number(row.step_count||0)}</td><td>{Number(row.enrolled_count||0)}</td><td>{Number(row.active_count||0)}</td><td>{Number(row.paused_count||0)}</td><td>{Number(row.completed_count||0)}</td><td><button type="button" disabled={busy===`campaign-${String(row.id)}`} onClick={()=>void toggleDripCampaign(String(row.id),row.active!==true)}>{row.active===true?'Jeda':'Aktifkan'}</button></td></tr>)}{!dripCampaigns.length&&<tr><td colSpan={7}>Belum ada drip campaign.</td></tr>}</tbody></table></div></section>
    </div>}
  </>;
}

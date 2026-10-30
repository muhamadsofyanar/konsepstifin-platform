'use client';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

type WaGroup = { group_jid: string; group_name: string; device_name: string; allow_broadcast: boolean; last_synced_at: string | null };
type GroupPreset = { id: string; name: string; description: string; message: string; active: boolean; group_count: number; group_jids: string[] };
type Broadcast = { id: string; name: string; message: string; scheduled_at: string; status: string; created_at: string; started_at: string | null; completed_at: string | null; group_count: number; pending_count: number; processing_count: number; sent_count: number; failed_count: number; unknown_count: number };
type GroupMessage = { id: number; provider_message_id: string; group_jid: string; group_name: string; direction: string; sender_jid: string; sender_name: string; sender_is_admin: boolean | null; content: string; media_url: string; device_name: string; provider_timestamp: string | null; created_at: string };
type Dashboard = { groups: WaGroup[]; presets: GroupPreset[]; broadcasts: Broadcast[]; groupMessages: GroupMessage[] };

const jakartaInput = (value: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(value).replace(' ', 'T');
const jakartaDateTime = (value: string | null | undefined) => value ? `${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value))} WIB` : '—';
const statusLabel = (status: string) => ({ scheduled: 'Terjadwal', processing: 'Sedang dikirim', paused: 'Dijeda', completed: 'Selesai', cancelled: 'Dibatalkan', failed: 'Gagal' } as Record<string, string>)[status] || status;

export default function GroupBroadcastPanel({ groupWebhookUrl }: { groupWebhookUrl: string }) {
  const [dashboard, setDashboard] = useState<Dashboard>({ groups: [], presets: [], broadcasts: [], groupMessages: [] });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [presetId, setPresetId] = useState('');
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetMessage, setPresetMessage] = useState('');
  const [presetGroups, setPresetGroups] = useState<string[]>([]);
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastPresetId, setBroadcastPresetId] = useState('');
  const [broadcastGroups, setBroadcastGroups] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendMode, setSendMode] = useState<'now' | 'scheduled'>('scheduled');
  const [scheduleLocal, setScheduleLocal] = useState(() => jakartaInput(new Date(Date.now() + 10 * 60 * 1000)));
  const [confirmPermission, setConfirmPermission] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/admin/whatsapp/groups', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Data grup WhatsApp gagal dimuat.');
    setDashboard({
      groups: Array.isArray(result.groups) ? result.groups as WaGroup[] : [],
      presets: Array.isArray(result.presets) ? result.presets as GroupPreset[] : [],
      broadcasts: Array.isArray(result.broadcasts) ? result.broadcasts as Broadcast[] : [],
      groupMessages: Array.isArray(result.groupMessages) ? result.groupMessages as GroupMessage[] : [],
    });
  }, []);

  useEffect(() => { void refresh().catch(e => setError(e instanceof Error ? e.message : 'Data WhatsApp gagal dimuat.')); }, [refresh]);

  const allowedGroups = useMemo(() => dashboard.groups.filter(group => group.allow_broadcast), [dashboard.groups]);
  const visibleGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    return dashboard.groups.filter(group => !q || `${group.group_name} ${group.group_jid} ${group.device_name}`.toLowerCase().includes(q));
  }, [dashboard.groups, groupSearch]);
  const selectedPreset = dashboard.presets.find(preset => preset.id === broadcastPresetId && preset.active);
  const blockedPresetGroups = selectedPreset ? selectedPreset.group_jids.filter(jid => !allowedGroups.some(group => group.group_jid === jid)) : [];
  const effectiveBroadcastGroups = selectedPreset ? selectedPreset.group_jids : broadcastGroups;
  const scheduledPreview = sendMode === 'now' ? 'Dikirim secepatnya setelah antrean worker mengambil tugas.' : scheduleLocal ? jakartaDateTime(new Date(`${scheduleLocal}:00+07:00`).toISOString()) : 'Pilih tanggal dan waktu.';

  async function post(body: Record<string, unknown>) {
    const response = await fetch('/api/admin/whatsapp/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Permintaan gagal.');
    return result;
  }

  async function runAction(key: string, body: Record<string, unknown>, successMessage?: string) {
    setBusy(key); setError(''); setNotice('');
    try { const result = await post(body); setNotice(result.message || successMessage || 'Perubahan tersimpan.'); await refresh(); return result; }
    catch (e) { setError(e instanceof Error ? e.message : 'Permintaan gagal.'); return null; }
    finally { setBusy(''); }
  }

  function toggleSelection(current: string[], value: string, checked: boolean) {
    return checked ? [...new Set([...current, value])] : current.filter(item => item !== value);
  }

  async function syncGroups() { await runAction('sync', { action: 'sync' }); }

  async function savePreset(event: FormEvent) {
    event.preventDefault();
    const result = await runAction('preset', { action: 'savePreset', id: presetId || undefined, name: presetName, description: presetDescription, message: presetMessage, groupJids: presetGroups, active: true });
    if (result) { setPresetId(''); setPresetName(''); setPresetDescription(''); setPresetMessage(''); setPresetGroups([]); }
  }

  function editPreset(preset: GroupPreset, duplicate = false) {
    setPresetId(duplicate ? '' : preset.id);
    setPresetName(duplicate ? `${preset.name} (Salinan)` : preset.name);
    setPresetDescription(preset.description);
    setPresetMessage(preset.message);
    setPresetGroups(preset.group_jids || []);
    setError(''); setNotice(duplicate ? 'Preset disalin ke formulir. Simpan untuk membuat preset baru.' : 'Mode edit preset aktif.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function createBroadcast(event: FormEvent) {
    event.preventDefault();
    if (!effectiveBroadcastGroups.length) { setError('Pilih preset atau minimal satu grup yang diizinkan.'); return; }
    const scheduledAt = sendMode === 'now' ? new Date().toISOString() : new Date(`${scheduleLocal}:00+07:00`).toISOString();
    const result = await runAction('broadcast', { action: 'createBroadcast', name: broadcastName, presetId: broadcastPresetId || undefined, groupJids: broadcastGroups, message: broadcastMessage, scheduledAt, confirmGroupPermission: confirmPermission });
    if (result) { setBroadcastName(''); setBroadcastPresetId(''); setBroadcastGroups([]); setBroadcastMessage(''); setConfirmPermission(false); setSendMode('scheduled'); setScheduleLocal(jakartaInput(new Date(Date.now() + 10 * 60 * 1000))); }
  }

  async function broadcastAction(id: string, statusAction: 'pause' | 'resume' | 'cancel') {
    await runAction(`broadcast-${id}`, { action: 'broadcastStatus', id, statusAction });
  }

  return <div className="wa-groups-workspace">
    {error && <p className="portal-error" role="alert">{error}</p>}
    {notice && <p className="portal-success" role="status">{notice}</p>}

    <section className="portal-card wa-group-intro">
      <div className="wa-section-heading"><div><span className="portal-eyebrow">STARSENDER DEVICE API</span><h2>Grup WhatsApp &amp; Broadcast</h2></div><button type="button" className="portal-primary" disabled={busy === 'sync'} onClick={() => void syncGroups()}>{busy === 'sync' ? 'Menyinkronkan…' : 'Sinkronkan grup dari StarSender'}</button></div>
      <p>Ambil daftar grup langsung dari perangkat StarSender. Grup baru otomatis masuk daftar, tetapi tidak langsung boleh menerima broadcast. Admin harus mengaktifkan izin tiap grup terlebih dahulu.</p>
      <div className="wa-group-status-row"><span><i className="ready"/>Device API dipakai untuk membaca daftar grup dan mengirim pesan</span><span>{dashboard.groups.length} grup tersimpan</span><span>{allowedGroups.length} grup diizinkan broadcast</span></div>
      <div className="wa-group-webhook-note"><strong>Pesan masuk dari grup</strong><p>Untuk membaca percakapan grup secara realtime, akun StarSender memerlukan add-on <b>Webhook Group</b>. Webhook Premium personal yang sudah aktif tidak otomatis mencakup pesan grup.</p>{groupWebhookUrl ? <><code>{groupWebhookUrl.replace(/([?&]token=)[^&]+/i, '$1••••••••••••')}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(groupWebhookUrl)}>Salin URL Webhook Group</button><small>Pasang URL ini pada pengaturan Webhook Group di StarSender setelah add-on diaktifkan.</small></> : <small>URL webhook grup tersedia untuk super admin setelah secret webhook dan PLATFORM_ORIGIN terkonfigurasi.</small>}</div>
      <small className="wa-muted">StarSender mendokumentasikan daftar grup melalui GET /api/whatsapp/groups dan pengiriman melalui POST /api/send/grup. Data anggota dan status admin grup tidak dijamin tersedia dari endpoint daftar grup.</small>
    </section>

    <section className="portal-card wa-group-list-card">
      <div className="wa-section-heading"><div><span className="portal-eyebrow">GROUP ALLOWLIST</span><h2>Daftar grup yang terhubung</h2></div><span className="wa-mode bot">{allowedGroups.length} diizinkan</span></div>
      <input className="wa-search" value={groupSearch} onChange={e => setGroupSearch(e.target.value)} placeholder="Cari nama grup atau ID grup…" aria-label="Cari grup WhatsApp" />
      <div className="wa-group-table-wrap"><table className="wa-group-table"><thead><tr><th>Nama grup</th><th>ID grup</th><th>Perangkat</th><th>Izin broadcast</th></tr></thead><tbody>
        {visibleGroups.map(group => <tr key={group.group_jid}><td><strong>{group.group_name || 'Grup tanpa nama'}</strong><small>Sinkron {jakartaDateTime(group.last_synced_at)}</small></td><td><code>{group.group_jid}</code></td><td>{group.device_name || 'Device utama'}</td><td><label className="wa-allow-toggle"><input type="checkbox" checked={group.allow_broadcast} disabled={busy === `allow-${group.group_jid}`} onChange={e => void runAction(`allow-${group.group_jid}`, { action: 'allow', groupJid: group.group_jid, allowed: e.target.checked })}/><span>{group.allow_broadcast ? 'Diizinkan' : 'Diblokir'}</span></label></td></tr>)}
        {!visibleGroups.length && <tr><td colSpan={4}>{dashboard.groups.length ? 'Tidak ada grup yang cocok dengan pencarian.' : 'Belum ada daftar grup. Klik Sinkronkan grup dari StarSender.'}</td></tr>}
      </tbody></table></div>
    </section>

    <div className="wa-group-two-col">
      <section className="portal-card wa-group-preset-card">
        <div className="wa-section-heading"><div><span className="portal-eyebrow">SAVED AUDIENCE</span><h2>{presetId ? 'Edit preset grup' : 'Buat preset grup'}</h2></div><span className="wa-mode human">Bisa diedit</span></div>
        <p>Simpan kombinasi grup untuk dipakai berulang. Contoh: Promotor Bandung, Cabang Jawa Barat, Komunitas Orang Tua, atau Mitra Nasional.</p>
        <form className="portal-form" onSubmit={savePreset}>
          <label>Nama preset<input required maxLength={120} value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Contoh: Promotor Jawa Barat"/></label>
          <label>Catatan internal<input maxLength={500} value={presetDescription} onChange={e => setPresetDescription(e.target.value)} placeholder="Tujuan dan segmentasi grup"/></label>
          <label>Pesan default<textarea rows={4} maxLength={4000} required value={presetMessage} onChange={e => setPresetMessage(e.target.value)} placeholder="Tulis pesan yang biasa dikirim ke grup…"/></label>
          <div className="wa-group-picker"><div className="wa-section-heading"><strong>Pilih grup preset</strong><span>{presetGroups.length} dipilih</span></div>{allowedGroups.map(group => <label className="wa-pick-contact" key={group.group_jid}><input type="checkbox" checked={presetGroups.includes(group.group_jid)} onChange={e => setPresetGroups(current => toggleSelection(current, group.group_jid, e.target.checked))}/><span><strong>{group.group_name}</strong><small>{group.group_jid}</small></span></label>)}{!allowedGroups.length && <small className="wa-muted">Belum ada grup yang diizinkan broadcast. Aktifkan izin pada daftar grup terlebih dahulu.</small>}</div>
          <div className="wa-template-actions"><button className="portal-primary" disabled={busy === 'preset'}>{busy === 'preset' ? 'Menyimpan…' : presetId ? 'Simpan perubahan preset' : 'Simpan preset grup'}</button>{presetId && <button type="button" onClick={() => { setPresetId(''); setPresetName(''); setPresetDescription(''); setPresetMessage(''); setPresetGroups([]); }}>Batal edit</button>}</div>
        </form>
        <div className="wa-template-list">{dashboard.presets.map(preset => <div key={preset.id}><span><strong>{preset.name}</strong><small>{preset.group_count} grup · {preset.active ? 'Aktif' : 'Nonaktif'}</small></span><span><button type="button" onClick={() => editPreset(preset)}>Edit</button><button type="button" onClick={() => editPreset(preset, true)}>Duplikat</button><button type="button" disabled={busy === `preset-${preset.id}`} onClick={() => void runAction(`preset-${preset.id}`, { action: 'togglePreset', id: preset.id, active: !preset.active })}>{preset.active ? 'Nonaktifkan' : 'Aktifkan'}</button></span></div>)}{!dashboard.presets.length && <small className="wa-muted">Belum ada preset grup.</small>}</div>
      </section>

      <section className="portal-card wa-group-broadcast-card">
        <div className="wa-section-heading"><div><span className="portal-eyebrow">SCHEDULED BROADCAST</span><h2>Buat broadcast grup</h2></div><span className="wa-mode bot">Jadwal terlihat</span></div>
        <p>Pilih preset atau tentukan grup secara manual. Pesan masuk antrean internal dan dikirim satu per satu melalui endpoint grup StarSender.</p>
        <form className="portal-form" onSubmit={createBroadcast}>
          <label>Nama broadcast<input required maxLength={120} value={broadcastName} onChange={e => setBroadcastName(e.target.value)} placeholder="Contoh: Informasi jadwal tes November"/></label>
          <label>Gunakan preset grup<select value={broadcastPresetId} onChange={e => { const id = e.target.value; setBroadcastPresetId(id); const preset = dashboard.presets.find(item => item.id === id); if (preset) { setBroadcastGroups(preset.group_jids || []); setBroadcastMessage(preset.message); } }}><option value="">Pilih grup secara manual</option>{dashboard.presets.filter(preset => preset.active).map(preset => <option key={preset.id} value={preset.id}>{preset.name} · {preset.group_count} grup</option>)}</select></label>
          {!broadcastPresetId && <div className="wa-group-picker"><div className="wa-section-heading"><strong>Target grup</strong><span>{broadcastGroups.length} dipilih</span></div>{allowedGroups.map(group => <label className="wa-pick-contact" key={group.group_jid}><input type="checkbox" checked={broadcastGroups.includes(group.group_jid)} onChange={e => setBroadcastGroups(current => toggleSelection(current, group.group_jid, e.target.checked))}/><span><strong>{group.group_name}</strong><small>{group.group_jid}</small></span></label>)}{!allowedGroups.length && <small className="wa-muted">Aktifkan izin broadcast minimal satu grup.</small>}</div>}
          {selectedPreset && <p className="wa-inline-note">Preset <b>{selectedPreset.name}</b> dipilih. Target otomatis mengikuti {selectedPreset.group_count} grup di preset tersebut.</p>}
          {blockedPresetGroups.length > 0 && <p className="wa-warning">{blockedPresetGroups.length} grup pada preset sedang diblokir. Aktifkan kembali izin broadcast grup tersebut atau edit preset sebelum menjadwalkan.</p>}
          <label>Isi pesan<textarea required maxLength={4000} rows={6} value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Tulis pesan broadcast. Pesan akan dikirim ke setiap grup yang dipilih."/></label>
          <div className="wa-schedule-mode"><label><input type="radio" name="send-mode" checked={sendMode === 'now'} onChange={() => setSendMode('now')}/> Kirim secepatnya</label><label><input type="radio" name="send-mode" checked={sendMode === 'scheduled'} onChange={() => setSendMode('scheduled')}/> Jadwalkan tanggal dan jam</label></div>
          {sendMode === 'scheduled' && <label>Waktu pengiriman (WIB)<input type="datetime-local" required value={scheduleLocal} onChange={e => setScheduleLocal(e.target.value)}/></label>}
          <div className="wa-schedule-preview"><small>WAKTU PENGIRIMAN</small><strong>{scheduledPreview}</strong><small>{effectiveBroadcastGroups.length} grup tujuan · zona waktu Asia/Jakarta</small></div>
          <label className="wa-toggle-label"><input type="checkbox" checked={confirmPermission} onChange={e => setConfirmPermission(e.target.checked)}/> Saya memastikan grup tujuan memang dikelola atau telah memberi izin menerima informasi ini.</label>
          <button className="portal-primary" disabled={busy === 'broadcast' || effectiveBroadcastGroups.length === 0 || blockedPresetGroups.length > 0 || !confirmPermission}>{busy === 'broadcast' ? 'Menyimpan jadwal…' : sendMode === 'now' ? 'Masukkan ke antrean kirim' : 'Jadwalkan broadcast'}</button>
          <small className="wa-muted">Broadcast grup tidak memakai jendela 24 jam personal. Gunakan hanya pada grup yang relevan dan memang mengizinkan informasi dari KonsepSTIFIn. Pengiriman dibatasi maksimal 100 grup per campaign.</small>
        </form>
      </section>
    </div>

    <section className="portal-card wa-group-broadcast-history">
      <div className="wa-section-heading"><div><span className="portal-eyebrow">DELIVERY CONTROL</span><h2>Jadwal &amp; riwayat broadcast</h2></div><button type="button" onClick={() => void refresh().catch(e => setError(e instanceof Error ? e.message : 'Riwayat gagal dimuat.'))}>Perbarui status</button></div>
      <div className="wa-group-table-wrap"><table className="wa-group-table"><thead><tr><th>Campaign</th><th>Jadwal kirim</th><th>Grup</th><th>Terkirim</th><th>Menunggu</th><th>Gagal / tidak pasti</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
        {dashboard.broadcasts.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small>Dibuat {jakartaDateTime(item.created_at)}</small></td><td><strong>{jakartaDateTime(item.scheduled_at)}</strong><small>{item.started_at ? `Mulai ${jakartaDateTime(item.started_at)}` : 'Belum mulai'}</small></td><td>{item.group_count}</td><td>{item.sent_count}</td><td>{item.pending_count + item.processing_count}</td><td>{item.failed_count} / {item.unknown_count}</td><td><span className={`wa-status-pill ${item.status}`}>{statusLabel(item.status)}</span></td><td><div className="wa-table-actions">{['scheduled','processing'].includes(item.status) && <button type="button" disabled={busy === `broadcast-${item.id}`} onClick={() => void broadcastAction(item.id, 'pause')}>Jeda</button>}{item.status === 'paused' && <button type="button" disabled={busy === `broadcast-${item.id}`} onClick={() => void broadcastAction(item.id, 'resume')}>Lanjutkan</button>}{!['completed','cancelled','failed'].includes(item.status) && <button type="button" className="danger" disabled={busy === `broadcast-${item.id}`} onClick={() => void broadcastAction(item.id, 'cancel')}>Batalkan</button>}</div></td></tr>)}
        {!dashboard.broadcasts.length && <tr><td colSpan={8}>Belum ada jadwal broadcast.</td></tr>}
      </tbody></table></div>
      <small className="wa-muted">Status Terkirim berarti StarSender menerima permintaan kirim. Status dibaca atau diterima hanya dapat ditampilkan jika StarSender menyediakan event status untuk pesan grup.</small>
    </section>

    <section className="portal-card wa-group-inbox-card">
      <div className="wa-section-heading"><div><span className="portal-eyebrow">GROUP WEBHOOK INBOX</span><h2>Pesan masuk dari grup</h2></div><span className="wa-mode human">Add-on Webhook Group</span></div>
      <p>Daftar ini terisi setelah add-on Webhook Group aktif dan URL webhook dipasang pada StarSender.</p>
      <div className="wa-group-messages">{dashboard.groupMessages.map(message => <article key={message.id}><div><strong>{message.group_name || message.group_jid}</strong><small>{jakartaDateTime(message.provider_timestamp || message.created_at)} · {message.direction === 'incoming' ? 'Masuk' : 'Keluar'}</small></div><p>{message.content}</p><small>Pengirim: {message.sender_name || message.sender_jid || 'Tidak disertakan StarSender'} · {message.sender_is_admin === true ? 'Admin grup' : message.sender_is_admin === false ? 'Anggota' : 'Peran tidak tersedia'}</small>{message.media_url && <a href={message.media_url} target="_blank" rel="noreferrer">Lihat media</a>}</article>)}{!dashboard.groupMessages.length && <div className="wa-empty"><span>Belum ada pesan grup yang diterima</span><small>Pesan grup tidak akan muncul hanya dengan Webhook Premium personal. Aktifkan add-on Webhook Group untuk mengirim event grup ke KonsepSTIFIn.</small></div>}</div>
      <small className="wa-muted">Dokumentasi StarSender yang tersedia mengirimkan nama grup, ID grup, pesan, file, perangkat, dan timestamp. Identitas pengirim atau status admin hanya akan tampil jika payload provider memang menyertakannya.</small>
    </section>
  </div>;
}

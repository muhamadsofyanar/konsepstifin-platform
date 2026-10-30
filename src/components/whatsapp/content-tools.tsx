'use client';
import { useEffect, useState } from 'react';
export type ContentTemplate = { id:number; title:string; category:string; body:string; media_url?:string; active:boolean };
export function ContentPicker({ onSelect }: { onSelect:(template:ContentTemplate)=>void }) {
  const [items,setItems] = useState<ContentTemplate[]>([]);
  const [search,setSearch] = useState('');
  const [error,setError] = useState('');
  useEffect(()=>{let active=true; void fetch('/api/admin/whatsapp/templates',{cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.message || 'Bank konten gagal dimuat.');if(active)setItems((data.templates || []).filter((t:ContentTemplate)=>t.active));}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
  const visible = items.filter(t=>`${t.title} ${t.category}`.toLowerCase().includes(search.toLowerCase()));
  return <fieldset><legend>Bank konten</legend><label>Cari konten<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Judul atau tahap: attract, engage, delight"/></label><label>Gunakan konten<select value="" onChange={e=>{const t=items.find(t=>String(t.id)===e.target.value);if(t)onSelect(t);}}><option value="">Pilih konten tersimpan…</option>{visible.map(t=><option key={t.id} value={t.id}>{t.category} · {t.title}</option>)}</select></label>{error&&<small role="alert">{error}</small>}</fieldset>;
}
export function AttachmentInput({ value,onChange,onBusyChange }: { value:string; onChange:(value:string)=>void; onBusyChange?:(busy:boolean)=>void }) {
  const [busy,setBusy] = useState(false),[error,setError] = useState('');
  async function upload(file:File) {
    setError(''); if(file.size>10*1024*1024){setError('Ukuran maksimal 10 MB.');return;}
    setBusy(true);onBusyChange?.(true);
    try { const form=new FormData();form.append('file',file); const r=await fetch('/api/admin/whatsapp/attachments',{method:'POST',body:form});const data=await r.json();if(!r.ok)throw new Error(data.message || 'Unggah gagal.');onChange(data.url); }
    catch(e){setError(e instanceof Error?e.message:'Unggah gagal.');}finally{setBusy(false);onBusyChange?.(false);}
  }
  return <details className="wa-attachment"><summary>Lampiran opsional{value ? ' · Terpasang' : ''}</summary><fieldset disabled={busy}><label>Unggah file<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.mp3,.docx,.xlsx,.pptx" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/></label><small>PDF, gambar, MP4, MP3, Word, Excel, PowerPoint. Maksimal unggahan 10 MB. Tautan file dapat dibuka oleh siapa pun yang memilikinya agar StarSender dapat mengambil file.</small><label>Atau URL file HTTPS<input type="url" value={value} maxLength={2000} onChange={e=>onChange(e.target.value)} placeholder="https://…/brosur.pdf"/></label>{value&&<button type="button" onClick={()=>onChange('')}>Hapus lampiran</button>}{busy&&<small role="status">Mengunggah lampiran…</small>}{error&&<small role="alert">{error}</small>}</fieldset></details>;
}

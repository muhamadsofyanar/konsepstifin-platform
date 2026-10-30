'use client';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/dashboard-chat-service';
import './chat.css';
type Contact={user_id:string;email:string;display_name:string;whatsapp_phone:string;promoter:boolean;unread:number;last_message:string|null};
async function api(url:string,options:RequestInit={}){
 const response=await fetch(url,{...options,cache:'no-store'});
 const data=await response.json();
 if(!response.ok)throw new Error(typeof data.message==='string'?data.message:'Permintaan belum berhasil.');
 return data;
}
function post(data:object){return api('/api/account/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});}
function time(value:string){return new Date(value).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'});}
function join(previous:ChatMessage[],incoming:ChatMessage[]){return [...new Map([...previous,...incoming].map(m=>[m.id,m])).values()].sort((a,b)=>BigInt(a.id)<BigInt(b.id)?-1:BigInt(a.id)>BigInt(b.id)?1:0);}
function ContactProfile(){
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{let current=true;api('/api/account/contact').then(d=>{if(current){setName(d.profile.display_name);setPhone(d.profile.whatsapp_phone);setReady(true);}}).catch(e=>{if(current)setNotice(e.message);});return()=>{current=false;};},[]);
 async function save(event:React.FormEvent){event.preventDefault();setBusy(true);setNotice('');try{const d=await api('/api/account/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({displayName:name,whatsappPhone:phone})});setName(d.profile.display_name);setPhone(d.profile.whatsapp_phone);setNotice('Profil kontak disimpan.');}catch(e){setNotice(e instanceof Error?e.message:'Profil belum tersimpan.');}finally{setBusy(false);}}
 return <details className="dc-profile"><summary>Profil kontak saya</summary><form onSubmit={save}><label>Nama tampilan<input value={name} maxLength={120} onChange={e=>setName(e.target.value)} disabled={!ready}/></label><label>Nomor WhatsApp<input type="tel" value={phone} maxLength={40} placeholder="Contoh: 081234567890" onChange={e=>setPhone(e.target.value)} disabled={!ready}/></label><p>Nomor ini belum diverifikasi. Menyimpan profil tidak mengirim pesan WhatsApp.</p><button disabled={!ready||busy}>{busy?'Menyimpan…':'Simpan profil'}</button>{notice&&<p role="status">{notice}</p>}</form></details>;
}
function Conversation({memberId,userId,isAdmin,title,onBack}:{memberId:string;userId:string;isAdmin:boolean;title:string;onBack:()=>void}){
 const [messages,setMessages]=useState<ChatMessage[]>([]),[draft,setDraft]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false),[sending,setSending]=useState(false),[older,setOlder]=useState(false),[loadingOlder,setLoadingOlder]=useState(false);
 const readThrough=useRef('');
 const all=useRef<ChatMessage[]>([]),fetched=useRef(''),pending=useRef<{body:string;key:string}|null>(null),live=useRef(true),scroll=useRef<HTMLDivElement>(null),bottom=useRef(true),refresh=useRef<()=>void>(()=>{});
 async function receipt(){const id=fetched.current;if(!live.current||!bottom.current||document.visibilityState==='hidden'||!id||readThrough.current===id)return;readThrough.current=id;try{await post({action:'read',memberId,lastId:id});window.dispatchEvent(new Event('dashboard-chat-read'));}catch{if(live.current)readThrough.current='';}}
 function merge(incoming:ChatMessage[]){all.current=join(all.current,incoming);setMessages(all.current);}
 useEffect(()=>{
  live.current=true;let stopped=false,busy=false;const controller=new AbortController();
  async function load(){if(stopped||busy)return;busy=true;
   try{const first=!fetched.current;const data=await api('/api/account/chat?memberId='+encodeURIComponent(memberId)+(fetched.current?'&after='+fetched.current:''),{signal:controller.signal});if(stopped)return;
    const incoming=data.messages as ChatMessage[];if(first)setOlder(incoming.length===100);
    merge(incoming);if(incoming.length)fetched.current=incoming[incoming.length-1].id;
    setReady(true);setError('');
    if(!incoming.length)void receipt();
   }catch(e){if(!stopped)setError(e instanceof Error?e.message:'Pesan belum dimuat.');}finally{busy=false;}
  }
  refresh.current=()=>{void load();};void load();
  const poll=setInterval(()=>{if(document.visibilityState!=='hidden')void load();},10000);
  const visible=()=>{if(document.visibilityState!=='hidden')void load();};document.addEventListener('visibilitychange',visible);
  return()=>{stopped=true;live.current=false;controller.abort();clearInterval(poll);document.removeEventListener('visibilitychange',visible);};
 },[memberId]);
 useEffect(()=>{if(bottom.current&&scroll.current){scroll.current.scrollTop=scroll.current.scrollHeight;void receipt();}},[messages]);
 async function send(event:React.FormEvent){event.preventDefault();if(!draft.trim()||sending||!ready)return;
  const body=draft;if(!pending.current||pending.current.body!==body)pending.current={body,key:crypto.randomUUID()};
  setSending(true);setError('');
  try{const data=await post({action:'send',memberId,body,clientKey:pending.current.key});if(!live.current)return;bottom.current=true;merge([data.message]);setDraft('');pending.current=null;refresh.current();}
  catch(e){if(live.current)setError(e instanceof Error?e.message:'Pesan belum terkirim. Silakan coba kembali.');}
  finally{if(live.current)setSending(false);}
 }
 async function history(){if(loadingOlder||!all.current.length)return;setLoadingOlder(true);const element=scroll.current,oldHeight=element?.scrollHeight??0,oldTop=element?.scrollTop??0;
  try{const data=await api('/api/account/chat?memberId='+encodeURIComponent(memberId)+'&before='+all.current[0].id);if(!live.current)return;bottom.current=false;merge(data.messages);setOlder(data.messages.length===100);requestAnimationFrame(()=>{if(element)element.scrollTop=oldTop+element.scrollHeight-oldHeight;});}
  catch(e){if(live.current)setError(e instanceof Error?e.message:'Riwayat belum dimuat.');}finally{if(live.current)setLoadingOlder(false);}
 }
 return <section className="dc-conversation" aria-label="Percakapan dashboard"><header className="dc-conversation-head">{isAdmin&&<button className="dc-back" type="button" onClick={onBack}>← Daftar akun</button>}<div><h2>{title}</h2><p>{isAdmin?'Percakapan pribadi akun dengan tim admin.':'Pesan pribadi Anda dengan tim admin KonsepSTIFIn.'}</p></div><span className="dc-channel">Chat dashboard</span></header>
 <div className="dc-messages" ref={scroll} onScroll={()=>{const el=scroll.current;if(el){bottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<30;if(bottom.current)void receipt();}}} tabIndex={0} aria-label="Riwayat pesan">
 {older&&<button className="dc-history" type="button" onClick={history} disabled={loadingOlder}>{loadingOlder?'Memuat…':'Muat pesan sebelumnya'}</button>}
 {!ready&&!error&&<p className="dc-empty">Memuat percakapan…</p>}{ready&&!messages.length&&<div className="dc-empty"><h3>Mulai percakapan</h3><p>{isAdmin?'Kirim pesan untuk menghubungi akun ini.':'Tuliskan pertanyaan Anda. Tim admin dapat membalas melalui dashboard ini.'}</p></div>}
 {messages.map(m=>{const own=isAdmin?m.sender_kind==='admin':m.sender_id===userId;return <article key={m.id} className={'dc-message '+(own?'dc-own':'')}><small>{m.sender_kind==='admin'?'Tim Admin':isAdmin?title:'Anda'}</small><p>{m.body}</p><time dateTime={m.created_at}>{time(m.created_at)} WIB</time></article>;})}
 </div>
 {error&&<div className="dc-error" role="alert">{error} <button type="button" onClick={()=>refresh.current()}>Muat ulang</button></div>}
 <form className="dc-compose" onSubmit={send}><label htmlFor="dashboard-message">Tulis pesan</label><textarea id="dashboard-message" value={draft} maxLength={4000} rows={3} disabled={sending} placeholder="Tuliskan pesan Anda…" onChange={e=>setDraft(e.target.value)}/><div><small>{draft.length}/4000 · Pesan diperbarui setiap 10 detik saat tab aktif.</small><button type="submit" disabled={!ready||sending||!draft.trim()} aria-label="Kirim pesan">{sending?'Mengirim…':'Kirim pesan →'}</button></div></form></section>;
}
export default function ChatWorkspace({isAdmin,userId}:{isAdmin:boolean;userId:string}){
 const [accounts,setAccounts]=useState<Contact[]>([]),[search,setSearch]=useState(''),[selected,setSelected]=useState<Contact|null>(null),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
 useEffect(()=>{if(!isAdmin)return;let disposed=false,busy=false;const controller=new AbortController();
  async function load(){if(disposed||busy)return;busy=true;try{const data=await api('/api/account/chat?view=accounts&q='+encodeURIComponent(search),{signal:controller.signal});if(!disposed){setAccounts(data.accounts);setLoaded(true);setError('');}}catch(e){if(!disposed)setError(e instanceof Error?e.message:'Daftar akun belum dimuat.');}finally{busy=false;}}
  const timer=setTimeout(()=>{void load();},200);const interval=setInterval(()=>{if(document.visibilityState!=='hidden')void load();},10000);
  const visible=()=>{if(document.visibilityState!=='hidden')void load();};document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;controller.abort();clearTimeout(timer);clearInterval(interval);document.removeEventListener('visibilitychange',visible);};
 },[isAdmin,search]);
 const target=isAdmin?selected?.user_id:userId;
 return <div className={'dc-workspace '+(isAdmin?'dc-admin ':'')+(target?'dc-selected':'')}>
 {isAdmin&&<aside className="dc-sidebar"><div className="dc-sidebar-head"><span className="dc-eyebrow">PESAN AKUN</span><h2>Member &amp; promotor</h2><label htmlFor="chat-search">Cari akun</label><input id="chat-search" type="search" value={search} placeholder="Nama, email, nomor WhatsApp…" onChange={e=>setSearch(e.target.value)}/><small>Menampilkan hingga 100 akun aktif. Gunakan pencarian untuk akun lainnya.</small></div>{error&&<p className="dc-error" role="alert">{error}</p>}<div className="dc-contacts">{!loaded&&!error&&<p className="dc-empty">Memuat akun…</p>}{loaded&&!accounts.length&&<p className="dc-empty">Tidak ada akun yang cocok.</p>}{accounts.map(a=><button type="button" key={a.user_id} onClick={()=>setSelected(a)} aria-pressed={selected?.user_id===a.user_id} className="dc-contact"><span className="dc-avatar">{(a.display_name||a.email).slice(0,1).toUpperCase()}</span><span className="dc-contact-copy"><strong>{a.display_name||a.email}</strong><small>{a.promoter?'Promotor':'Member'} · {a.email}</small><span>{a.last_message||'Belum ada pesan'}</span></span>{Number(a.unread)>0&&<b className="dc-unread" aria-label={a.unread+' pesan belum dibaca'}>{a.unread}</b>}</button>)}</div></aside>}
 <div className="dc-main">{target?<Conversation key={target} memberId={target} userId={userId} isAdmin={isAdmin} title={isAdmin?(selected?.display_name||selected?.email||'Akun'):'Tim Admin'} onBack={()=>setSelected(null)}/>:<div className="dc-empty dc-placeholder"><span className="dc-illustration">✉</span><h2>Pilih akun untuk mengirim pesan</h2><p>Hubungi member atau promotor langsung melalui dashboard. Percakapan ini terpisah dari WhatsApp pelanggan.</p></div>}
 {!isAdmin&&<ContactProfile/>}{isAdmin&&selected?.whatsapp_phone&&<p className="dc-contact-note">Nomor kontak: {selected.whatsapp_phone} · Belum diverifikasi. Pesan di atas dikirim melalui dashboard.</p>}</div></div>;
}

'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { learningAccess } from '@/lib/portal-ui';
import VideoPlayer from '../../video-player';
import { query, action, date, EmptyState, Notice, type DataRow } from '../../ui';

export default function Classroom({productId,initialLesson}:{productId:number;initialLesson?:number}) {
 const [grant,setGrant]=useState<DataRow|null>(null),[lessons,setLessons]=useState<DataRow[]>([]),[progress,setProgress]=useState<DataRow[]>([]);
 const [material,setMaterial]=useState<DataRow|null>(null),[loading,setLoading]=useState(true),[reading,setReading]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[retry,setRetry]=useState(0),[outline,setOutline]=useState(false);
 const version=useRef(0), heading=useRef<HTMLHeadingElement>(null);
 const invalidate=useCallback(()=>{version.current++;},[]);
 function reload(){setLoading(true);setError('');setMaterial(null);setRetry(v=>v+1);}

 useEffect(()=>{
  let active=true;
  query('view=classroom&id='+productId+(initialLesson?'&lesson='+initialLesson:'')).then(data=>{
   if(!active)return;
   setGrant(data.grant??null);setProgress(data.progress??[]);setLessons(data.lessons??[]);setMaterial(data.material??null);
   setError(data.materialError??'');
   if(data.material){const u=new URL(window.location.href);u.searchParams.set('materi',String(data.material.id));window.history.replaceState(null,'',u);}
  }).catch(e=>{if(active)setError(e instanceof Error?e.message:'Kelas belum dapat dimuat.');}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;invalidate();};
 },[productId,initialLesson,retry,invalidate]);

 const read=useCallback(async (lesson:DataRow,updateHistory=true) => {
  const request=++version.current;setReading(true);setError('');setMessage('');setMaterial(null);setOutline(false);
  try {const data=await query('view=material&id='+lesson.id);if(request!==version.current)return;setMaterial(data.material);
   if(updateHistory){const u=new URL(window.location.href);u.searchParams.set('materi',String(lesson.id));window.history.pushState(null,'',u);}
   heading.current?.focus();
  }catch(e){if(request===version.current)setError(e instanceof Error?e.message:'Materi belum dapat dibuka.');}
  finally{if(request===version.current)setReading(false);}
 },[]);
 useEffect(()=>{const restore=()=>{const id=Number(new URL(window.location.href).searchParams.get('materi'));const lesson=lessons.find(l=>Number(l.id)===id);if(lesson)void read(lesson,false);};window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);},[lessons,read]);

 const required=Array.isArray(grant?.required_lessons)?grant.required_lessons:[];
 const done=progress.filter(p=>required.includes(Number(p.lesson_id))).length;
 const completed=(id:unknown)=>progress.some(p=>Number(p.lesson_id)===Number(id));
 const index=lessons.findIndex(l=>Number(l.id)===Number(material?.id));
 const isEbook=grant?.kind==='ebook', access=grant?learningAccess(grant):null;
 const unlocked=(l:DataRow)=>!!grant&&(l.preview===true||!learningAccess(grant,Number(l.unlock_days)).locked);
 async function complete() {
  if(!material||busy)return;
  const id=Number(material.id);setBusy(true);setError('');
  try{await action({action:'complete',id});setProgress(p=>p.some(row=>Number(row.lesson_id)===id)?p:[...p,{lesson_id:id,product_id:productId}]);setMessage('Progres tersimpan. Anda bisa melanjutkan ke materi berikutnya.');}
  catch(e){setError(e instanceof Error?e.message:'Progres belum tersimpan. Coba kembali.');}
  finally{setBusy(false);}
 }
 return <main className="learning-app lr-classroom">
  <header className="lr-topbar"><Link className="lr-brand" href="/">KonsepSTIFIn</Link><Link href="/belajar?tab=classes">← Kembali ke akses saya</Link></header>
  <div className="lr-classroom-title"><div><span className="lr-eyebrow">{isEbook?'PUSTAKA EBOOK':'RUANG BELAJAR'}</span><h1>{grant?String(grant.title):'Materi Anda'}</h1></div><Link className="lr-secondary lr-button" href="/belajar?tab=support">Bantuan</Link></div>
  {loading?<div className="lr-skeleton" role="status">Menyiapkan ruang belajar…</div>:!grant||!access?.active?<section className="lr-card"><EmptyState title={error&&!grant?'Ruang belajar belum dapat dimuat':grant?'Akses kelas belum aktif':'Kelas belum ada di akun Anda'} description={error&&!grant?'Coba muat ulang kelas. Jika kendala berlanjut, hubungi pengelola melalui Bantuan.':grant?'Akses berakhir atau ditangguhkan. Hubungi pengelola untuk memeriksa akses.':'Gunakan akun yang memiliki akses kelas ini atau pilih produk di katalog.'}><Link className="lr-button" href="/belajar?tab=classes">Lihat akses saya</Link></EmptyState><Notice message={error} error/>{error&&<button className="lr-secondary" onClick={reload}>Coba lagi</button>}</section>:<>
   <section className="lr-learning-summary" aria-label="Progres kelas"><span>{isEbook?'File untuk Anda':required.length?`${done} dari ${required.length} materi wajib selesai`:'Materi pilihan'}</span>{!isEbook&&required.length>0&&<progress aria-label="Progres kelas" value={done} max={required.length}/>}<small>{grant.expires_at?'Akses sampai '+date(grant.expires_at):'Akses tanpa tanggal berakhir'}</small></section>
   <div className="lr-classroom-layout">
    <aside className={'lr-class-outline'+(outline?' is-open':'')} aria-label="Daftar materi"><button className="lr-outline-toggle lr-secondary" aria-expanded={outline} onClick={()=>setOutline(v=>!v)}>Daftar {isEbook?'unduhan':'materi'} · {lessons.length}<span>{outline?'−':'+'}</span></button><div className="lr-outline-items"><h2>{isEbook?'Unduhan Anda':'Daftar materi'}</h2>{lessons.map((l,i)=>{const allowed=unlocked(l),unlock=learningAccess(grant,Number(l.unlock_days));return <button className="lr-lesson" key={String(l.id)} aria-current={Number(material?.id)===Number(l.id)?'step':undefined} disabled={!allowed||busy} onClick={()=>read(l)}><span className="lr-lesson-number" aria-hidden="true">{completed(l.id)?'✓':i+1}</span><span>{String(l.title)}<small>{String(l.module)}{!allowed?' · Buka '+date(unlock.unlockAt):completed(l.id)?' · Selesai':''}</small></span></button>;})}{!lessons.length&&<p className="lr-muted">Materi belum diterbitkan. Hubungi pengelola jika kelas seharusnya sudah dimulai.</p>}</div></aside>
    <section className="lr-card lr-lesson-content" aria-busy={reading}><Notice message={error} error/>{error&&<button className="lr-secondary" onClick={reload}>Muat ulang kelas</button>}<Notice message={message}/>{reading?<div role="status" className="lr-skeleton">Membuka materi…</div>:material?<>
     <span className="lr-eyebrow">{String(material.module)} · {index+1} dari {lessons.length}</span><h2 ref={heading} tabIndex={-1}>{String(material.title)}</h2>
     {material.kind==='video'&&!!material.url&&<VideoPlayer key={String(material.id)} url={String(material.url)} title={String(material.title)}/>}
     {!!material.body&&<article className="lr-material-body">{String(material.body)}</article>}
     {!!material.url&&material.kind!=='video'&&<p><a className="lr-button lr-secondary" href={String(material.url)} target="_blank" rel="noopener noreferrer">Buka tautan pendukung ↗</a></p>}
     {!!material.hasFile&&<div className="lr-download-box"><div><h3>{isEbook?'Ebook siap diunduh':'File pendukung'}</h3><p className="lr-muted">Simpan file agar mudah dibaca kembali.</p></div><a className="lr-button" href={'/api/learning/files/'+material.id}>Unduh {isEbook?'ebook':'file'} ↓</a></div>}
     <div className="lr-lesson-footer">{!isEbook&&<button disabled={busy||completed(material.id)} onClick={complete}>{busy?'Menyimpan…':completed(material.id)?'✓ Materi selesai':'Tandai materi selesai'}</button>}<div className="lr-actions"><button className="lr-secondary" disabled={busy||index<=0||!unlocked(lessons[index-1])} onClick={()=>read(lessons[index-1])}>← Sebelumnya</button><button className="lr-secondary" disabled={busy||index<0||index>=lessons.length-1||!unlocked(lessons[index+1])} onClick={()=>read(lessons[index+1])}>Berikutnya →</button></div></div>
    </>:!error&&<EmptyState title="Pilih materi yang tersedia" description={lessons.length?'Buka daftar materi untuk memilih pelajaran Anda.':'Pengelola sedang menyiapkan materi untuk kelas ini.'}/>}</section>
   </div>
  </>}
 </main>;
}

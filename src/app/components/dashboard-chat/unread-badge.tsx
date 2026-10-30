'use client';
import { useEffect, useState } from 'react';
export default function ChatUnreadBadge(){
 const [count,setCount]=useState(0);
 useEffect(()=>{let gone=false,busy=false;const controller=new AbortController();
  async function load(){if(gone||busy||document.visibilityState==='hidden')return;busy=true;try{const r=await fetch('/api/account/chat?view=summary',{cache:'no-store',signal:controller.signal});if(r.ok){const data=await r.json();if(!gone)setCount(Math.max(0,Number(data.unread)||0));}}catch{/* Keep navigation usable when chat is not configured yet. */}finally{busy=false;}}
  void load();const interval=setInterval(()=>{void load();},10000);
  const refresh=()=>{void load();};document.addEventListener('visibilitychange',refresh);window.addEventListener('dashboard-chat-read',refresh);
  return()=>{gone=true;controller.abort();clearInterval(interval);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('dashboard-chat-read',refresh);};
 },[]);
 return count>0?<span aria-label={count+' pesan belum dibaca'} style={{display:'inline-block',marginLeft:6,padding:'1px 6px',borderRadius:20,background:'#005b4d',color:'#fff',fontSize:10,fontWeight:700}}>{count>99?'99+':count}</span>:null;
}

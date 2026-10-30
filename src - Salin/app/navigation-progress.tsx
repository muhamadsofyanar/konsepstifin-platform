'use client';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { usePathname, useSearchParams } from 'next/navigation';

export function isPageNavigation(anchor: HTMLAnchorElement, current: string) {
 if(anchor.hasAttribute('download')||anchor.target&&anchor.target!=='_self')return false;
 try {
  const from=new URL(current),to=new URL(anchor.href,current);
  if(to.origin!==from.origin||!['http:','https:'].includes(to.protocol))return false;
  if(to.pathname===from.pathname&&to.search===from.search)return false;
  return !/^\/(?:api|r)(?:\/|$)/.test(to.pathname)&&!/(?:^|\/)logout(?:\/|$)/.test(to.pathname);
 }catch{return false;}
}

/** Feedback only. Never fetch links here: referral visits and downloads have side effects. */
export default function NavigationProgress() {
 const [pending,setPending]=useState(false);
 const pathname=usePathname(),params=useSearchParams(),search=params.toString();
 useEffect(()=>{
  let safety:ReturnType<typeof setTimeout>|undefined;
  const start=(event:MouseEvent)=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const target=event.target instanceof Element?event.target.closest('a[href]'):null;
   if(!(target instanceof HTMLAnchorElement)||!isPageNavigation(target,window.location.href))return;
   flushSync(()=>setPending(true));clearTimeout(safety);safety=setTimeout(()=>setPending(false),10000);
  };
  const reset=()=>setPending(false);
  document.addEventListener('click',start,true);window.addEventListener('pageshow',reset);
  return()=>{clearTimeout(safety);document.removeEventListener('click',start,true);window.removeEventListener('pageshow',reset);};
 },[]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>setPending(false));return()=>cancelAnimationFrame(frame);},[pathname,search]);
 if(!pending)return null;
 return <div className="navigation-pending" role="status"><div className="navigation-progress" aria-hidden="true"/><span>Membuka halaman…</span></div>;
}

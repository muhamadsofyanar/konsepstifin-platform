'use client';
import { useState } from 'react';
import { learningVideo } from '@/lib/learning-video';
export default function VideoPlayer({url,title}:{url:string;title:string}){
  const video=learningVideo(url),[failed,setFailed]=useState(false);
  if(!video)return <div className="lr-inline-notice"><p>Alamat video ini belum mendukung pemutar langsung. Pengelola dapat menggantinya dengan tautan YouTube, Vimeo, MP4, atau WebM.</p><a href={url} target="_blank" rel="noopener noreferrer">Buka sumber video ↗</a></div>;
  return <section className="lr-video-block" aria-label={'Video '+title}><div className="lr-video-frame">{video.type==='embed'?<iframe key={video.src} title={title} src={video.src} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<video key={video.src} src={video.src} controls playsInline preload="metadata" onError={()=>setFailed(true)}>Browser Anda tidak mendukung pemutar video ini.</video>}</div>{failed&&<p role="alert">Video belum dapat diputar. Periksa izin file atau hubungi pengelola.</p>}<details className="lr-video-help"><summary>Video tidak tampil?</summary><p>Pastikan koneksi tersedia. Pemilik video harus mengizinkan penyematan pada situs ini.</p><a href={url} target="_blank" rel="noopener noreferrer">Buka sumber video ↗</a></details></section>;
}

'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { action, Input, Notice, rupiah, type DataRow } from '../belajar/ui';
export default function ProductCheckout({product:p,signedIn,path,owned}:{product:DataRow;signedIn:boolean;path:string;owned:boolean}){
  const router=useRouter(),key=useRef(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  if(owned)return <div className="lr-purchase-box"><h2>Produk sudah Anda miliki</h2><p>Lanjutkan materi atau unduh ebook melalui Akses saya.</p><Link className="lr-button" href="/belajar?tab=classes">Buka akses saya →</Link></div>;
  if(!signedIn)return <div className="lr-purchase-box"><h2>Mulai dengan satu akun</h2><p>Masuk atau daftar. Setelahnya Anda kembali ke produk ini.</p><div className="lr-actions"><Link className="lr-button" href={'/akun/login?next='+encodeURIComponent(path)}>Masuk untuk membeli</Link><Link className="lr-button lr-secondary" href={'/akun/daftar?next='+encodeURIComponent(path)}>Daftar peserta</Link></div></div>;
  return <form className="lr-purchase-box" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');if(!key.current)key.current=crypto.randomUUID();const input=Object.fromEntries(new FormData(e.currentTarget));try{const r=await action({action:'checkout',productId:p.id,key:key.current,...input});router.push(r.free?'/belajar?tab=classes':'/belajar?tab=orders');router.refresh();}catch(e){setError(e instanceof Error?e.message:'Pesanan belum berhasil dibuat.');}finally{setBusy(false);}}}><h2>{Number(p.price)?'Pesan produk ini':'Dapatkan akses gratis'}</h2><p>Total katalog <strong>{rupiah(p.price)}</strong>. Harga akhir dan diskon dihitung oleh server saat pesanan dibuat.</p><div className="lr-fields"><Input name="name" label="Nama peserta"/><Input name="phone" label="Nomor WhatsApp" maxLength={40}/></div><Input name="coupon" label="Kode kupon (opsional)" required={false} maxLength={40}/><Notice message={error} error/><button disabled={busy}>{busy?'Membuat pesanan…':Number(p.price)?'Buat pesanan':'Aktifkan akses gratis'}</button></form>;
}

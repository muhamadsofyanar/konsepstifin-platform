'use client';
import { useState } from 'react';
type Portal={alias:string;url:string;aliases:string[]};
export default function ReferralForm({initial}:{initial:Portal}) {
 const [portal,setPortal]=useState(initial),[alias,setAlias]=useState(initial.alias),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 return <form className="portal-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{const response=await fetch('/api/account/referral',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({alias})});const data=await response.json();if(!response.ok)throw new Error(data.message);setPortal(data);setAlias(data.alias);setMessage('Alias disimpan.');}catch(error){setMessage(error instanceof Error?error.message:'Tautan belum dapat disimpan.');}finally{setBusy(false);}}}>
 <p><a href={portal.url}>{portal.url}</a></p><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(portal.url);setMessage('Tautan disalin.');}catch{setMessage('Salin tautan yang ditampilkan di atas.');}}}>Salin tautan</button>
 <p>Tautan promosi kelas: <a href={portal.url+'?to=/belajar'}>{portal.url+'?to=/belajar'}</a></p><p><label htmlFor="referral-alias">Alias: nama, panggilan, atau kode</label><input id="referral-alias" value={alias} onChange={e=>setAlias(e.target.value)} minLength={2} maxLength={80} required/></p><p>Gunakan huruf ASCII, angka, dan tanda hubung.</p><button disabled={busy} type="submit">{busy?'Menyimpan…':'Simpan alias'}</button><p role="status">{message}</p><details><summary>Tautan yang tetap berlaku</summary><ul>{portal.aliases.map(a=><li key={a}>{a}</li>)}</ul></details>
 </form>;
}

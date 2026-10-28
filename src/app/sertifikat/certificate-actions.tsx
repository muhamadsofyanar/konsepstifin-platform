'use client';
import { useState } from 'react';
export default function CertificateActions(){const [message,setMessage]=useState('');return <div className="certificate-actions"><button onClick={()=>window.print()}>Cetak / Simpan PDF</button><button className="lr-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(window.location.href);setMessage('Tautan verifikasi disalin.');}catch{setMessage('Salin alamat halaman ini untuk verifikasi.');}}}>Salin tautan verifikasi</button>{message&&<span role="status">{message}</span>}</div>;}

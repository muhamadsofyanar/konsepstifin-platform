import {getAccountPrincipal} from '@/lib/identity/server';
import LearningPortal from './portal';
import './learning.css';
export const dynamic='force-dynamic';
export const metadata={title:'Kelas dan Produk Digital | KonsepSTIFIn',description:'Temukan kelas dan materi KonsepSTIFIn. Belajar melalui satu akun dan lanjutkan progres Anda.'};
export default async function Page(){let signedIn=false;try{const p=await getAccountPrincipal();signedIn=!!p?.active&&!!p?.sessionValid;}catch{}return <LearningPortal signedIn={signedIn}/>;}

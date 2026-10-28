import { redirect, notFound } from 'next/navigation';
import { getAccountPrincipal } from '@/lib/identity/server';
import Classroom from './classroom';
import '../../learning.css';
export const dynamic='force-dynamic';
export const metadata={title:'Ruang materi | KonsepSTIFIn',robots:{index:false,follow:false}};
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{materi?:string}>}) {
 const {id}=await params;
 if(!/^[1-9][0-9]*$/.test(id)||!Number.isSafeInteger(Number(id)))notFound();
 const lesson=(await searchParams).materi;
 const initialLesson=lesson&&/^[1-9][0-9]*$/.test(lesson)&&Number.isSafeInteger(Number(lesson))?Number(lesson):undefined;
 const p=await getAccountPrincipal();
 if(!p?.active||!p.sessionValid)redirect('/akun/login?next='+encodeURIComponent('/belajar/kelas/'+id+(initialLesson?'?materi='+initialLesson:'')));
 return <Classroom key={id+':'+(initialLesson??'resume')} productId={Number(id)} initialLesson={initialLesson}/>;
}

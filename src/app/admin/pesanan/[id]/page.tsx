import { notFound,redirect } from 'next/navigation';
import { getAdminPrincipal } from '@/lib/admin-auth';
import { getOperationsService } from '@/lib/operations-store';
import { getOrder } from '@/lib/commerce-store';
import CommerceWorkspace from '../commerce-workspace';
export const dynamic='force-dynamic';
export default async function OrderPage({params}:{params:Promise<{id:string}>}){
 if(!await getAdminPrincipal())redirect('/admin/login');const id=Number((await params).id);if(!Number.isSafeInteger(id)||id<1)notFound();
 let order;try{order=await getOrder(id);}catch{return <CommerceWorkspace error="Rincian pesanan belum dapat dibaca. Periksa database dan migrasi."/>;}if(!order)notFound();let bank,bankError='';try{bank=await getOperationsService().settings();}catch{bankError='Instruksi rekening gagal dibaca. Periksa Pengaturan sebelum memberi instruksi pembayaran.';}return <CommerceWorkspace initialOrder={order} bank={bank} bankError={bankError}/>;
}

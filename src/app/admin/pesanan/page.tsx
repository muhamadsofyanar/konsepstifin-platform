import { redirect } from 'next/navigation';
import { getAdminPrincipal } from '@/lib/admin-auth';
import { listOrders } from '@/lib/commerce-store';
import CommerceWorkspace from './commerce-workspace';
export const dynamic='force-dynamic';
export default async function OrdersPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 if(!await getAdminPrincipal())redirect('/admin/login');
 const params=await searchParams;const raw=Number(params.page||1);const page=Number.isFinite(raw)?Math.max(1,Math.trunc(raw)):1;const rawLeadId=params.leadId;const hasLeadFilter=rawLeadId!==undefined;const parsedLeadId=typeof rawLeadId==='string'&&/^[1-9]\d*$/.test(rawLeadId)?Number(rawLeadId):NaN;const validLeadFilter=Number.isSafeInteger(parsedLeadId)&&parsedLeadId>0;const leadId=validLeadFilter?String(parsedLeadId):'';
 let data,error='';if(hasLeadFilter&&!validLeadFilter){error='ID lead tidak valid. Buka kembali pesanan melalui CRM.';}else{try{data=await listOrders(validLeadFilter?{page,leadId:parsedLeadId}:{page});}catch{error='Daftar pesanan belum dapat dibaca. Periksa koneksi database dan jalankan migrasi sebelum digunakan.';}}
 return <CommerceWorkspace initialOrders={data?.orders??[]} total={data?.total??0} page={data?.page??page} initialLeadId={leadId} error={error}/>;
}

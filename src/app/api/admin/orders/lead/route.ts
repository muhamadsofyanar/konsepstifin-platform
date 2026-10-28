import { getCommerceLead } from '@/lib/commerce-store';
import { commerceFailure,commerceGuard,commerceJson } from '@/lib/commerce-http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const guard=await commerceGuard(request);if(guard.response)return guard.response;const lead=await getCommerceLead(Number(new URL(request.url).searchParams.get('id')));return lead?commerceJson({lead}):commerceJson({message:'Lead tidak ditemukan.'},404);}catch(error){return commerceFailure(error);}}

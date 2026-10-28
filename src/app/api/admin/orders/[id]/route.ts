import { commandOrder,getOrder } from '@/lib/commerce-store';
import { commerceFailure,commerceGuard,commerceJson } from '@/lib/commerce-http';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context){try{const guard=await commerceGuard(request);if(guard.response)return guard.response;const order=await getOrder(Number((await context.params).id));return order?commerceJson({order}):commerceJson({message:'Pesanan tidak ditemukan.'},404);}catch(error){return commerceFailure(error);}}
export async function POST(request:Request,context:Context){try{const guard=await commerceGuard(request,true);if(guard.response)return guard.response;const order=await commandOrder(Number((await context.params).id),await request.json(),guard.principal!.userId);return commerceJson({order});}catch(error){return commerceFailure(error);}}

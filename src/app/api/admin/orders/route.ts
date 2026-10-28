import { createOrder, listOrders } from '@/lib/commerce-store';
import { commerceFailure,commerceGuard,commerceJson } from '@/lib/commerce-http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const guard=await commerceGuard(request);if(guard.response)return guard.response;const url=new URL(request.url);const page=Number(url.searchParams.get('page')||1);const leadId=url.searchParams.has('leadId')?Number(url.searchParams.get('leadId')):undefined;return commerceJson(await listOrders({page,leadId}));}catch(error){return commerceFailure(error);}}
export async function POST(request:Request){try{const guard=await commerceGuard(request,true);if(guard.response)return guard.response;const input=await request.json();return commerceJson({order:await createOrder(input,guard.principal!.userId)},201);}catch(error){return commerceFailure(error);}}

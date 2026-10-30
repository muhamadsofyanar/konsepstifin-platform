import { getOperationsService } from '@/lib/operations-store';
import { getDatabaseClient } from '@/lib/article-store';
import { createMootaPaymentForOrder } from '@/lib/moota-store';
import { learningGuard, learningJson, learningFailure } from '@/lib/learning-http';
import { positive } from '@/lib/learning-service';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const g=await learningGuard(request);if(g.response)return g.response;return learningJson({settings:await getOperationsService().settings()});}catch(e){return learningFailure(e);}}
export async function POST(request:Request){
  try {
    const g=await learningGuard(request,true); if(g.response)return g.response;
    const body=await request.json() as Record<string,unknown>; const orderId=positive(body.orderId);
    const sql=getDatabaseClient();
    const [owned]=await sql`SELECT o.id FROM commerce_orders o JOIN learning_purchases p ON p.order_id=o.id WHERE o.id=${orderId} AND p.user_id=${g.principal!.userId} LIMIT 1`;
    if(!owned)return learningJson({message:'Pesanan tidak ditemukan pada akun Anda.'},404);
    const result=await createMootaPaymentForOrder(orderId,g.principal!.userId);
    return learningJson({paymentUrl:result.invoice.paymentUrl,paymentExpiresAt:result.invoice.expiresAt,paymentStatus:result.order.paymentStatus,message:'Link pembayaran Moota siap digunakan.'});
  } catch(e) { return learningFailure(e); }
}

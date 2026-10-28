import { learningGuard, learningJson, learningFailure } from '@/lib/learning-http';
import { getReferralService } from '@/lib/referral-store';
export const dynamic='force-dynamic';
export async function GET(request: Request) {
 try {
  const guard=await learningGuard(request);
  if(guard.response)return guard.response;
  if(!guard.principal!.roles.some(r=>r==='promoter'||r==='affiliate'))return learningJson({message:'Akses mitra diperlukan.'},403);
  return learningJson(await getReferralService().activity(guard.principal!.userId));
 } catch(error){return learningFailure(error);}
}

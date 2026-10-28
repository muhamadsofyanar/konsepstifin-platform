import {getOperationsService} from '@/lib/operations-store';
import {learningGuard,learningJson,learningFailure} from '@/lib/learning-http';
export async function GET(request:Request){try{const g=await learningGuard(request);if(g.response)return g.response;return learningJson({settings:await getOperationsService().settings()});}catch(e){return learningFailure(e);}}

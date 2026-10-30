/** Explicit Node 24 operator command. Invitation output is private; this sends no messages. */
import postgres from 'postgres';
import {pathToFileURL} from 'node:url';
import {NetworkService} from '../src/lib/network-service.ts';
import {NETWORK_BRANCH,NETWORK_CODES,NETWORK_OWNER_EMAIL,sanitizeNetwork} from '../src/lib/network-domain.ts';
const source=`https://apro.stifin.id/api/proGetCab/pro/${NETWORK_BRANCH.code}`;
export async function runNetworkOperation(command,code,service,fetcher=fetch){
 if(command==='import'){
  const response=await fetcher(source,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{accept:'application/json'}});
  if(!response.ok)throw new Error('Official network fetch failed');
  if(Number(response.headers.get('content-length'))>12*1024*1024)throw new Error('Official network response too large');
  const reader=response.body?.getReader();if(!reader)throw new Error('Invalid network response');
  const chunks=[];let length=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>12*1024*1024)throw new Error('Official network response too large');chunks.push(value);}}finally{await reader.cancel();}
  const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  // Whole upstream records never reach persistence; only the fixed allowlisted membership does.
  return service.importNetwork(sanitizeNetwork(body?.data));
 }
 if(command==='invite'){
  if(!NETWORK_CODES.includes(code)||code===NETWORK_BRANCH.managerCode)throw new Error('Use invite with a pending subordinate promoter code');
  const overview=await service.getNetworkOverview();const member=overview.members.find(m=>m.promoterCode===code),owner=overview.members.find(m=>m.isManager&&m.email===NETWORK_OWNER_EMAIL&&m.active);
  if(!member||!owner)throw new Error('Import the verified network before reissuing invitations');
  return {userId:member.userId,promoterCode:member.promoterCode,email:member.email,...await service.issuePromoterInvite(member.userId,owner.userId)};
 }
 throw new Error('Use import or invite CODE');
}
async function main(){
 const [command,code]=process.argv.slice(2);if(!['import','invite'].includes(command))throw new Error('Use import or invite CODE');
 if(!process.env.DATABASE_URL||!process.env.PLATFORM_ORIGIN||process.env.IDENTITY_ADMIN_CONFIRM!=='yes')throw new Error('Set DATABASE_URL, PLATFORM_ORIGIN and IDENTITY_ADMIN_CONFIRM=yes for the intended database');
 const sql=postgres(process.env.DATABASE_URL,{max:1,connect_timeout:10});
 try{
  const query=async(text,args=[])=>[...await sql.unsafe(text,args)];
  const transaction=work=>sql.begin(tx=>work(async(text,args=[])=>[...await tx.unsafe(text,args)]));
  const service=new NetworkService(query,transaction,process.env.PLATFORM_ORIGIN);
  console.log(JSON.stringify(await runNetworkOperation(command,code,service),null,2));
 }finally{await sql.end();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){main().catch(error=>{
 // Driver/upstream exceptions may contain personal data. Never print them.
 const message=error instanceof Error?error.message:'';
 console.error(/^(Use |Set DATABASE_URL|Existing active owner|Active administrator|Invalid platform origin|Invalid network|Official network|Import the verified|Only pending|Promoter mapping conflict|Promoter administrator conflict|Branch identity conflict|Branch membership conflict)/.test(message)?message:'Promoter operation failed. Check connectivity, migrations and identity conflicts.');
 process.exitCode=1;
});}

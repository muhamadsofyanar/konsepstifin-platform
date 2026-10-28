/** Server-side branch membership and one-use invitation service; no browser imports. */
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {hashPassword} from './identity/password.ts';
import {NETWORK_BRANCH,NETWORK_OWNER_EMAIL,validateNetwork} from './network-domain.ts';
import type {NetworkMemberInput} from './network-domain.ts';
export type NetworkQuery=(text:string,args?:(string|number|boolean|null)[])=>Promise<Record<string,unknown>[]>;
export type NetworkTransaction=<T>(work:(query:NetworkQuery)=>Promise<T>)=>Promise<T>;
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const manager=NETWORK_BRANCH.managerCode;
export type NetworkOverview={branch:{code:string;name:string;regencyCode:string;regencyName:string;managerCode:string};members:{userId:string;promoterCode:string;name:string;email:string;area:string;active:boolean;isManager:boolean}[]};
export class NetworkService{
 private query:NetworkQuery;private transaction:NetworkTransaction;private origin:string;
 constructor(query:NetworkQuery,transaction:NetworkTransaction,origin:string){
  const parsed=new URL(origin);if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash)throw new Error('Invalid platform origin');
  if(parsed.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(parsed.hostname))throw new Error('Invalid platform origin');
  this.query=query;this.transaction=transaction;this.origin=parsed.origin;
 }
 private async audit(q:NetworkQuery,actorId:string,action:string,target:string){await q('INSERT INTO platform_admin_audit(actor_id,action,target) VALUES($1,$2,$3)',[actorId,action,target]);}
 private async requireAdmin(q:NetworkQuery,userId:string){const [row]=await q("SELECT u.id FROM platform_users u WHERE u.id=$1 AND u.active=true AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','super_admin'))",[userId]);if(!row)throw new Error('Active administrator required');}
 private async mint(q:NetworkQuery,userId:string){
  await q('UPDATE platform_activation_tokens SET used_at=COALESCE(used_at,now()) WHERE user_id=$1 AND used_at IS NULL',[userId]);
  const token=randomBytes(32).toString('hex');const [row]=await q("INSERT INTO platform_activation_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days') RETURNING expires_at",[digest(token),userId]);
  return {activationUrl:`${this.origin}/akun/aktivasi#token=${token}`,expiresAt:new Date(row.expires_at as string).toISOString()};
 }
 async importNetwork(input:NetworkMemberInput[]){
  const members=validateNetwork(input);
  // Hash random, unrecorded credentials before acquiring database locks.
  const hashes=await Promise.all(members.map(m=>m.promoterCode===manager?null:hashPassword(randomBytes(48).toString('hex'))));
  return this.transaction(async q=>{
   // Branch-row lock serializes imports, with a unique regency constraint for all writers.
   await q(`INSERT INTO platform_branches(code,name,regency_code,regency_name,manager_code) VALUES($1,$2,$3,$4,$5) ON CONFLICT(code) DO NOTHING`,[NETWORK_BRANCH.code,NETWORK_BRANCH.name,NETWORK_BRANCH.regencyCode,NETWORK_BRANCH.regencyName,manager]);
   const [branch]=await q('SELECT * FROM platform_branches WHERE code=$1 FOR UPDATE',[NETWORK_BRANCH.code]);
   if(!branch||branch.regency_code!==NETWORK_BRANCH.regencyCode||branch.manager_code!==manager||branch.regency_name!==NETWORK_BRANCH.regencyName)throw new Error('Branch identity conflict');
   const storedMembers=await q('SELECT a.promoter_code FROM platform_promoter_profiles p JOIN platform_promoter_accounts a ON a.user_id=p.user_id WHERE p.branch_code=$1',[NETWORK_BRANCH.code]);
   const expectedCodes=new Set(members.map(m=>m.promoterCode));
   if(storedMembers.some(m=>!expectedCodes.has(String(m.promoter_code))))throw new Error('Branch membership conflict');
   const [owner]=await q('SELECT id,active FROM platform_users WHERE email=$1 FOR UPDATE',[NETWORK_OWNER_EMAIL]);
   if(!owner)throw new Error('Existing active owner administrator required');
   const ownerId=String(owner.id);await this.requireAdmin(q,ownerId);
   let created=0;const invitations:{userId:string;promoterCode:string;email:string;activationUrl:string;expiresAt:string}[]=[];
   for(const [index,m] of members.entries()){
    const isManager=m.promoterCode===manager,email=isManager?NETWORK_OWNER_EMAIL:m.email;
    const [existing]=await q('SELECT id,active FROM platform_users WHERE email=$1 FOR UPDATE',[email]);
    const userId=existing?String(existing.id):randomUUID();
    const mappings=await q(`SELECT a.user_id,a.promoter_code,p.branch_code FROM platform_promoter_accounts a LEFT JOIN platform_promoter_profiles p ON p.user_id=a.user_id WHERE a.user_id=$1 OR a.promoter_code=$2`,[userId,m.promoterCode]);
    if(mappings.some(a=>a.user_id!==userId||a.promoter_code!==m.promoterCode||(a.branch_code!==null&&a.branch_code!==NETWORK_BRANCH.code)))throw new Error('Promoter mapping conflict');
    const [profile]=await q('SELECT user_id FROM platform_promoter_profiles WHERE user_id=$1',[userId]);
    if(!isManager&&existing){const elevated=await q("SELECT role FROM platform_user_roles WHERE user_id=$1 AND role IN ('admin','super_admin')",[userId]);if(elevated.length)throw new Error('Promoter administrator conflict');}
    if(!existing){await q('INSERT INTO platform_users(id,email,password_hash,active) VALUES($1,$2,$3,false)',[userId,email,hashes[index]!]);created++;}
    await q("INSERT INTO platform_user_roles(user_id,role) VALUES($1,'promoter') ON CONFLICT DO NOTHING",[userId]);
    await q('INSERT INTO platform_promoter_accounts(user_id,promoter_code) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING',[userId,m.promoterCode]);
    await q('INSERT INTO platform_promoter_profiles(user_id,branch_code,name,service_area) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET name=EXCLUDED.name,service_area=EXCLUDED.service_area',[userId,NETWORK_BRANCH.code,m.name,m.area]);
    if(!isManager&&!profile&&(!existing||existing.active!==true))invitations.push({userId,promoterCode:m.promoterCode,email,...await this.mint(q,userId)});
   }
   await this.audit(q,ownerId,'network.import',NETWORK_BRANCH.code);
   return {created,total:members.length,invitations};
  });
 }
 async getNetworkOverview():Promise<NetworkOverview>{
  const rows=await this.query(`SELECT u.id,u.email,u.active,a.promoter_code,p.name,p.service_area FROM platform_promoter_profiles p JOIN platform_users u ON u.id=p.user_id JOIN platform_promoter_accounts a ON a.user_id=p.user_id WHERE p.branch_code=$1 ORDER BY CASE WHEN a.promoter_code=$2 THEN 0 ELSE 1 END,a.promoter_code`,[NETWORK_BRANCH.code,manager]);
  return {branch:NETWORK_BRANCH,members:rows.map(r=>({userId:String(r.id),promoterCode:String(r.promoter_code),name:String(r.name),email:String(r.email),area:String(r.service_area),active:r.active===true,isManager:r.promoter_code===manager}))};
 }
 async getPromoterPortal(userId:string){
  const [r]=await this.query(`SELECT u.id,u.email,a.promoter_code,p.name,p.service_area,b.code,b.name AS branch_name,b.manager_code FROM platform_users u JOIN platform_promoter_profiles p ON p.user_id=u.id JOIN platform_promoter_accounts a ON a.user_id=u.id JOIN platform_branches b ON b.code=p.branch_code WHERE u.id=$1 AND u.active=true AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='promoter')`,[userId]);if(!r)return null;
  const [result]=await this.query(`WITH own AS (SELECT id,name,phone,email,city,status,created_at FROM public_interest_leads WHERE assigned_promoter_code=$1 AND consent_to_share=true), page AS (SELECT id,name,phone,email,city,status FROM own ORDER BY created_at DESC,id DESC LIMIT 100) SELECT (SELECT count(*)::int FROM own) AS total,COALESCE((SELECT json_agg(page) FROM page),'[]'::json) AS leads`,[String(r.promoter_code)]);
  return {profile:{userId:String(r.id),promoterCode:String(r.promoter_code),name:String(r.name),email:String(r.email),area:String(r.service_area),branchCode:String(r.code),branchName:String(r.branch_name),isManager:r.promoter_code===r.manager_code},leads:result.leads as {id:number;name:string;phone:string;email:string;city:string;status:string}[],total:Number(result.total)};
 }
 async issuePromoterInvite(userId:string,actorId:string){return this.transaction(async q=>{
  await this.requireAdmin(q,actorId);
  const [user]=await q(`SELECT u.id FROM platform_users u WHERE u.id=$1 AND u.active=false AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='promoter') AND NOT EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','super_admin')) AND EXISTS(SELECT 1 FROM platform_promoter_profiles p WHERE p.user_id=u.id AND p.branch_code=$2) FOR UPDATE`,[userId,NETWORK_BRANCH.code]);
  if(!user)throw new Error('Only pending promoter accounts can receive invitations');
  const invitation=await this.mint(q,userId);await this.audit(q,actorId,'network.invite',userId);return invitation;
 });}
 async activatePromoter(token:string,password:string){
  if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))throw new Error('Invalid or expired activation');
  // Reject unknown, used, expired and ineligible tokens before paying the scrypt cost.
  const [candidate]=await this.query(`SELECT t.user_id FROM platform_activation_tokens t JOIN platform_users u ON u.id=t.user_id WHERE t.token_hash=$1 AND t.used_at IS NULL AND t.expires_at>now() AND u.active=false AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='promoter') AND NOT EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','super_admin')) AND EXISTS(SELECT 1 FROM platform_promoter_profiles p WHERE p.user_id=u.id)`,[digest(token)]);
  if(!candidate)throw new Error('Invalid or expired activation');
  const passwordHash=await hashPassword(password);
  await this.transaction(async q=>{
   const userId=String(candidate.user_id);
   // Same lock order as session issuance/reset and reissue: user, then tokens.
   const [user]=await q(`SELECT id FROM platform_users WHERE id=$1 AND active=false AND EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=platform_users.id AND r.role='promoter') AND NOT EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=platform_users.id AND r.role IN ('admin','super_admin')) AND EXISTS(SELECT 1 FROM platform_promoter_profiles p WHERE p.user_id=platform_users.id) FOR UPDATE`,[userId]);
   if(!user)throw new Error('Invalid or expired activation');
   const [valid]=await q('SELECT token_hash FROM platform_activation_tokens WHERE token_hash=$1 AND user_id=$2 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[digest(token),userId]);if(!valid)throw new Error('Invalid or expired activation');
   await q('UPDATE platform_users SET password_hash=$1,active=true WHERE id=$2',[passwordHash,userId]);
   await q('UPDATE platform_activation_tokens SET used_at=COALESCE(used_at,now()) WHERE user_id=$1',[userId]);
   await q('UPDATE platform_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE user_id=$1',[userId]);
   await this.audit(q,userId,'network.activate',userId);
  });
 }
}

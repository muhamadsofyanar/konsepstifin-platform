/** Fixed, verified branch identity; service areas do not establish branch territory. */
export const NETWORK_BRANCH = { code:'JML-CAB-62', name:'STIFIn Kabupaten Pekalongan', regencyCode:'33.26', regencyName:'Kabupaten Pekalongan', managerCode:'BKS-HRA-40' } as const;
export const NETWORK_OWNER_EMAIL = 'admin@konsepstifin.com';
export const NETWORK_CODES = ['BKS-HRA-40', ...Array.from({length:10},(_,i)=>`KHU-ABU-${String(i+1).padStart(2,'0')}`)];
export type NetworkMemberInput = {promoterCode:string;name:string;email:string;branchCode:string;area:string};
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function text(value:unknown,max:number){if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error('Invalid network data');return value.trim();}
/** Intentionally constructs a new allowlisted object, discarding all other upstream fields. */
export function sanitizeNetwork(raw:unknown):NetworkMemberInput[]{
 if(!Array.isArray(raw)||raw.length!==11)throw new Error('Invalid network member count');
 return validateNetwork(raw.map(item=>{
  if(!item||typeof item!=='object')throw new Error('Invalid network data');
  const row=item as Record<string,unknown>;
  if(!['1',1,true].includes(row.Aktif as string|number|boolean))throw new Error('Invalid network active status');
  return {promoterCode:text(row.KodeID,80),name:text(row.Nama,200),email:text(row.Email,254).toLowerCase(),branchCode:text(row.Sub,80),area:typeof row.Area==='string'?row.Area.trim().slice(0,300):''};
 }));
}
export function validateNetwork(members:NetworkMemberInput[]):NetworkMemberInput[]{
 if(!Array.isArray(members)||members.length!==11)throw new Error('Invalid network member count');
 const codes=new Set<string>(),emails=new Set<string>();
 for(const m of members){
  if(!m||!NETWORK_CODES.includes(m.promoterCode)||codes.has(m.promoterCode)||m.branchCode!==NETWORK_BRANCH.code
   ||!emailPattern.test(m.email)||m.email.length>254||m.email!==m.email.trim().toLowerCase()||emails.has(m.email)
   ||typeof m.name!=='string'||!m.name.trim()||m.name.length>200||typeof m.area!=='string'||m.area.length>300)throw new Error('Invalid network identity');
  codes.add(m.promoterCode);emails.add(m.email);
  if(m.promoterCode!==NETWORK_BRANCH.managerCode&&m.email===NETWORK_OWNER_EMAIL)throw new Error('Invalid network owner collision');
 }
 if(members.find(m=>m.promoterCode===NETWORK_BRANCH.managerCode)?.name.replace(/\s+/g,' ').toLowerCase()!=='muhamad sofyan ar')throw new Error('Invalid network owner identity');
 return members.map(m=>({promoterCode:m.promoterCode,name:m.name.trim(),email:m.email,branchCode:m.branchCode,area:m.area}));
}

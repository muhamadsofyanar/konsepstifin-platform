import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
const state = vi.hoisted(()=>({sql:null as unknown}));
vi.mock('./article-store',()=>({getDatabaseClient:()=>state.sql}));
import {createInterestLead, initializeInterestSchema, updateLead, getLeadById} from './interest-store';
const db = new PGlite();
function adapter(connection: {query:(text:string,values:unknown[])=>Promise<{rows:unknown[]}>}) {
 const tag = Object.assign(async (strings: TemplateStringsArray, ...values:unknown[])=>{
  const text=strings.reduce((text,part,index)=>text+(index?`$${index}`:'')+part,'');
  return (await connection.query(text,values)).rows;
 },{json:(value:unknown)=>JSON.stringify(value), begin:async<T>(callback:(sql:ReturnType<typeof adapter>)=>Promise<T>):Promise<T>=>db.transaction(async tx=>callback(adapter(tx))),unsafe:async(text:string,values:unknown[]) => (await connection.query(text,values)).rows});
 return tag;
}
let id:number;
beforeAll(async()=>{
 state.sql=adapter(db);
 await initializeInterestSchema();
 const lead=await createInterestLead({idempotencyKey:'123e4567-e89b-42d3-a456-426614174099',interest:{leadType:'test_service',productKey:'tesPersonal',name:'Contact Test',phone:'628123456789',email:'',provinceCode:'32',provinceName:'Jawa Barat',regencyCode:'32.04',regencyName:'Bandung',city:'Bandung',service:'Tes',notes:'',sourcePath:'/',utmSource:'',utmMedium:'',utmCampaign:'',utmContent:'',utmTerm:'',referrer:'',consentToContact:true,consentToShare:true}});
 id=lead.id;
 await db.query("UPDATE public_interest_leads SET sale_amount=650000,payment_status='dibayar',sejoli_order_id='LEGACY' WHERE id=$1",[id]);
});
afterAll(async()=>{await db.close();delete (globalThis as {konsepStifinInterestSchema?:unknown}).konsepStifinInterestSchema;});
it('preserves financial history, audits authenticated actor, and repeated saves are idempotent',async()=>{
 const result=await updateLead(id,{status:'diklaim',internalNotes:'Contacted'},'user-123');
 expect(result.saleAmount).toBe(650000);expect(result.paymentStatus).toBe('dibayar');expect(result.sejoliOrderId).toBe('LEGACY');
 await updateLead(id,{status:'diklaim',internalNotes:'Contacted'},'user-123');
 const rows=(await db.query("SELECT actor,details FROM lead_status_history WHERE event_type='admin_update' AND lead_id=$1",[id])).rows;
 expect(rows).toHaveLength(1);expect((rows[0] as {actor:string}).actor).toBe('user-123');
});
it('rolls contact mutation back when audit insert fails',async()=>{
 await db.exec("ALTER TABLE lead_status_history ADD CONSTRAINT reject_test_audit CHECK(actor<>'reject-actor')");
 await expect(updateLead(id,{status:'selesai',internalNotes:'Should roll back'},'reject-actor')).rejects.toThrow();
 const lead=await getLeadById(id);expect(lead?.status).toBe('diklaim');expect(lead?.internalNotes).toBe('Contacted');
});

it('persists referral source separately and preserves it across admin reassignment',async()=>{
 const source={userId:'00000000-0000-4000-8000-000000000001',promoterCode:'ORIGIN',alias:'budi',name:'Budi',branchCode:'JML-CAB-62',area:''};
 const interest={leadType:'promoter_candidate' as const,productKey:'wsl1',name:'Registration Test',phone:'628123456789',email:'',provinceCode:'',provinceName:'',regencyCode:'',regencyName:'',city:'Sumedang',service:'WSL 1',notes:'',sourcePath:'/',utmSource:'',utmMedium:'',utmCampaign:'',utmContent:'',utmTerm:'',referrer:'',consentToContact:true,consentToShare:true};
 const command={idempotencyKey:'123e4567-e89b-42d3-a456-426614174098',interest,source,match:{assignedPromoterCode:'ORIGIN',matchedPromoterName:'Budi',matchedBranchCode:'JML-CAB-62',matchMethod:'referral' as const}};
 const lead=await createInterestLead(command);expect(lead.assignedPromoterCode).toBe('ORIGIN');expect(lead.sourceReferralAlias).toBe('budi');
 const reassigned=await updateLead(lead.id,{status:'dihubungi',assignedPromoterCode:'NEW'},'admin');expect(reassigned.assignedPromoterCode).toBe('NEW');expect(reassigned.sourcePartnerCode).toBe('ORIGIN');expect(reassigned.sourcePartnerUserId).toBe(source.userId);
 const repeated=await createInterestLead({...command,source:{...source,promoterCode:'ATTEMPT'}});expect(repeated.id).toBe(lead.id);expect(repeated.sourcePartnerCode).toBe('ORIGIN');
});

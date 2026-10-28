import { randomUUID } from 'node:crypto';
import { CommerceError, calculateLines, paymentStatus, validateMoney, type CommerceLine } from './commerce-domain';
export interface CommerceQuery { query(text:string,params?:unknown[]):Promise<Record<string,unknown>[]> }
export interface CommerceDatabase extends CommerceQuery { transaction<T>(fn:(tx:CommerceQuery)=>Promise<T>):Promise<T> }
export type LedgerEntry={id:number;kind:string;amount:number;reversesId:number|null;reason:string;reference:string;actor:string;createdAt:string};
export type CommerceOrder={id:number;number:string;leadId:number|null;customerName:string;customerPhone:string;customerEmail:string;state:string;lines:CommerceLine[];total:number;balance:number;paymentStatus:string;createdAt:string;isSimulation?:boolean;ledger:LedgerEntry[];audit:Record<string,unknown>[]};
export type OrderCommand={action:'issue'|'cancel'|'update'|'receipt'|'refund'|'correction';key:string;lines?:unknown;amount?:unknown;reason?:string;reference?:string;entryId?:number};
function id(value:unknown){ if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1) throw new CommerceError('ID tidak valid.'); return value; }
function text(value:unknown,max:number,label:string){if(typeof value!=='string'||!value.trim()||value.length>max)throw new CommerceError(`${label} wajib diisi (maksimum ${max} karakter).`);return value.trim();}
const date=(v:unknown)=>v instanceof Date?v.toISOString():String(v);
export class CommerceService {
 constructor(private db:CommerceDatabase,private guard?:(tx:CommerceQuery,id:number,input:OrderCommand)=>Promise<void>){}
 async lead(leadId:number){const rows=await this.db.query('SELECT id,name,phone,email FROM public_interest_leads WHERE id=$1',[id(leadId)]);return rows[0]??null;}
 async create(input:{leadId:number;lines:unknown;key:string},actor:string){
  const leadId=id(input.leadId), key=text(input.key,120,'Idempotensi'), snapshot=calculateLines(input.lines), payload=JSON.stringify({leadId,...snapshot}); text(actor,200,'Pelaku');
  const orderId=await this.db.transaction(async tx=>{
   const lead=(await tx.query('SELECT id,name,phone,email FROM public_interest_leads WHERE id=$1',[leadId]))[0];if(!lead)throw new CommerceError('Lead tidak ditemukan.');
   const rows=await tx.query("INSERT INTO commerce_orders(number,lead_id,customer_name,customer_phone,customer_email,lines,total,create_key,create_payload,created_by) VALUES($1,$2,$3,$4,$5,$6::text::jsonb,$7,$8,$9,$10) ON CONFLICT(create_key) DO NOTHING RETURNING id",['KS-'+randomUUID().toUpperCase(),leadId,lead.name,lead.phone,lead.email??'',JSON.stringify(snapshot.lines),snapshot.total,key,payload,actor]);
   if(!rows.length){const previous=(await tx.query('SELECT id,create_payload FROM commerce_orders WHERE create_key=$1',[key]))[0];if(previous.create_payload!==payload)throw new CommerceError('Idempotensi sudah digunakan untuk data berbeda.');return Number(previous.id);}
   const newId=Number(rows[0].id);await tx.query('INSERT INTO commerce_audit(order_id,action,operation_key,payload,actor) VALUES($1,$2,$3,$4,$5)',[newId,'create',key,payload,actor]);return newId;
  });return (await this.get(orderId))!;
 }
 async get(orderId:number):Promise<CommerceOrder|null>{
  return this.db.transaction(async tx=>{
  const row=(await tx.query('SELECT * FROM commerce_orders WHERE id=$1 FOR SHARE',[id(orderId)]))[0];if(!row)return null;
  const ledger=await tx.query('SELECT * FROM commerce_ledger WHERE order_id=$1 ORDER BY id',[orderId]);
  const balance=ledger.reduce((sum,entry)=>sum+Number(entry.amount),0);
  const audit=await tx.query('SELECT action,actor,created_at,payload FROM commerce_audit WHERE order_id=$1 ORDER BY id',[orderId]);
  return {id:Number(row.id),number:String(row.number),leadId:row.lead_id===null?null:Number(row.lead_id),customerName:String(row.customer_name),customerPhone:String(row.customer_phone),customerEmail:String(row.customer_email),state:String(row.state),lines:row.lines as CommerceLine[],total:Number(row.total),balance,paymentStatus:paymentStatus(Number(row.total),balance),createdAt:date(row.created_at),isSimulation:row.is_simulation===true,ledger:ledger.map(e=>({id:Number(e.id),kind:String(e.kind),amount:Number(e.amount),reversesId:e.reverses_id?Number(e.reverses_id):null,reason:String(e.reason),reference:String(e.reference),actor:String(e.actor),createdAt:date(e.created_at)})),audit:audit.map(e=>({...e,created_at:date(e.created_at)}))};
  });
 }
 async command(orderId:number,input:OrderCommand,actor:string){
  id(orderId);text(actor,200,'Pelaku');const key=text(input.key,120,'Idempotensi');
  const payload=JSON.stringify({action:input.action,lines:input.lines,amount:input.amount,reason:input.reason,reference:input.reference,entryId:input.entryId});
  await this.db.transaction(async tx=>{
   const order=(await tx.query('SELECT * FROM commerce_orders WHERE id=$1 FOR UPDATE',[orderId]))[0];if(!order)throw new CommerceError('Pesanan tidak ditemukan.');
   const previous=(await tx.query('SELECT payload FROM commerce_audit WHERE order_id=$1 AND operation_key=$2',[orderId,key]))[0];if(previous){if(previous.payload!==payload)throw new CommerceError('Idempotensi sudah digunakan untuk data berbeda.');return;}
   await this.guard?.(tx,orderId,input);
   const balance=Number((await tx.query('SELECT COALESCE(sum(amount),0) AS balance FROM commerce_ledger WHERE order_id=$1',[orderId]))[0].balance);
   if(input.action==='update'){
    if(order.state!=='draft')throw new CommerceError('Hanya draf yang dapat diubah.');const snapshot=calculateLines(input.lines);await tx.query('UPDATE commerce_orders SET lines=$1::text::jsonb,total=$2,updated_at=now() WHERE id=$3',[JSON.stringify(snapshot.lines),snapshot.total,orderId]);
   }else if(input.action==='issue'){
    if(order.state!=='draft')throw new CommerceError('Hanya draf yang dapat diterbitkan.');await tx.query("UPDATE commerce_orders SET state='issued',updated_at=now() WHERE id=$1",[orderId]);
   }else if(input.action==='cancel'){
    const entries=await tx.query('SELECT id FROM commerce_ledger WHERE order_id=$1 LIMIT 1',[orderId]);if(order.state==='cancelled'||entries.length)throw new CommerceError('Pembatalan hanya untuk pesanan yang belum memiliki transaksi uang.');await tx.query("UPDATE commerce_orders SET state='cancelled',updated_at=now() WHERE id=$1",[orderId]);
   }else if(['receipt','refund','correction'].includes(input.action)){
    if(order.state!=='issued')throw new CommerceError('Terbitkan pesanan sebelum mencatat uang.');const reason=text(input.reason,1000,'Alasan');let amount:number, reverses:number|null=null,reference='';
    if(input.action==='correction'){
     reverses=id(input.entryId);const entry=(await tx.query('SELECT * FROM commerce_ledger WHERE id=$1 AND order_id=$2',[reverses,orderId]))[0];if(!entry||entry.kind==='correction')throw new CommerceError('Entri asal koreksi tidak valid.');if((await tx.query('SELECT id FROM commerce_ledger WHERE reverses_id=$1',[reverses])).length)throw new CommerceError('Entri sudah dikoreksi.');amount=-Number(entry.amount);
    }else{amount=validateMoney(input.amount);if(!amount)throw new CommerceError('Nominal harus lebih dari nol.');if(input.action==='refund')amount=-amount;reference=text(input.reference,200,'Referensi mutasi bank');}
    if(balance+amount<0||balance+amount>Number(order.total))throw new CommerceError('Nominal melebihi saldo pembayaran atau total pesanan.');
    await tx.query('INSERT INTO commerce_ledger(order_id,kind,amount,reverses_id,reason,reference,actor) VALUES($1,$2,$3,$4,$5,$6,$7)',[orderId,input.action,amount,reverses,reason,reference,actor]);
   }else throw new CommerceError('Tindakan tidak valid.');
   await tx.query('INSERT INTO commerce_audit(order_id,action,operation_key,payload,actor) VALUES($1,$2,$3,$4,$5)',[orderId,input.action,key,payload,actor]);
  });return this.get(orderId);
 }
 async list(options:{page?:number;leadId?:number}={}){
  const page=Math.max(1,Math.min(100000,Math.trunc(options.page||1)));const params:unknown[]=[];let where='';if(options.leadId!==undefined){where=' WHERE lead_id=$1';params.push(id(options.leadId));}
  const total=Number((await this.db.query('SELECT count(*) AS count FROM commerce_orders'+where,params))[0].count);
  const rows=await this.db.query('SELECT id FROM commerce_orders'+where+` ORDER BY id DESC LIMIT 25 OFFSET $${params.length+1}`,[...params,(page-1)*25]);
  return {orders:await Promise.all(rows.map(row=>this.get(Number(row.id)))),total,page,pageSize:25};
 }
 async leadOrders(leadId:number){const rows=await this.db.query('SELECT id FROM commerce_orders WHERE lead_id=$1 ORDER BY id DESC',[id(leadId)]);return Promise.all(rows.map(row=>this.get(Number(row.id))));}
 async summary(){const rows=await this.db.query("SELECT count(*) FILTER(WHERE state='issued' AND balance<total) AS awaiting,COALESCE(sum(total-balance) FILTER(WHERE state='issued'),0) AS outstanding,COALESCE(sum(balance),0) AS received FROM (SELECT o.*,COALESCE((SELECT sum(amount) FROM commerce_ledger WHERE order_id=o.id),0) AS balance FROM commerce_orders o WHERE o.is_simulation=false) q");return {awaitingPayment:Number(rows[0].awaiting),outstanding:Number(rows[0].outstanding),received:Number(rows[0].received)};}
}

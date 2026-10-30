import {parseVoucherBalance,VoucherError,type VoucherBalance} from './voucher-domain.ts';
export interface VoucherApi{member(code:string,branch:string):Promise<void>;balance(code:string):Promise<VoucherBalance>;refill(input:{code:string;branch:string;quantity:number;balance:VoucherBalance;reference:string}):Promise<void>}
export class StifinVoucherApi implements VoucherApi{
 private fetcher:typeof fetch;private env:Record<string,string|undefined>;
 constructor(fetcher:typeof fetch=fetch,env:Record<string,string|undefined>=process.env){this.fetcher=fetcher;this.env=env;}
 private async request(path:string,body?:Record<string,string>){
  const base=this.env.STIFIN_API_BASE||'https://apro.stifin.id/api';const url=new URL(base.replace(/\/$/,'')+path);if(url.protocol!=='https:'||url.username||url.password)throw new VoucherError('Konfigurasi API voucher tidak valid.');
  const headers:Record<string,string>={accept:'application/json'};if(body)headers['content-type']='application/json';const header=this.env.STIFIN_API_AUTH_HEADER,value=this.env.STIFIN_API_AUTH_VALUE;if(header&&value&&/^[A-Za-z0-9-]+$/.test(header))headers[header]=value;
  const response=await this.fetcher(url,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(Math.max(5000,Math.min(60000,Number(this.env.STIFIN_API_TIMEOUT_MS)||15000)))});
  if(!response.ok)throw new VoucherError('API voucher tidak tersedia.');const raw=await response.text();if(raw.length>12000000)throw new VoucherError('Respons API voucher terlalu besar.');if(body&&!raw.trim())return null;let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new VoucherError('Format respons API voucher tidak valid.');}
  if(body&&parsed&&typeof parsed==='object'){const result=parsed as Record<string,unknown>;if(result.success===false||result.status===false||['error','failed','failure','gagal'].includes(String(result.status).toLowerCase())||(result.error!==undefined&&result.error!==null&&result.error!==false&&result.error!==''))throw new VoucherError('API voucher menolak pengiriman.');}
  return parsed;
 }
 async member(code:string,branch:string){const body=await this.request('/proGetCab/pro/'+encodeURIComponent(branch));const rows=body&&typeof body==='object'?(body as {data?:unknown}).data:null;if(!Array.isArray(rows)||!rows.some(r=>r&&typeof r==='object'&&r.KodeID===code&&(r.Sub===undefined||r.Sub===branch)&&[1,'1',true].includes(r.Aktif)))throw new VoucherError('Keanggotaan promotor aktif di cabang belum terverifikasi.');}
 async balance(code:string){return{...parseVoucherBalance(await this.request('/voucherGet/getTotVoucher/'+encodeURIComponent(code))),checkedAt:new Date().toISOString()};}
 async refill(input:{code:string;branch:string;quantity:number;balance:VoucherBalance;reference:string}){const user=this.env.STIFIN_VOUCHER_USER_ID;if(!user?.trim())throw new VoucherError('User API voucher belum dikonfigurasi.');await this.request('/voucherPos/editCabVoucher/'+encodeURIComponent(input.branch),{KodeID:input.code,Jumlah:String(input.quantity),JmlFree:'0',SaldoJ:String(input.balance.voucher),SaldoF:String(input.balance.free),Dispos:input.reference,Ket:'Pembelian voucher '+input.reference,UserID:user});}
}

export class VoucherError extends Error {}
export type VoucherMode='test'|'live'|'off';
export type VoucherBalance={voucher:number;free:number;checkedAt:string};
export type VoucherSettings={unitPrice:number;maxQuantity:number;mode:VoucherMode};
export type VoucherOrder={id:number;number:string;quantity:number;unitPrice:number;total:number;balance:number;paymentStatus:string;fulfillmentStatus:string;mode:string;promoterCode:string;promoterName:string;createdAt:string;lastError:string|null;paymentUrl:string|null;paymentExpiresAt:string|null;invoiceStatus:string};
export function voucherMode(value=process.env.STIFIN_VOUCHER_MODE):VoucherMode{if(!value)return 'test';if(['test','live','off'].includes(value))return value as VoucherMode;throw new VoucherError('Konfigurasi mode voucher tidak valid.');}
function integer(value:unknown){if((typeof value!=='number'&&typeof value!=='string')||!/^\d+$/.test(String(value)))throw new VoucherError('Format saldo voucher tidak dikenali.');const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new VoucherError('Format saldo voucher tidak dikenali.');return n;}
/** Only explicit balance keys or an exact two-element legacy payload. Never harvest metadata numbers. */
export function parseVoucherBalance(body:unknown):Omit<VoucherBalance,'checkedAt'>{
 let payload=body;
 if(payload&&typeof payload==='object'&&!Array.isArray(payload)&&'data' in payload)payload=(payload as Record<string,unknown>).data;
 if(Array.isArray(payload)&&payload.length===1&&typeof payload[0]==='object')payload=payload[0];
 if(Array.isArray(payload)){if(payload.length!==2)throw new VoucherError('Format saldo voucher tidak dikenali.');return{free:integer(payload[0]),voucher:integer(payload[1])};}
 if(!payload||typeof payload!=='object')throw new VoucherError('Format saldo voucher tidak dikenali.');
 const vouchers=new Set(['voucher','saldoj','jumlah','jmlvoucher','totvoucher','totvou','totalvoucher','totalv','jmlvou']),frees=new Set(['free','saldof','jmlfree','totfree','totfre','totalfree','totalf']);
 const v=Object.entries(payload).filter(([k])=>vouchers.has(k.toLowerCase().replace(/[^a-z0-9]/g,''))),f=Object.entries(payload).filter(([k])=>frees.has(k.toLowerCase().replace(/[^a-z0-9]/g,'')));
 if(v.length!==1||f.length!==1)throw new VoucherError('Format saldo voucher tidak dikenali.');return{voucher:integer(v[0][1]),free:integer(f[0][1])};
}
export function voucherQuantity(value:unknown,max:number){if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1||value>max)throw new VoucherError(`Jumlah harus bilangan bulat 1–${max}.`);return value;}

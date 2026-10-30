import { randomUUID } from 'node:crypto';
export type OperationQuery = (text: string, args?: (string|number|boolean|null)[]) => Promise<Record<string,unknown>[]>;
export type OperationTransaction = <T>(work: (query: OperationQuery) => Promise<T>) => Promise<T>;
export type PaymentSettings = {bankName:string; accountNumber:string; accountHolder:string; instructions:string};
export type AdminAccount = {id:string;email:string;active:boolean;roles:string[];createdAt:string};
const passwordPattern=/^scrypt\$32768\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/;
function text(value:unknown,max:number){if(typeof value!=='string'||value.length>max)throw new Error('Isian tidak valid atau terlalu panjang.');return value.trim();}
function settingsInput(input:Partial<PaymentSettings>):PaymentSettings{
 const value={bankName:text(input.bankName,80),accountNumber:text(input.accountNumber,60),accountHolder:text(input.accountHolder,120),instructions:text(input.instructions,1500)};
 if(value.accountNumber&&!/^[0-9 -]+$/.test(value.accountNumber))throw new Error('Nomor rekening hanya berisi angka, spasi, atau tanda hubung.');
 if((value.bankName||value.accountNumber||value.accountHolder)&&!(value.bankName&&value.accountNumber&&value.accountHolder))throw new Error('Lengkapi bank, nomor rekening, dan nama pemilik.');
 return value;
}
export class OperationsService {
 constructor(private query:OperationQuery,private transaction:OperationTransaction){}
 private async authorize(query:OperationQuery,actor:string){
  // The settings row is a cross-instance mutex for administrative account changes.
  await query('SELECT id FROM platform_settings WHERE id=1 FOR UPDATE');
  const rows=await query("SELECT r.role FROM platform_users u JOIN platform_user_roles r ON r.user_id=u.id WHERE u.id=$1 AND u.active=true AND r.role IN ('admin','super_admin')",[actor]);
  if(!rows.length)throw new Error('Akses ditolak.');return rows.map(r=>String(r.role));
 }
 private async audit(query:OperationQuery,actor:string,action:string,target:string,details:object={}){
  await query('INSERT INTO platform_admin_audit(actor_id,action,target,details) VALUES($1,$2,$3,$4::text::jsonb)',[actor,action,target,JSON.stringify(details)]);
 }
 async settings():Promise<PaymentSettings>{const [row]=await this.query('SELECT bank_name,account_number,account_holder,instructions FROM platform_settings WHERE id=1');if(!row)throw new Error('Migrasi pengaturan belum dijalankan.');return{bankName:String(row.bank_name),accountNumber:String(row.account_number),accountHolder:String(row.account_holder),instructions:String(row.instructions)};}
 async saveSettings(actor:string,input:Partial<PaymentSettings>){const value=settingsInput(input);return this.transaction(async query=>{await this.authorize(query,actor);await query('UPDATE platform_settings SET bank_name=$1,account_number=$2,account_holder=$3,instructions=$4,updated_at=now() WHERE id=1',[value.bankName,value.accountNumber,value.accountHolder,value.instructions]);await this.audit(query,actor,'settings.updated','payment');return value;});}
 async accounts():Promise<AdminAccount[]>{const rows=await this.query("SELECT u.id,u.email,u.active,u.created_at,json_agg(r.role ORDER BY r.role) AS roles FROM platform_users u JOIN platform_user_roles r ON r.user_id=u.id GROUP BY u.id HAVING bool_or(r.role IN ('admin','super_admin')) ORDER BY u.created_at,u.id");return rows.map(r=>({id:String(r.id),email:String(r.email),active:r.active===true,roles:r.roles as string[],createdAt:new Date(r.created_at as string).toISOString()}));}
 async createAdmin(actor:string,email:string,passwordHash:string){email=text(email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!passwordPattern.test(passwordHash))throw new Error('Email atau kata sandi tidak valid.');return this.transaction(async query=>{await this.authorize(query,actor);const id=randomUUID();await query('INSERT INTO platform_users(id,email,password_hash) VALUES($1,$2,$3)',[id,email,passwordHash]);await query("INSERT INTO platform_user_roles(user_id,role) VALUES($1,'admin')",[id]);await this.audit(query,actor,'account.created',id);return id;});}
 async updateAccount(actor:string,id:string,change:{active?:boolean;passwordHash?:string}){
  if((change.active!==undefined&&typeof change.active!=='boolean')||(change.passwordHash!==undefined&&!passwordPattern.test(change.passwordHash))||(change.active===undefined&&change.passwordHash===undefined))throw new Error('Perubahan akun tidak valid.');
  return this.transaction(async query=>{
   const actorRoles=await this.authorize(query,actor);
   const target=await query("SELECT u.id,u.active,r.role FROM platform_users u JOIN platform_user_roles r ON r.user_id=u.id WHERE u.id=$1 AND r.role IN ('admin','super_admin')",[id]);
   if(!target.length)throw new Error('Akun admin tidak ditemukan.');
   if(target.some(r=>r.role==='super_admin')&&!actorRoles.includes('super_admin'))throw new Error('Akun pemilik hanya dapat diubah oleh pemilik.');
   if(change.active===false&&target[0].active===true){const [{total}]=await query("SELECT count(DISTINCT u.id)::int AS total FROM platform_users u JOIN platform_user_roles r ON r.user_id=u.id WHERE u.active=true AND r.role IN ('admin','super_admin')");if(Number(total)<=1)throw new Error('Minimal satu admin aktif harus tersedia.');}
   if(change.active!==undefined)await query('UPDATE platform_users SET active=$1 WHERE id=$2',[change.active,id]);
   if(change.passwordHash)await query('UPDATE platform_users SET password_hash=$1 WHERE id=$2',[change.passwordHash,id]);
   if(change.active===false||change.passwordHash)await query('UPDATE platform_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE user_id=$1',[id]);
   await this.audit(query,actor,'account.updated',id,{...(change.active!==undefined?{active:change.active}:{}),passwordReset:Boolean(change.passwordHash)});
  });
 }
 async recentAudit(){return this.query('SELECT a.id,a.action,a.target,a.created_at,u.email FROM platform_admin_audit a JOIN platform_users u ON u.id=a.actor_id ORDER BY a.created_at DESC,a.id DESC LIMIT 20');}
}

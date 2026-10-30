import type { Principal } from './identity/access-policy';
export type ChatRow = Record<string, unknown>;
export type ChatDatabase = {
 query(text: string, values?: unknown[]): Promise<ChatRow[]>;
 transaction<T>(fn: (database: ChatDatabase) => Promise<T>): Promise<T>;
};
export type ChatMessage = { id: string; sender_id: string; sender_kind: 'admin'|'member'; body: string; created_at: string };
export class ChatError extends Error { constructor(message:string, public status=400){super(message);} }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const messageRow=(r:ChatRow):ChatMessage=>({id:String(r.id),sender_id:String(r.sender_id),sender_kind:r.sender_kind as 'admin'|'member',body:String(r.body),created_at:new Date(String(r.created_at)).toISOString()});
function cursor(value: string|undefined) { if(value!==undefined&&!/^[1-9][0-9]{0,17}$/.test(value)) throw new ChatError('ID pesan tidak valid.'); return value; }
export class DashboardChatService {
 constructor(private db:ChatDatabase){}
 private async authorize(principal:Principal, q=this.db){
  if(!principal?.active||!principal.sessionValid||!uuid.test(principal.userId))throw new ChatError('Akses akun tidak tersedia.',401);
  const [user]=await q.query(`SELECT u.id,EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','super_admin')) AS admin FROM platform_users u WHERE u.id=$1 AND u.active=true`,[principal.userId]);
  if(!user)throw new ChatError('Akses akun tidak tersedia.',401);
  const admin=principal.roles.some(r=>r==='admin'||r==='super_admin');
  if(admin&&!user.admin)throw new ChatError('Akses admin ditolak.',403);
  return admin&&user.admin===true;
 }
 private async target(principal:Principal, memberId:string, q=this.db){
  const admin=await this.authorize(principal,q);
  if(!uuid.test(memberId))throw new ChatError('ID akun tidak valid.');
  if(!admin&&principal.userId!==memberId)throw new ChatError('Akses percakapan ditolak.',403);
  const [member]=await q.query(`SELECT id FROM platform_users u WHERE u.id=$1 AND u.active=true AND NOT EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','super_admin'))`,[memberId]);
  if(!member)throw new ChatError('Akun tujuan tidak tersedia.',404);
  return admin;
 }
 async accounts(principal:Principal, search:string){
  if(!await this.authorize(principal))throw new ChatError('Akses admin diperlukan.',403);
  const q=search.trim().slice(0,120);
  return this.db.query(`SELECT u.id AS user_id,u.email,COALESCE(p.display_name,'') AS display_name,COALESCE(p.whatsapp_phone,'') AS whatsapp_phone,
   EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role='promoter') AS promoter,
   t.updated_at,(SELECT m.body FROM dashboard_chat_messages m WHERE m.thread_id=t.id ORDER BY m.id DESC LIMIT 1) AS last_message,
   (SELECT count(*)::int FROM dashboard_chat_messages m WHERE m.thread_id=t.id AND m.sender_kind='member' AND m.id>t.admin_read_id) AS unread
   FROM platform_users u LEFT JOIN platform_contact_profiles p ON p.user_id=u.id LEFT JOIN dashboard_chat_threads t ON t.member_id=u.id
   WHERE u.active=true AND NOT EXISTS(SELECT 1 FROM platform_user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','super_admin'))
    AND ($1='' OR u.email ILIKE '%'||$1||'%' OR p.display_name ILIKE '%'||$1||'%' OR p.whatsapp_phone ILIKE '%'||$1||'%')
   ORDER BY t.updated_at DESC NULLS LAST,u.email,u.id LIMIT 100`,[q]);
 }
 async messages(principal:Principal,memberId:string, options:{after?:string;before?:string}={}){
  await this.target(principal,memberId);
  const after=cursor(options.after),before=cursor(options.before);
  if(after&&before)throw new ChatError('Gunakan satu arah riwayat pesan.');
  const rows=await this.db.query(`SELECT * FROM (SELECT m.id::text,m.sender_id,m.sender_kind,m.body,m.created_at FROM dashboard_chat_messages m
   JOIN dashboard_chat_threads t ON t.id=m.thread_id WHERE t.member_id=$1 AND ($2::bigint IS NULL OR m.id>$2::bigint) AND ($3::bigint IS NULL OR m.id<$3::bigint)
   ORDER BY ${after?'m.id ASC':'m.id DESC'} LIMIT 100) page ORDER BY id::bigint ASC`,[memberId,after??null,before??null]);
  return rows.map(messageRow);
 }
 async send(principal:Principal,memberId:string,raw:string,clientKey:string){
  if(typeof raw!=='string'||!raw.trim()||raw.length>4000)throw new ChatError('Pesan wajib diisi, maksimal 4000 karakter.');
  if(!uuid.test(clientKey))throw new ChatError('Kunci pengiriman tidak valid.');
  const body=raw.trim();
  return this.db.transaction(async q=>{
   const admin=await this.target(principal,memberId,q);
   await q.query(`INSERT INTO dashboard_chat_threads(member_id) VALUES($1) ON CONFLICT(member_id) DO NOTHING`,[memberId]);
   const [thread]=await q.query('SELECT id FROM dashboard_chat_threads WHERE member_id=$1 FOR UPDATE',[memberId]);
   const [old]=await q.query('SELECT id::text,thread_id,sender_id,sender_kind,body,created_at FROM dashboard_chat_messages WHERE sender_id=$1 AND client_key=$2',[principal.userId,clientKey]);
   if(old){ if(String(old.thread_id)!==String(thread.id)||old.body!==body)throw new ChatError('Kunci pengiriman sudah dipakai untuk pesan lain.'); return messageRow(old); }
   const [message]=await q.query(`INSERT INTO dashboard_chat_messages(thread_id,sender_id,sender_kind,body,client_key) VALUES($1,$2,$3,$4,$5) RETURNING id::text,sender_id,sender_kind,body,created_at`,[thread.id,principal.userId,admin?'admin':'member',body,clientKey]);
   await q.query('UPDATE dashboard_chat_threads SET updated_at=now() WHERE id=$1',[thread.id]);
   return messageRow(message);
  });
 }
 async markRead(principal:Principal,memberId:string,lastId:string){
  cursor(lastId);
  const admin=await this.target(principal,memberId);
  const result=await this.db.query(`UPDATE dashboard_chat_threads t SET ${admin?'admin_read_id':'member_read_id'}=GREATEST(${admin?'admin_read_id':'member_read_id'},$2::bigint)
   WHERE t.member_id=$1 AND EXISTS(SELECT 1 FROM dashboard_chat_messages m WHERE m.thread_id=t.id AND m.id=$2::bigint) RETURNING t.id`,[memberId,lastId]);
  if(!result.length)throw new ChatError('Pesan tidak ditemukan.');
  return {ok:true};
 }
 async summary(principal:Principal){
  const admin=await this.authorize(principal);
  const [row]=await this.db.query(`SELECT count(*)::int AS unread FROM dashboard_chat_messages m JOIN dashboard_chat_threads t ON t.id=m.thread_id
   JOIN platform_users u ON u.id=t.member_id AND u.active=true WHERE ${admin?"m.sender_kind='member' AND m.id>t.admin_read_id":"t.member_id=$1 AND m.sender_kind='admin' AND m.id>t.member_read_id"}`,admin?[]:[principal.userId]);
  return {unread:Number(row.unread)};
 }
 async contact(principal:Principal){
  await this.authorize(principal);
  const [row]=await this.db.query(`SELECT u.email,COALESCE(p.display_name,'') AS display_name,COALESCE(p.whatsapp_phone,'') AS whatsapp_phone FROM platform_users u LEFT JOIN platform_contact_profiles p ON p.user_id=u.id WHERE u.id=$1`,[principal.userId]);
  return row;
 }
 async saveContact(principal:Principal,input:{displayName:unknown;whatsappPhone:unknown}){
  await this.authorize(principal);
  if(typeof input.displayName!=='string'||input.displayName.length>120)throw new ChatError('Nama maksimal 120 karakter.');
  if(typeof input.whatsappPhone!=='string'||input.whatsappPhone.length>40)throw new ChatError('Nomor WhatsApp tidak valid.');
  const raw=input.whatsappPhone.trim();
  if(raw&&!/^\+?[\d\s().-]+$/.test(raw))throw new ChatError('Nomor WhatsApp tidak valid.');
  let phone=raw.replace(/\D/g,''); if(phone.startsWith('0'))phone='62'+phone.slice(1);
  if(raw&&!/^[1-9]\d{7,14}$/.test(phone))throw new ChatError('Nomor WhatsApp tidak valid.');
  await this.db.query(`INSERT INTO platform_contact_profiles(user_id,display_name,whatsapp_phone) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET display_name=$2,whatsapp_phone=$3,updated_at=now()`,[principal.userId,input.displayName.trim(),phone]);
  return this.contact(principal);
 }
}

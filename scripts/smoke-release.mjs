/** Synthetic-only HTTP smoke test of packaged Next standalone and operator commands. */
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {cp,mkdir,mkdtemp,rm,readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
const app=process.cwd(),image=await mkdtemp(path.join(tmpdir(),'konsep-smoke-'));
const freePort=await new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const db=await PGlite.create(),socket=new PGLiteSocketServer({db,port:0,host:'127.0.0.1',maxConnections:20});await socket.start();
const origin='http://127.0.0.1:'+freePort;
const env={...process.env,DATABASE_URL:'postgresql://postgres:postgres@'+socket.getServerConn()+'/postgres',PLATFORM_ORIGIN:origin,PORT:String(freePort),HOSTNAME:'127.0.0.1',NODE_ENV:'production',STIFIN_PROMOTER_MODE:'manual',STIFIN_PROMOTERS_JSON:'[]',IDENTITY_ADMIN_CONFIRM:'yes'};
const logs=createWriteStream(path.join(image,'smoke.log'));
function command(args,input){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:image,env,stdio:['pipe','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>logs.write(d));child.on('exit',code=>code===0?resolve(output):reject(new Error('Operator command failed: '+args.join(' '))));child.stdin.end(input||'');});}
let server;
const check=(v,message)=>{if(!v)throw new Error(message);};
try{
 await cp(app+'/.next/standalone',image,{recursive:true});await cp(app+'/public',image+'/public',{recursive:true});await mkdir(image+'/.next',{recursive:true});await cp(app+'/.next/static',image+'/.next/static',{recursive:true});await cp(app+'/scripts',image+'/scripts',{recursive:true});await mkdir(image+'/src/lib',{recursive:true});await cp(app+'/src/lib/identity',image+'/src/lib/identity',{recursive:true});await cp(app+'/node_modules/postgres',image+'/node_modules/postgres',{recursive:true});
 await command(['scripts/identity-admin.mjs','migrate']);
 const credentials={email:'qa@example.test',password:'SyntheticOnly-'+randomUUID(),roles:['super_admin']};
 await command(['scripts/identity-admin.mjs','provision'],JSON.stringify(credentials));
 await command(['scripts/identity-admin.mjs','verify'],JSON.stringify(credentials));
 server=spawn(process.execPath,['server.js'],{cwd:image,env,stdio:['ignore','pipe','pipe']});server.stdout.pipe(logs,{end:false});server.stderr.pipe(logs,{end:false});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}check(ready,'Standalone server not ready');
 const cross=await fetch(origin+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.test'},body:JSON.stringify(credentials)});check(cross.status===403,'Cross-origin mutation was not blocked');
 const login=await fetch(origin+'/api/admin/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(credentials)});check(login.ok,'Synthetic login failed: '+login.status+' '+await login.text());const cookie=login.headers.get('set-cookie')?.split(';')[0];check(Boolean(cookie),'Missing session cookie');
 const api=async(endpoint,method,body)=>{const result=await fetch(origin+endpoint,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const json=await result.json();if(!result.ok)throw new Error(endpoint+' HTTP '+result.status);return json;};
 const privatePage=async(endpoint,heading)=>{const response=await fetch(origin+endpoint,{headers:{Cookie:cookie},redirect:'manual'});const html=await response.text();check(response.status===200&&html.includes(heading),endpoint+' SSR failed');return html;};
 await privatePage('/admin','Ringkasan hari ini');
 await api('/api/admin/settings','PUT',{bankName:'Bank Uji',accountNumber:'123456',accountHolder:'Akun Sintetis',instructions:'Periksa mutasi sebelum verifikasi.'});
 const lead=await api('/api/admin/leads','POST',{group:'prospect',name:'Klien Uji',phone:'081234567899',email:'client@example.test',city:'Bandung',service:'Tes STIFIn Personal',consentToContact:true,consentToShare:true,idempotencyKey:randomUUID()});check(Boolean(lead.lead?.id),'Missing saved CRM lead');
 const created=await api('/api/admin/orders','POST',{leadId:lead.lead.id,lines:[{name:'Tes STIFIn Personal',unitPrice:650000,quantity:1}],key:randomUUID()});const id=created.order.id;
 await api('/api/admin/orders/'+id,'POST',{action:'update',lines:[{name:'Tes STIFIn Personal',unitPrice:650000,quantity:1}],key:randomUUID()});await api('/api/admin/orders/'+id,'POST',{action:'issue',key:randomUUID()});
 const receipt={action:'receipt',amount:650000,reason:'Mutasi sintetis terverifikasi',reference:'QA-ONLY',key:randomUUID()};await api('/api/admin/orders/'+id,'POST',receipt);const repeated=await api('/api/admin/orders/'+id,'POST',receipt);check(repeated.order.balance===650000&&repeated.order.ledger.length===1,'Duplicate payment counted');
 const invoice=await privatePage('/admin/pesanan/'+id,'Rincian pesanan');check(invoice.includes('123456'),'Missing transfer details');
 await privatePage('/admin/leads?leadId='+lead.lead.id,'Klien &amp; Promotor');await privatePage('/admin/pengaturan','Atur operasional platform');await privatePage('/admin/konten','Kelola materi dan penawaran');
 await api('/api/admin/logout','POST',{});check((await fetch(origin+'/api/admin/orders',{headers:{Cookie:cookie}})).status===401,'Revoked session still accepted');
 console.log('PASS: standalone operators, login, CSRF, settings, CRM, order edit/issue, receipt dedupe, private SSR pages, logout.');
 console.log('Synthetic PostgreSQL wire server only; does not use DATABASE_URL supplied by your environment. No Docker/browser/real PostgreSQL concurrency claim.');
}catch(error){console.error(error instanceof Error?error.message:'Smoke test failed');console.error((await readFile(path.join(image,'smoke.log'),'utf8')).slice(-5000));process.exitCode=1;}
finally{if(server){server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}await socket.stop();await new Promise(resolve=>setTimeout(resolve,100));await db.close();await new Promise(resolve=>logs.end(resolve));await rm(image,{recursive:true,force:true});}

/** Synthetic-only HTTP smoke test of packaged Next standalone and operator commands. */
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {cp,mkdir,mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
const app=process.cwd(),image=await mkdtemp(path.join(tmpdir(),'konsep-smoke-'));
const freePort=await new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const db=await PGlite.create(),socket=new PGLiteSocketServer({db,port:0,host:'127.0.0.1',maxConnections:20});await socket.start();
const origin='http://127.0.0.1:'+freePort;
const env={...process.env,LEARNING_STORAGE_PATH:image+'/storage/learning',DATABASE_URL:'postgresql://postgres:postgres@'+socket.getServerConn()+'/postgres',PLATFORM_ORIGIN:origin,PORT:String(freePort),HOSTNAME:'127.0.0.1',NODE_ENV:'production',STIFIN_PROMOTER_MODE:'manual',STIFIN_PROMOTERS_JSON:'[]',IDENTITY_ADMIN_CONFIRM:'yes',STIFIN_VOUCHER_MODE:'test',STIFIN_VOUCHER_USER_ID:'synthetic-only'};
const logs=createWriteStream(path.join(image,'smoke.log'));
function command(args,input){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:image,env,stdio:['pipe','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>logs.write(d));child.on('exit',code=>code===0?resolve(output):reject(new Error('Operator command failed: '+args.join(' '))));child.stdin.end(input||'');});}
let server;
const check=(v,message)=>{if(!v)throw new Error(message);};
try{
 await cp(app+'/.next/standalone',image,{recursive:true});await cp(app+'/public',image+'/public',{recursive:true});await mkdir(image+'/.next',{recursive:true});await cp(app+'/.next/static',image+'/.next/static',{recursive:true});await cp(app+'/scripts',image+'/scripts',{recursive:true});await mkdir(image+'/src/lib',{recursive:true});await cp(app+'/src/lib/identity',image+'/src/lib/identity',{recursive:true});await cp(app+'/node_modules/postgres',image+'/node_modules/postgres',{recursive:true});
 await command(['scripts/identity-admin.mjs','migrate']);
 for(const file of ['network-domain.ts','network-service.ts','voucher-domain.ts','voucher-api.ts','voucher-service.ts','learning-service.ts','slug.ts'])await cp(app+'/src/lib/'+file,image+'/src/lib/'+file);
 const credentials={email:'admin@konsepstifin.com',password:'SyntheticOnly-'+randomUUID(),roles:['super_admin']};
 await command(['scripts/identity-admin.mjs','provision'],JSON.stringify(credentials));
 await command(['scripts/identity-admin.mjs','verify'],JSON.stringify(credentials));
 // Run the packaged operator's exact validation/import path with a synthetic-only fetcher.
 // The production command itself always uses its fixed official HTTPS endpoint.
 const importCode=`
  import postgres from 'postgres';
  import {NetworkService} from './src/lib/network-service.ts';
  import {runNetworkOperation} from './scripts/promoter-admin.mjs';
  const sql=postgres(process.env.DATABASE_URL,{max:1});
  try{
   const query=async(t,a=[])=>[...await sql.unsafe(t,a)];
   const transaction=work=>sql.begin(tx=>work(async(t,a=[])=>[...await tx.unsafe(t,a)]));
   const service=new NetworkService(query,transaction,process.env.PLATFORM_ORIGIN);
   const row=(code,name,email)=>({KodeID:code,Nama:name,Email:email,Sub:'JML-CAB-62',Area:'Synthetic Area',Aktif:'1'});
   const data=[row('BKS-HRA-40','Muhamad Sofyan AR','owner-registry@example.test'),...Array.from({length:10},(_,i)=>row('KHU-ABU-'+String(i+1).padStart(2,'0'),'Synthetic Promoter '+i,'promoter'+i+'@example.test'))];
   const fetcher=async()=>new Response(JSON.stringify({data}));
   const first=await runNetworkOperation('import',null,service,fetcher);
   const second=await runNetworkOperation('import',null,service,fetcher);
   if(second.created!==0||second.invitations.length!==0)throw new Error('Import is not idempotent');
   console.log(JSON.stringify(first));
  }finally{await sql.end();}
 `;
 const network=JSON.parse(await command(['--input-type=module','-e',importCode]));
 check(network.created===10&&network.total===11&&network.invitations.length===10,'Incorrect network import');
 // All official voucher reads are synthetic. Any refill POST fails this smoke test.
 await writeFile(image+'/smoke-api.mjs',`
 const original=globalThis.fetch;
 globalThis.fetch=async(input,init)=>{
  const url=new URL(String(input));
  if(url.hostname!=='apro.stifin.id')return original(input,init);
  if(init?.method==='POST')throw new Error('Real refill forbidden in smoke');
  if(url.pathname.includes('/proGetCab/pro/'))return new Response(JSON.stringify({data:[{KodeID:'BKS-HRA-40',Sub:'JML-CAB-62',Aktif:'1'},...Array.from({length:10},(_,i)=>({KodeID:'KHU-ABU-'+String(i+1).padStart(2,'0'),Sub:'JML-CAB-62',Aktif:'1'}))]}));
  if(url.pathname.includes('/voucherGet/getTotVoucher/'))return new Response(JSON.stringify({Pesan:'OK',totalF:2,totalV:3}));
  throw new Error('Unexpected external request');
 };
 `);
 env.NODE_OPTIONS=(process.env.NODE_OPTIONS?process.env.NODE_OPTIONS+' ':'')+'--import '+image+'/smoke-api.mjs';
 server=spawn(process.execPath,['scripts/start-with-worker.mjs'],{cwd:image,env,stdio:['ignore','pipe','pipe']});server.stdout.pipe(logs,{end:false});server.stderr.pipe(logs,{end:false});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}check(ready,'Standalone server not ready');
 const cross=await fetch(origin+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.test'},body:JSON.stringify(credentials)});check(cross.status===403,'Cross-origin mutation was not blocked');
 const login=await fetch(origin+'/api/admin/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(credentials)});check(login.ok,'Synthetic login failed: '+login.status+' '+await login.text());const cookie=login.headers.get('set-cookie')?.split(';')[0];check(Boolean(cookie),'Missing session cookie');
 const api=async(endpoint,method,body)=>{const result=await fetch(origin+endpoint,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const json=await result.json();if(!result.ok)throw new Error(endpoint+' HTTP '+result.status);return json;};
 const privatePage=async(endpoint,heading)=>{const response=await fetch(origin+endpoint,{headers:{Cookie:cookie},redirect:'manual'});const html=await response.text();check(response.status===200&&html.includes(heading),endpoint+' SSR failed');return html;};
 await privatePage('/admin','Ringkasan hari ini');
 await privatePage('/admin/jaringan','Akun promotor cabang');
 const overview=await api('/api/admin/network','GET');check(overview.members.length===11&&overview.members.filter(m=>m.isManager).length===1,'Incorrect branch membership');
 const invite=network.invitations[0],token=new URLSearchParams(new URL(invite.activationUrl).hash.slice(1)).get('token');
 const activationPage=await fetch(origin+'/akun/aktivasi');check(activationPage.headers.get('Content-Security-Policy')?.includes("connect-src 'self'"),'Activation CSP missing');
 const promoterPassword='Synthetic-Promoter-'+randomUUID();
 const activate=()=>fetch(origin+'/api/account/activate',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token,password:promoterPassword})});
 check((await activate()).status===200,'Promoter activation failed');check((await activate()).status===400,'Activation token reused');
 const promoterLogin=await fetch(origin+'/api/account/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:invite.email,password:promoterPassword})});check(promoterLogin.ok,'Promoter login failed');
 const promoterCookie=promoterLogin.headers.get('set-cookie')?.split(';')[0];check(Boolean(promoterCookie),'Promoter cookie missing');
 check((await fetch(origin+'/api/admin/network',{headers:{Cookie:promoterCookie}})).status===401,'Promoter can read admin network');
 await api('/api/admin/settings','PUT',{bankName:'Bank Uji',accountNumber:'123456',accountHolder:'Akun Sintetis',instructions:'Periksa mutasi sebelum verifikasi.'});
 const lead=await api('/api/admin/leads','POST',{group:'prospect',name:'Klien Uji',phone:'081234567899',email:'client@example.test',city:'Bandung',service:'Tes STIFIn Personal',consentToContact:true,consentToShare:true,idempotencyKey:randomUUID()});check(Boolean(lead.lead?.id),'Missing saved CRM lead');
 await db.query('UPDATE public_interest_leads SET assigned_promoter_code=$1 WHERE id=$2',[invite.promoterCode,lead.lead.id]);
 const ownLeads=await fetch(origin+'/api/account/leads',{headers:{Cookie:promoterCookie}});const scoped=await ownLeads.json();check(scoped.total===1&&scoped.items.length===1,'Promoter scoped leads incorrect');
 const promoterPage=await fetch(origin+'/akun',{headers:{Cookie:promoterCookie}});const portalHtml=await promoterPage.text();check(promoterPage.status===200&&portalHtml.includes('Synthetic Promoter 0')&&portalHtml.includes('Klien Uji'),'Promoter portal SSR incorrect');
 const partnerApi=async(endpoint,method='GET',body)=>{const response=await fetch(origin+endpoint,{method,headers:{Cookie:promoterCookie,Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const json=await response.json();check(response.ok,endpoint+' partner HTTP '+response.status+' '+JSON.stringify(json));return json;};
 await partnerApi('/api/account/referral','PATCH',{alias:'synthetic-partner'});
 const ref=await fetch(origin+'/r/synthetic-partner',{redirect:'manual'});check(ref.status===302&&ref.headers.get('set-cookie'),'Referral visit failed');
 const oldRef=await fetch(origin+'/r/'+invite.promoterCode.toLowerCase(),{redirect:'manual'});check(oldRef.status===302&&oldRef.headers.get('set-cookie'),'Historical alias failed');
 const refCookie=ref.headers.get('set-cookie').split(';')[0];
 const publicReferral=await fetch(origin+'/api/interests',{method:'POST',headers:{'Content-Type':'application/json',Cookie:refCookie},body:JSON.stringify({name:'Referral Smoke',phone:'081234567800',email:'referral@example.test',city:'Bandung',service:'Informasi Promotor',productKey:'bantuanPromotor',sourcePath:'/',leadType:'promoter_candidate',consentToContact:true,consentToShare:true,idempotencyKey:randomUUID(),startedAt:Date.now()-3000})});
 check(publicReferral.ok,'Public referral registration failed '+publicReferral.status+' '+await publicReferral.text());
 const source=(await db.query("SELECT assigned_promoter_code,source_partner_code,source_referral_alias FROM public_interest_leads WHERE name='Referral Smoke'")).rows[0];check(source?.source_partner_code===invite.promoterCode&&source.assigned_promoter_code===invite.promoterCode&&source.source_referral_alias==='synthetic-partner','Referral attribution lost');
 const ownBalance=await partnerApi('/api/account/vouchers/balance');check(ownBalance.voucher===3&&ownBalance.free===2,'Official balance DTO incorrect');
 const voucherKey=randomUUID();const purchase=await partnerApi('/api/account/vouchers','POST',{quantity:2,key:voucherKey});const voucherId=purchase.order.id;check(purchase.order.total===330000&&purchase.order.mode==='test','Voucher checkout snapshot incorrect');
 const duplicate=await partnerApi('/api/account/vouchers','POST',{quantity:2,key:voucherKey});check(duplicate.order.id===voucherId,'Duplicate voucher order');
 check((await fetch(origin+'/api/account/vouchers/'+voucherId,{headers:{Cookie:cookie}})).status===404,'Other promoter could read voucher order');
 await api('/api/admin/orders/'+voucherId,'POST',{action:'receipt',amount:330000,reason:'Synthetic verified transfer',reference:'SMOKE-VOUCHER',key:randomUUID()});
 const fulfilled=await partnerApi('/api/account/vouchers/'+voucherId);check(fulfilled.order.fulfillmentStatus==='test_success','Test voucher fulfillment missing');
 // Simulate a payment committed before the request process crashed: only the worker may pick it up.
 const queued=(await partnerApi('/api/account/vouchers','POST',{quantity:3,key:randomUUID()})).order;
 await db.query("INSERT INTO commerce_ledger(order_id,kind,amount,reason,reference,actor) VALUES($1,'receipt',$2,'Synthetic recovery payment','WORKER-ONLY','smoke')",[queued.id,queued.total]);
 let recovered=false;for(let i=0;i<100;i++){const state=await partnerApi('/api/account/vouchers/'+queued.id);if(state.order.fulfillmentStatus==='test_success'){recovered=true;break;}await new Promise(resolve=>setTimeout(resolve,200));}check(recovered,'Native worker did not recover paid pending order');
 await privatePage('/admin/voucher','Voucher');
 const voucherPage=await fetch(origin+'/akun/voucher',{headers:{Cookie:promoterCookie}});check(voucherPage.ok&&(await voucherPage.text()).includes('Voucher promotor'),'Voucher SSR failed');
 const aliasPage=await fetch(origin+'/akun/tautan',{headers:{Cookie:promoterCookie}});check(aliasPage.ok&&(await aliasPage.text()).includes('synthetic-partner'),'Referral SSR failed');
 const created=await api('/api/admin/orders','POST',{leadId:lead.lead.id,lines:[{name:'Tes STIFIn Personal',unitPrice:650000,quantity:1}],key:randomUUID()});const id=created.order.id;
 await api('/api/admin/orders/'+id,'POST',{action:'update',lines:[{name:'Tes STIFIn Personal',unitPrice:650000,quantity:1}],key:randomUUID()});await api('/api/admin/orders/'+id,'POST',{action:'issue',key:randomUUID()});
 const receipt={action:'receipt',amount:650000,reason:'Mutasi sintetis terverifikasi',reference:'QA-ONLY',key:randomUUID()};await api('/api/admin/orders/'+id,'POST',receipt);const repeated=await api('/api/admin/orders/'+id,'POST',receipt);check(repeated.order.balance===650000&&repeated.order.ledger.length===1,'Duplicate payment counted');
 const invoice=await privatePage('/admin/pesanan/'+id,'Rincian pesanan');check(invoice.includes('123456'),'Missing transfer details');
 await privatePage('/admin/leads?leadId='+lead.lead.id,'Klien &amp; Promotor');await privatePage('/admin/pengaturan','Atur operasional platform');await privatePage('/admin/konten','Kelola materi dan penawaran');

 // Learning upgrade: real HTTP + packaged worker, synthetic users and local files only.
 await privatePage('/admin/kelas','Semua produk. Satu ruang kerja.');
 const lp=(await api('/api/learning','POST',{action:'product.save',title:'Kelas Uji',slug:'kelas-uji',description:'Sintetis untuk QA',kind:'course',price:100000,state:'published',accessDays:30,commissionBps:1000,attributionEnabled:true})).result;
 await mkdir(image+'/storage/learning',{recursive:true});await writeFile(image+'/storage/learning/worksheet.txt','SYNTHETIC WORKSHEET');
 const ll=(await api('/api/learning','POST',{action:'lesson.save',productId:lp.id,title:'Worksheet Uji',module:'Modul 1',kind:'file',filePath:'worksheet.txt',body:'Materi uji aman',required:true,position:1,unlockDays:0,state:'published'})).result;
 const memberCredentials={email:'learner@example.test',password:'Learner-'+randomUUID()};
 const register=await fetch(origin+'/api/account/register',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(memberCredentials)});check(register.ok,'Learner registration failed '+register.status);
 const memberLogin=await fetch(origin+'/api/account/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(memberCredentials)});check(memberLogin.ok,'Learner login failed');const memberCookie=memberLogin.headers.get('set-cookie').split(';')[0];
 const memberApi=async(endpoint,method='GET',body)=>{const r=await fetch(origin+endpoint,{method,headers:{Cookie:memberCookie+'; '+refCookie,Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const json=await r.json();check(r.ok,endpoint+' learner HTTP '+r.status+' '+JSON.stringify(json));return json;};
 const learningReady=await api('/api/learning?view=setup','GET');check(learningReady.ready===true,'Learning readiness reports missing schema after migration');
 const users=await api('/api/learning?view=users&q=learner','GET');check(users.users.some(u=>u.email==='learner@example.test'),'Admin account search failed');
 check((await fetch(origin+'/api/learning?view=users&q=learner',{headers:{Cookie:memberCookie}})).status===403,'Member can search account directory');
 const learnerPage=await fetch(origin+'/akun',{headers:{Cookie:memberCookie}});const learnerHtml=await learnerPage.text();check(learnerPage.ok&&learnerHtml.includes('Selamat datang di akun Anda')&&!learnerHtml.includes('href="/akun/voucher"'),'Member navigation includes promoter-only menu');
 const learningHtml=await (await fetch(origin+'/belajar',{headers:{Cookie:memberCookie}})).text();check(learningHtml.includes('class="lr-heading"')&&!learningHtml.includes('class="hero"'),'Learning header shares public hero styling');
 check((await fetch(origin+'/api/learning?view=admin',{headers:{Cookie:memberCookie}})).status===403,'Learner can read admin learning data');
 const checkoutInput={action:'checkout',productId:lp.id,key:randomUUID(),name:'Peserta Sintetis',phone:'0812345678'};
 const lo=(await memberApi('/api/learning','POST',checkoutInput)).result;
 check((await memberApi('/api/learning','POST',checkoutInput)).result.id===lo.id,'Learning checkout not idempotent');
 check((await fetch(origin+'/api/learning/files/'+ll.id,{headers:{Cookie:memberCookie}})).status===400,'Unpaid learner can download');
 await api('/api/admin/orders/'+lo.id,'POST',{action:'receipt',amount:50000,reason:'Bank Uji',reference:'LEARN-P1',key:randomUUID()});
 check((await memberApi('/api/learning?view=dashboard')).grants.length===0,'Partial payment opened class');
 await api('/api/admin/orders/'+lo.id,'POST',{action:'receipt',amount:50000,reason:'Bank Uji',reference:'LEARN-P2',key:randomUUID()});
 let learningDash=await memberApi('/api/learning?view=dashboard');check(learningDash.grants.length===1,'Paid class access missing');
 const learnerId=learningDash.grants[0].user_id;
 const download=await fetch(origin+'/api/learning/files/'+ll.id,{headers:{Cookie:memberCookie}});check(download.ok&&(await download.text())==='SYNTHETIC WORKSHEET','Protected worksheet download failed');
 check((await fetch(origin+'/api/learning/files/'+ll.id)).status===401,'Anonymous file access allowed');
 check((await fetch(origin+'/api/learning/files/'+ll.id,{headers:{Cookie:promoterCookie}})).status===400,'Unrelated account can download file');
 await memberApi('/api/learning','POST',{action:'complete',id:ll.id});await memberApi('/api/learning','POST',{action:'complete',id:ll.id});
 learningDash=await memberApi('/api/learning?view=dashboard');check(learningDash.progress.length===1,'Progress duplicate');
 const cert=(await api('/api/learning','POST',{action:'certificate.issue',userId:learnerId,productId:lp.id,name:'Peserta Sintetis'})).result;
 const verify=await fetch(origin+'/sertifikat/'+cert.code);const certHtml=await verify.text();check(verify.ok&&certHtml.includes('Peserta Sintetis')&&!certHtml.includes('learner@example.test'),'Public certificate failed or exposed email');
 // A new paid order survives loss of request-side fulfillment; native worker recovers it.
 const second=(await memberApi('/api/learning','POST',{...checkoutInput,key:randomUUID()})).result;
 await db.query("INSERT INTO commerce_ledger(order_id,kind,amount,reason,reference,actor) VALUES($1,'receipt',100000,'Worker recovery','LEARN-WORKER','smoke')",[second.id]);
 let learned=false;for(let i=0;i<80;i++){if((await memberApi('/api/learning?view=dashboard')).grants.length===2){learned=true;break;}await new Promise(r=>setTimeout(r,200));}check(learned,'Packaged learning worker recovery failed');
 const partnerCommission=await partnerApi('/api/learning?view=partner');check(partnerCommission.commissions.length===2,'Referral commission snapshot missing');const commissionId=partnerCommission.commissions[0].id;
 await api('/api/learning','POST',{action:'commission',id:commissionId,state:'approved',reason:'QA approval'});await api('/api/learning','POST',{action:'commission',id:commissionId,state:'available',reason:'QA release'});
 const payout=(await partnerApi('/api/learning','POST',{action:'payout.request',key:randomUUID(),details:'Bank sintetis'})).result;
 await api('/api/learning','POST',{action:'payout',id:payout.id,state:'approved',reason:'QA approved'});await api('/api/learning','POST',{action:'payout',id:payout.id,state:'paid',reason:'SYNTHETIC-TRANSFER'});
 check((await partnerApi('/api/learning?view=partner')).available===0,'Paid payout retained balance');
 await api('/api/learning','POST',{action:'product.save',id:lp.id,title:'Kelas Uji',slug:'kelas-uji',description:'Sintetis untuk QA',kind:'course',price:150000,state:'published',accessDays:30,commissionBps:0,attributionEnabled:false});
 check((await memberApi('/api/learning?view=dashboard')).purchases.some(p=>p.total===100000||p.total==='100000'),'Original order price changed');
 const summary=await api('/api/admin/orders','GET');check(Boolean(summary),'Order endpoint unavailable after upgrade');
 await api('/api/admin/orders/'+lo.id,'POST',{action:'refund',amount:100000,reason:'Synthetic refund',reference:'LEARN-RF',key:randomUUID()});
 check((await memberApi('/api/learning?view=dashboard')).grants.some(g=>g.status==='suspended'),'Refund did not suspend original grant');

 // Version 0.10 regression: unified services, protected ebook upload, service affiliate and deletes.
 const catalog10=(await memberApi('/api/learning?view=catalog')).products;
 for(const key of ['tesPersonal','tesPasangan','paketKeluarga','paketKeluargaPlus']) check(catalog10.some(p=>p.source_product_key===key),'Missing unified service '+key);
 const family=catalog10.find(p=>p.source_product_key==='paketKeluarga');
 await api('/api/learning','POST',{action:'product.save',...family,price:Number(family.price),commissionBps:1000,attributionEnabled:true});
 const selectedReferral=await fetch(origin+'/r/synthetic-partner?to=/belajar&product=paketKeluarga',{redirect:'manual'});
 check(selectedReferral.headers.get('location')==='/belajar?product=paketKeluarga','Product referral exposes internal host or loses product');
 const serviceLeadResponse=await fetch(origin+'/api/interests',{method:'POST',headers:{'Content-Type':'application/json',Cookie:refCookie},body:JSON.stringify({name:'Family Referral QA',phone:'081234500009',email:'family@example.test',city:'Bandung',service:'Paket Tes Keluarga',productKey:'paketKeluarga',sourcePath:'/belajar',leadType:'test_service',consentToContact:true,consentToShare:true,idempotencyKey:randomUUID(),startedAt:Date.now()-3000})});
 check(serviceLeadResponse.ok,'Service referral form failed');
 const serviceLead=(await db.query("SELECT id FROM public_interest_leads WHERE name='Family Referral QA'")).rows[0];
 const familyOrder=(await api('/api/admin/orders','POST',{leadId:Number(serviceLead.id),key:randomUUID(),lines:[{name:family.title,unitPrice:Number(family.price),quantity:1}]})).order;
 await api('/api/admin/orders/'+familyOrder.id,'POST',{action:'issue',key:randomUUID()});
 await api('/api/admin/orders/'+familyOrder.id,'POST',{action:'receipt',amount:Number(family.price),reason:'Family QA',reference:'FAMILY-QA',key:randomUUID()});
 const familyEntry=(await partnerApi('/api/learning?view=partner')).commissions.find(e=>e.order_number===familyOrder.number);
 check(familyEntry?.amount===155000,'Service commission missing or wrong amount');
 const form=new FormData();form.set('file',new Blob(['%PDF-1.4\nSynthetic ebook QA'],{type:'application/pdf'}),'ebook.pdf');
 const upload=await fetch(origin+'/api/learning/upload',{method:'POST',headers:{Cookie:cookie,Origin:origin},body:form});const uploaded=await upload.json();check(upload.ok,'Private ebook upload failed '+JSON.stringify(uploaded));
 const ebook=(await api('/api/learning','POST',{action:'product.save',title:'Ebook Praktis STIFIn',slug:'',kind:'ebook',state:'published',price:0,ebookFilePath:uploaded.filePath})).result;
 check(ebook.slug==='ebook-praktis-stifin','Automatic slug failed');
 const ebookOrder=(await memberApi('/api/learning','POST',{action:'checkout',productId:ebook.id,key:randomUUID(),name:'Learner QA',phone:'081234'})).result;check(ebookOrder.free,'Free ebook grant failed');
 const bookFile=(await memberApi('/api/learning?view=syllabus&id='+ebook.id)).lessons[0];
 check((await fetch(origin+'/api/learning/files/'+bookFile.id,{headers:{Cookie:memberCookie}})).ok,'Ebook download denied to owner');
 check((await fetch(origin+'/api/learning/files/'+bookFile.id,{headers:{Cookie:promoterCookie}})).status===400,'Ebook exposed to unrelated partner');
 const unused=(await api('/api/learning','POST',{action:'product.save',title:'Draft salah',kind:'course',state:'draft',price:0})).result;
 check((await api('/api/learning','POST',{action:'product.delete',id:unused.id})).result.deleted,'Unused product cannot be deleted');
 check((await api('/api/learning','POST',{action:'product.delete',id:ebook.id})).result.archived,'Purchased ebook is not archived safely');
 console.log('PASS: 0.10 unified legacy catalog, product-specific relative referral, CRM service paid commission, auto slug, private ebook upload/download ownership, delete and archive.');
 if(process.env.LEARNING_VISUAL_QA_MODULE){
  const {chromium}=await import(process.env.LEARNING_VISUAL_QA_MODULE);const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.context().addCookies([{name:memberCookie.split('=')[0],value:memberCookie.split('=')[1],url:origin}]);await page.goto(origin+'/belajar');await page.getByText('Kelas Uji',{exact:true}).first().waitFor();await page.screenshot({path:process.env.LEARNING_VISUAL_QA_OUTPUT||image+'/learning.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:(process.env.LEARNING_VISUAL_QA_OUTPUT||image+'/learning.png').replace('.png','-mobile.png'),fullPage:true});
  await page.context().clearCookies();await page.context().addCookies([{name:cookie.split('=')[0],value:cookie.split('=')[1],url:origin}]);await page.goto(origin+'/admin/kelas?section=products');await page.getByRole('heading',{name:'Semua produk',exact:true}).waitFor();await page.getByRole('button',{name:'Edit',exact:true}).first().waitFor();await page.screenshot({path:(process.env.LEARNING_VISUAL_QA_OUTPUT||image+'/learning.png').replace('.png','-admin-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:(process.env.LEARNING_VISUAL_QA_OUTPUT||image+'/learning.png').replace('.png','-admin.png'),fullPage:true});
  await page.context().clearCookies();await page.context().addCookies([{name:promoterCookie.split('=')[0],value:promoterCookie.split('=')[1],url:origin}]);await page.goto(origin+'/akun/produk');await page.getByRole('heading',{name:'Tes STIFIn Personal',exact:true}).waitFor();await page.screenshot({path:(process.env.LEARNING_VISUAL_QA_OUTPUT||image+'/learning.png').replace('.png','-partner.png'),fullPage:true});
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Partner layout overflows '+width);}
}finally{await browser.close();}
 }
 console.log('PASS: learning registration, checkout snapshot/idempotency, partial/full payment, protected file ownership, progress, public certificate privacy, native learning worker recovery, referral commission and manual payout.');
 await api('/api/admin/logout','POST',{});check((await fetch(origin+'/api/admin/orders',{headers:{Cookie:cookie}})).status===401,'Revoked session still accepted');
 console.log('PASS: standalone operators, network import/idempotency, 10 pending promoters+owner, one-use activation, promoter login/scoped leads/admin denial, referral aliases/attribution, own voucher balance, checkout idempotency, payment-triggered test fulfillment, native worker recovery, voucher ownership/SSR, privacy headers, admin login, CSRF, settings, CRM, order issue/payment dedupe, private SSR pages, logout.');
 console.log('Synthetic PostgreSQL wire server only; does not use DATABASE_URL supplied by your environment. No Docker/browser/real PostgreSQL concurrency claim.');
}catch(error){console.error(error instanceof Error?error.message:'Smoke test failed');console.error((await readFile(path.join(image,'smoke.log'),'utf8')).slice(-5000));process.exitCode=1;}
finally{if(server){server.kill('SIGTERM');await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}await socket.stop();await new Promise(resolve=>setTimeout(resolve,100));await db.close();await new Promise(resolve=>logs.end(resolve));await rm(image,{recursive:true,force:true});}

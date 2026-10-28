/** Container entrypoint: web and voucher queue share the container lifecycle. */
import {spawn} from 'node:child_process';
const children=[];
let stopping=false;
function stop(signal='SIGTERM',code=0){
 if(stopping)return;stopping=true;process.exitCode=code;
 for(const child of children)if(child.exitCode===null)child.kill(signal);
 const timer=setTimeout(()=>{for(const child of children)if(child.exitCode===null)child.kill('SIGKILL');},8000);timer.unref();
}
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>stop(signal));
const web=spawn(process.execPath,['server.js'],{stdio:'inherit',env:process.env});children.push(web);
web.on('error',()=>{console.error('Web process could not start.');stop('SIGTERM',1);});
web.on('exit',code=>{if(!stopping)stop('SIGTERM',code??1);});
const worker=spawn(process.execPath,['scripts/voucher-worker.mjs'],{stdio:'inherit',env:process.env});children.push(worker);
worker.on('error',()=>{console.error('Voucher worker could not start.');stop('SIGTERM',1);});
worker.on('exit',code=>{if(!stopping){console.error('Voucher worker exited; restarting the container is required.');stop('SIGTERM',code||1);}});

const learningWorker=spawn(process.execPath,['scripts/learning-worker.mjs'],{stdio:'inherit',env:process.env});children.push(learningWorker);
learningWorker.on('error',()=>{console.error('Learning worker could not start.');stop('SIGTERM',1);});
learningWorker.on('exit',code=>{if(!stopping){console.error('Learning worker exited.');stop('SIGTERM',code||1);}});

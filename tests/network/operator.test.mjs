import {test} from 'node:test';import assert from 'node:assert/strict';
test('official import selects expected branch endpoint and strips unrelated fields before calling store',async()=>{
 const {runNetworkOperation}=await import('../../scripts/promoter-admin.mjs');
 const rows=[{KodeID:'BKS-HRA-40',Nama:'Muhamad Sofyan AR',Email:'owner@example.test',Sub:'JML-CAB-62',Area:'Sumedang',Aktif:'1'},...Array.from({length:10},(_,i)=>({KodeID:`KHU-ABU-${String(i+1).padStart(2,'0')}`,Nama:`Person ${i}`,Email:`person${i}@example.test`,Sub:'JML-CAB-62',Area:'Area',Aktif:'1',PassID:'must-never-persist'}))];
 const result=await runNetworkOperation('import',null,{importNetwork:async clean=>{assert.equal(clean.length,11);assert.ok(!JSON.stringify(clean).includes('must-never-persist'));return{created:10};}},async(url,options)=>{assert.equal(url,'https://apro.stifin.id/api/proGetCab/pro/JML-CAB-62');assert.equal(options.redirect,'error');return new Response(JSON.stringify({data:rows}));});assert.equal(result.created,10);
 await assert.rejects(runNetworkOperation('import',null,{},async()=>new Response('{}')),/network/);
});

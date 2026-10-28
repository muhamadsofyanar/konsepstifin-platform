export async function readAdminJson(request: Request):Promise<Record<string,unknown>> {
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new Error('Gunakan JSON.');
 const reader=request.body?.getReader();if(!reader)throw new Error('Data kosong.');
 const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>16384){await reader.cancel();throw new Error('Data terlalu besar.');}chunks.push(value);}}finally{reader.releaseLock();}
 const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Data tidak valid.');return value;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLogin, handleLogout } from '../../src/lib/identity/http.ts';
const request = (origin, body='{}') => new Request('https://example.com/api/account/login', {method:'POST',headers: {origin,'content-type':'application/json'},body});
const store = {login:async()=>({token:'a'.repeat(64),expiresAt:Date.now()+28800000}),logout:async()=>{}};
test('cross origin login rejected before storage', async()=>{
 const result=await handleLogin(request('https://evil.test'),store,'https://example.com',true);
 assert.equal(result.status,403);
});
test('valid login emits secure opaque cookie and no token in body',async()=>{
 const result=await handleLogin(request('https://example.com','{"email":"a@b.com","password":"password"}'),store,'https://example.com',true);
 assert.equal(result.status,200); assert.match(result.headers.get('set-cookie'),/HttpOnly/);
 assert.match(result.headers.get('set-cookie'),/Secure/); assert.equal(result.headers.get('cache-control'),'no-store');
 assert.deepEqual(await result.json(),{ok:true});
});
test('bad JSON and null body rejected',async()=>{
 for(const body of ['{','null','[]']) assert.equal((await handleLogin(request('https://example.com',body),store,'https://example.com',true)).status,400);
});
test('database errors fail closed',async()=>{
 const failed={login:async()=>{throw new Error('database secret');}};
 const result=await handleLogin(request('https://example.com','{"email":"a@b.com","password":"password"}'),failed,'https://example.com',true);
 assert.equal(result.status,503); assert.ok(!(await result.text()).includes('secret'));
});
test('failed server logout does not pretend success',async()=>{
 const result=await handleLogout(request('https://example.com'),{logout:async()=>{throw new Error('down');}},'https://example.com',true,'a'.repeat(64));
 assert.equal(result.status,503);
});

import { afterEach,beforeEach,it,expect,vi } from 'vitest';
import { mkdtemp,rm,readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const account=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/identity/server',()=>({getAccountPrincipal:account}));
import { POST } from '../../src/app/api/learning/upload/route';
let dir:string;
beforeEach(async()=>{dir=await mkdtemp(path.join(tmpdir(),'ebook-test-'));vi.stubEnv('LEARNING_STORAGE_PATH',dir);vi.stubEnv('PLATFORM_ORIGIN','https://example.test');account.mockResolvedValue({active:true,sessionValid:true,userId:'admin',roles:['admin']});});
afterEach(async()=>{vi.unstubAllEnvs();await rm(dir,{recursive:true,force:true});});
function request(content:string,name='book.pdf',origin='https://example.test'){const body=new FormData();body.set('file',new File([content],name));return new Request('https://example.test/api/learning/upload',{method:'POST',headers:{origin},body});}
it('requires admin and same origin before accepting private files',async()=>{account.mockResolvedValue({active:true,sessionValid:true,roles:['member']});expect((await POST(request('%PDF-1.4'))).status).toBe(403);account.mockResolvedValue({active:true,sessionValid:true,roles:['admin']});expect((await POST(request('%PDF-1.4','book.pdf','https://evil.test'))).status).toBe(403);});
it('rejects fake PDF and traversal filenames cannot select an output path',async()=>{expect((await POST(request('<script>bad</script>'))).status).toBe(400);const r=await POST(request('%PDF-1.4\nprivate','../../book.pdf'));expect(r.status).toBe(200);const d=await r.json();expect(d.filePath).toMatch(/^[a-f0-9-]+\.pdf$/);expect((await readFile(path.join(dir,d.filePath),'utf8'))).toContain('private');});
it('rejects oversized declarations before parsing file content',async()=>{const r=new Request('https://example.test/api/learning/upload',{method:'POST',headers:{origin:'https://example.test','content-type':'multipart/form-data; boundary=x','content-length':String(22*1024*1024)},body:'x'});expect((await POST(r)).status).toBe(413);});

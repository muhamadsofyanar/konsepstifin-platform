import { afterEach, expect, it, vi } from 'vitest';
import { whatsappMediaUrl } from './whatsapp-media';
import { attachmentMime } from './whatsapp-attachment';
import { sendStarSenderText,sendStarSenderGroupText } from './starsender-client';
afterEach(()=>{delete process.env.STARSENDER_API_KEY;vi.unstubAllGlobals();});
it('rejects local or non-HTTPS media URLs and invalid file signatures',()=>{
  for(const url of ['http://example.test/a','https://127.0.0.1/a','https://10.0.0.1/a','https://u:p@example.test/a','javascript:alert(1)'])expect(()=>whatsappMediaUrl(url)).toThrow();
  expect(whatsappMediaUrl('https://example.test/a.pdf')).toBe('https://example.test/a.pdf');
  expect(()=>attachmentMime('fake.pdf',Buffer.from('<html>'))).toThrow();
  expect(attachmentMime('brochure.pdf',Buffer.from('%PDF-1.7'))).toBe('application/pdf');
});
it('sends file URLs as media for personal and group destinations, including an empty caption',async()=>{
  process.env.STARSENDER_API_KEY='test';
  const calls:Array<{url:string;body:Record<string,unknown>}>=[];
  vi.stubGlobal('fetch',vi.fn(async(url:string,init:RequestInit)=>{calls.push({url:String(url),body:JSON.parse(String(init.body))});return Response.json({success:true});}));
  await sendStarSenderText('081234567890','','https://example.test/file.pdf');
  await sendStarSenderGroupText('123@g.us','Brosur','https://example.test/file.pdf');
  expect(calls[0].body).toMatchObject({messageType:'media',to:'6281234567890',body:'',file:'https://example.test/file.pdf'});
  expect(calls[1].body).toMatchObject({messageType:'media',to:'123@g.us',body:'Brosur',file:'https://example.test/file.pdf'});
  expect(calls[1].url).toContain('/api/send/grup');
});

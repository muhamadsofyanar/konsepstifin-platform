// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {learningVideo} from '../../src/lib/learning-video';
import {productPath,oldProductPath,safeReturnPath} from '../../src/lib/product-links';
import VideoPlayer from '../../src/app/belajar/video-player';
import CertificateActions from '../../src/app/sertifikat/certificate-actions';
afterEach(cleanup);
it('normalizes supported YouTube variants and Vimeo private hash without accepting lookalike hosts',()=>{
 for(const url of ['https://youtu.be/M7lc1UVf-VE','https://www.youtube.com/watch?v=M7lc1UVf-VE','https://www.youtube.com/shorts/M7lc1UVf-VE','https://www.youtube.com/embed/M7lc1UVf-VE'])expect(learningVideo(url)?.src).toBe('https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?rel=0&playsinline=1');
 expect(learningVideo('https://vimeo.com/123456/abc123')?.src).toBe('https://player.vimeo.com/video/123456?h=abc123');
 expect(learningVideo('https://player.vimeo.com/video/123456?h=secret')?.src).toContain('h=secret');
 for(const value of ['javascript:alert(1)','http://youtu.be/M7lc1UVf-VE','https://youtube.com.evil.test/watch?v=M7lc1UVf-VE','https://user:pass@youtube.com/watch?v=M7lc1UVf-VE','<iframe src="https://youtube.com"></iframe>'])expect(learningVideo(value)).toBeNull();
});
it('renders video inline and keeps an external source as an optional fallback',()=>{render(<VideoPlayer url="https://youtu.be/M7lc1UVf-VE" title="Pendahuluan"/>);expect(screen.getByTitle('Pendahuluan').tagName).toBe('IFRAME');expect(screen.getByTitle('Pendahuluan')).toHaveAttribute('allowfullscreen');expect(screen.queryByText('Buka video ↗')).toBeNull();});
it('uses native controls for a direct MP4 with a signed query',()=>{const {container}=render(<VideoPlayer url="https://media.example.test/lesson.mp4?token=private" title="Materi"/>);expect(container.querySelector('video')).toHaveAttribute('controls');expect(container.querySelector('video')).toHaveAttribute('src','https://media.example.test/lesson.mp4?token=private');});
it('unifies legacy and digital product destinations and prevents external login redirects',()=>{
 expect(productPath({source_product_key:'paketKeluarga',slug:'custom'})).toBe('/produk/layanan/paketKeluarga');expect(oldProductPath('paketKeluarga')).toBe('/produk/layanan/paketKeluarga');expect(oldProductPath('kelas-baru')).toBe('/produk/kelas-baru');
 expect(safeReturnPath('/produk/layanan/paketKeluarga')).toBe('/produk/layanan/paketKeluarga');for(const url of ['https://evil.test','//evil.test','/\\evil.test','/admin','/produk/%2f%2fevil.test'])expect(safeReturnPath(url)).toBe('/akun');
});
it('provides a print action that invokes the browser PDF/print dialog',async()=>{const print=vi.spyOn(window,'print').mockImplementation(()=>{});render(<CertificateActions/>);await userEvent.click(screen.getByRole('button',{name:'Cetak / Simpan PDF'}));expect(print).toHaveBeenCalledOnce();print.mockRestore();});
it('retries a transient GET failure once without retrying authorization failures',async()=>{
 const {query}=await import('../../src/app/belajar/ui');const fetcher=vi.spyOn(globalThis,'fetch');fetcher.mockResolvedValueOnce({status:503,ok:false,json:async()=>({message:'Sibuk'})} as Response).mockResolvedValueOnce({status:200,ok:true,json:async()=>({products:[]})} as Response);expect(await query('view=catalog')).toEqual({products:[]});expect(fetcher).toHaveBeenCalledTimes(2);fetcher.mockClear();fetcher.mockResolvedValueOnce({status:401,ok:false,json:async()=>({message:'Masuk dahulu'})} as Response);await expect(query('view=dashboard')).rejects.toThrow('Masuk dahulu');expect(fetcher).toHaveBeenCalledTimes(1);fetcher.mockRestore();
});

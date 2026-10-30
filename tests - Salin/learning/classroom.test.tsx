// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const api=vi.hoisted(()=>({query:vi.fn(),action:vi.fn()}));
vi.mock('@/app/belajar/ui',async()=>({...await vi.importActual<typeof import('@/app/belajar/ui')>('@/app/belajar/ui'),query:api.query,action:api.action}));
import Classroom from '../../src/app/belajar/kelas/[id]/classroom';
import Portal from '../../src/app/belajar/portal';
import RegisterForm from '../../src/app/akun/daftar/register-form';
const grant={id:1,product_id:7,title:'Kelas saya',kind:'course',status:'active',started_at:new Date(Date.now()-86400000).toISOString(),required_lessons:[1,2]};
const lessons=[{id:1,title:'Pendahuluan',module:'Modul 1',kind:'video',unlock_days:0},{id:2,title:'Latihan',module:'Modul 1',kind:'text',unlock_days:0},{id:3,title:'Hari berikutnya',module:'Modul 2',kind:'text',unlock_days:50}];
beforeEach(()=>{window.history.replaceState(null,'','/belajar/kelas/7');api.query.mockImplementation(async(v:string)=>{if(v.startsWith('view=dashboard'))return {grants:[grant],progress:[],purchases:[]};if(v==='view=catalog')return {products:[]};if(v.startsWith('view=classroom'))return v.includes('lesson=999')?{grant,progress:[],lessons,material:null,materialError:'Materi pada tautan ini tidak ditemukan di kelas Anda. Pilih materi lain.'}:{grant,progress:[],lessons,material:{...lessons[0],url:'https://youtu.be/M7lc1UVf-VE',body:'Isi 1'}};if(v.startsWith('view=syllabus'))return {lessons};const id=Number(v.split('id=')[1]);return {material:{...lessons.find(l=>l.id===id),url:id===1?'https://youtu.be/M7lc1UVf-VE':'',body:'Isi '+id}};});api.action.mockResolvedValue({saved:true});});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('keeps the access library separate from the classroom and links to a real route',async()=>{
 render(<Portal signedIn roles={['member']}/>);const link=await screen.findByRole('link',{name:'Mulai belajar →'});expect(link).toHaveAttribute('href','/belajar/kelas/7');expect(screen.queryByTitle('Pendahuluan')).not.toBeInTheDocument();expect(screen.queryByText('KELAS YANG DIBUKA')).not.toBeInTheDocument();
});
it('opens an inline player, persists progress, and navigates lessons without returning to the library',async()=>{
 render(<Classroom productId={7}/>);expect(await screen.findByTitle('Pendahuluan')).toHaveAttribute('src',expect.stringContaining('youtube-nocookie.com/embed'));expect(api.query).toHaveBeenCalledTimes(1);expect(api.query).toHaveBeenCalledWith('view=classroom&id=7');
 expect(screen.getByRole('link',{name:'← Kembali ke akses saya'})).toHaveAttribute('href','/belajar?tab=classes');
 await userEvent.click(screen.getByRole('button',{name:'Tandai materi selesai'}));expect(await screen.findByRole('button',{name:'✓ Materi selesai'})).toBeDisabled();expect(api.action).toHaveBeenCalledWith({action:'complete',id:1});
 expect(screen.getByText('1 dari 2 materi wajib selesai')).toBeVisible();await userEvent.click(screen.getByRole('button',{name:'Berikutnya →'}));expect(await screen.findByRole('heading',{name:'Latihan'})).toBeVisible();expect(window.location.search).toBe('?materi=2');expect(screen.getByRole('button',{name:'Berikutnya →'})).toBeDisabled();
});
it('never fetches material for an expired grant or an unavailable deep link',async()=>{
 api.query.mockResolvedValueOnce({grant:{...grant,expires_at:'2020-01-01'},lessons:[],progress:[],material:null});const view=render(<Classroom productId={7}/>);expect(await screen.findByText('Akses kelas belum aktif')).toBeVisible();expect(api.query).toHaveBeenCalledTimes(1);view.unmount();api.query.mockClear();render(<Classroom productId={7} initialLesson={999}/>);expect(await screen.findByRole('alert')).toHaveTextContent('tidak ditemukan');expect(api.query.mock.calls.some(([v])=>v.startsWith('view=material'))).toBe(false);
});
it('rejects out-of-order lesson responses and does not show the prior lesson while loading',async()=>{
 let finish:((v:unknown)=>void)|undefined;
 const original=api.query.getMockImplementation()!;api.query.mockImplementation((v:string)=>v==='view=material&id=2'?new Promise(resolve=>{finish=resolve;}):original(v));
 render(<Classroom productId={7}/>);await screen.findByTitle('Pendahuluan');await userEvent.click(screen.getByRole('button',{name:/^Latihan/}));
 expect(screen.queryByTitle('Pendahuluan')).not.toBeInTheDocument();await userEvent.click(screen.getByRole('button',{name:/^Pendahuluan/}));await screen.findByTitle('Pendahuluan');finish?.({material:{...lessons[1],body:'Late response'}});await waitFor(()=>expect(screen.queryByText('Late response')).not.toBeInTheDocument());
});
it('renders failed registration as an error and replaces a successful form with a login action',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:false,json:async()=>({message:'Email sudah terdaftar'})}).mockResolvedValueOnce({ok:true,json:async()=>({message:'Akun peserta dibuat. Silakan masuk.'})}));
 render(<RegisterForm next="/belajar/kelas/7"/>);await userEvent.type(screen.getByLabelText('Email'),'person@example.test');await userEvent.type(screen.getByLabelText(/Kata sandi/),'Long-password-123');await userEvent.click(screen.getByRole('button',{name:'Buat akun peserta'}));expect(await screen.findByRole('alert')).toHaveTextContent('Email sudah terdaftar');await userEvent.click(screen.getByRole('button',{name:'Buat akun peserta'}));expect(await screen.findByRole('link',{name:'Masuk dan lanjutkan →'})).toHaveAttribute('href','/akun/login?next=%2Fbelajar%2Fkelas%2F7');expect(screen.queryByRole('button',{name:'Buat akun peserta'})).not.toBeInTheDocument();
});

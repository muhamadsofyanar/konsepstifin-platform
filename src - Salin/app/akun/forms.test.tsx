// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/navigation',()=>({useRouter:()=>({replace:vi.fn(),refresh:vi.fn()})}));
import ActivationForm from './aktivasi/activation-form';
import LoginForm from './login/login-form';
afterEach(()=>{cleanup();vi.unstubAllGlobals();window.history.replaceState({},'', '/');});
it('keeps the fragment secret out of page text and rejects mismatched passwords before sending', async()=>{
 window.history.replaceState({},'', '/akun/aktivasi#token='+'a'.repeat(64));
 const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
 render(<ActivationForm/>);
 fireEvent.change(screen.getByLabelText('Kata sandi baru'),{target:{value:'password12345'}});
 fireEvent.change(screen.getByLabelText('Ulangi kata sandi'),{target:{value:'different1234'}});
 fireEvent.submit(screen.getByRole('button',{name:'Aktifkan akun'}).closest('form')!);
 expect(await screen.findByRole('alert')).toHaveTextContent('tidak sama');expect(fetchMock).not.toHaveBeenCalled();
 expect(document.body).not.toHaveTextContent('a'.repeat(64));
});
it('uses fragment token only at activation submit and clears it on success', async()=>{
 const token='a'.repeat(64);window.history.replaceState({},'', '/akun/aktivasi#token='+token);
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true})});vi.stubGlobal('fetch',fetchMock);
 render(<ActivationForm/>);
 for(const label of ['Kata sandi baru','Ulangi kata sandi'])fireEvent.change(screen.getByLabelText(label),{target:{value:'password12345'}});
 fireEvent.submit(screen.getByRole('button',{name:'Aktifkan akun'}).closest('form')!);
 await screen.findByText('Akun berhasil diaktifkan.');
 expect(fetchMock).toHaveBeenCalledWith('/api/account/activate',expect.objectContaining({body:JSON.stringify({token,password:'password12345'})}));
 expect(window.location.hash).toBe('');
});
it('logs in using the shared account endpoint and displays server failure',async()=>{
 const fetchMock=vi.fn().mockResolvedValue({ok:false,json:async()=>({message:'Email atau kata sandi tidak sesuai.'})});vi.stubGlobal('fetch',fetchMock);
 render(<LoginForm/>);fireEvent.change(screen.getByLabelText('Email'),{target:{value:'member@example.test'}});fireEvent.change(screen.getByLabelText('Kata sandi'),{target:{value:'password12345'}});
 fireEvent.submit(screen.getByRole('button',{name:'Masuk'}).closest('form')!);
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('tidak sesuai'));
 expect(fetchMock).toHaveBeenCalledWith('/api/account/login',expect.objectContaining({method:'POST'}));
});

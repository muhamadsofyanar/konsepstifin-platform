// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import InviteButton from './invite-button';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('only reveals a private copy link after explicit issuing and explains reissue',async()=>{
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({activationUrl:'https://konsepstifin.com/akun/aktivasi#token=secret',expiresAt:'2026-11-04T00:00:00Z'})});vi.stubGlobal('fetch',fetchMock);
 render(<InviteButton userId="member"/>);expect(screen.queryByLabelText('Tautan aktivasi pribadi')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Terbitkan tautan aktivasi'}));
 expect(await screen.findByLabelText('Tautan aktivasi pribadi')).toHaveValue('https://konsepstifin.com/akun/aktivasi#token=secret');
 expect(screen.getByText(/Tautan sebelumnya tidak berlaku/)).toBeInTheDocument();
 expect(fetchMock).toHaveBeenCalledWith('/api/admin/network',expect.objectContaining({body:JSON.stringify({userId:'member'})}));
});

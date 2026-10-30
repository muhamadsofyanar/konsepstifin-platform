// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChatUnreadBadge from './unread-badge';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('shows unread replies in account navigation and refreshes after reading',async()=>{
 let unread=3;vi.stubGlobal('fetch',vi.fn(()=>Promise.resolve(new Response(JSON.stringify({unread})))));
 render(<ChatUnreadBadge/>);
 expect(await screen.findByLabelText('3 pesan belum dibaca')).toBeInTheDocument();
 unread=0;fireEvent(window,new Event('dashboard-chat-read'));
 await waitFor(()=>expect(screen.queryByLabelText('3 pesan belum dibaca')).not.toBeInTheDocument());
});

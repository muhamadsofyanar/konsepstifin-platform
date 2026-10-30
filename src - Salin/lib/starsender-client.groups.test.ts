import { afterEach, expect, it, vi } from 'vitest';
import { listStarSenderGroups, sendStarSenderGroupText } from './starsender-client';

afterEach(() => {
  delete process.env.STARSENDER_API_KEY;
  delete process.env.STARSENDER_API_URL;
  vi.unstubAllGlobals();
});

it('reads group list from StarSender device API', async () => {
  process.env.STARSENDER_API_KEY = 'device-test-key';
  process.env.STARSENDER_API_URL = 'https://api.starsender.online/api/send';
  vi.stubGlobal('fetch', vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    expect(String(url)).toBe('https://api.starsender.online/api/whatsapp/groups');
    expect(new Headers(init?.headers).get('authorization')).toBe('device-test-key');
    return new Response(JSON.stringify({ success: true, data: { groups: [{ id: '120363@g.us', subject: 'Komunitas STIFIn' }] } }), { status: 200 });
  }));
  await expect(listStarSenderGroups()).resolves.toEqual([{ groupJid: '120363@g.us', groupName: 'Komunitas STIFIn', deviceName: '', raw: { id: '120363@g.us', subject: 'Komunitas STIFIn' } }]);
});

it('sends group text through the documented StarSender group endpoint', async () => {
  process.env.STARSENDER_API_KEY = 'device-test-key';
  process.env.STARSENDER_API_URL = 'https://api.starsender.online/api/send';
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    expect(String(url)).toBe('https://api.starsender.online/api/send/grup');
    expect(new Headers(init?.headers).get('authorization')).toBe('device-test-key');
    expect(JSON.parse(String(init?.body))).toMatchObject({ messageType: 'text', to: '120363@g.us', body: 'Informasi tes' });
    return new Response(JSON.stringify({ success: true, message: 'Success sent message', data: { message_id: 'msg-1' } }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  await expect(sendStarSenderGroupText('120363@g.us', 'Informasi tes')).resolves.toMatchObject({ success: true, status: 200, messageId: 'msg-1' });
});

it('reads keyed metadata and skips empty name aliases', async () => {
  process.env.STARSENDER_API_KEY = 'device-test-key';
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: true, data: {
    '120363@g.us': { group_name: '', groupMetadata: { subject: 'TARGET STIFIN MULIA' } },
    '987654@g.us': { name: 'Praktisi' },
  } }))));
  const groups = await listStarSenderGroups();
  expect(groups.map(group => [group.groupJid, group.groupName])).toEqual([
    ['120363@g.us', 'TARGET STIFIN MULIA'], ['987654@g.us', 'Praktisi'],
  ]);
});

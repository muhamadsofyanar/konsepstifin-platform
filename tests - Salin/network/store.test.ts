import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({initialized:false}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/interest-store',()=>({initializeInterestSchema:vi.fn(async()=>{state.initialized=true;})}));
vi.mock('@/lib/article-store',()=>({getDatabaseClient:()=>({unsafe:vi.fn(async()=>{expect(state.initialized).toBe(true);return [];})})}));
import {getPromoterPortal} from '../../src/lib/network-store';
beforeEach(()=>{state.initialized=false;vi.stubEnv('PLATFORM_ORIGIN','https://example.test');});
it('prepares interest schema before fresh promoter portal SQL',async()=>{expect(await getPromoterPortal('test-user')).toBeNull();});

// @vitest-environment jsdom
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,cleanup} from '@testing-library/react';
const mocks=vi.hoisted(()=>({path:'/akun/aktivasi'}));
vi.mock('next/navigation',()=>({usePathname:()=>mocks.path}));
vi.mock('next/script',()=>({default:({children}:{children:string})=><script data-testid="tracking-script">{children}</script>}));
describe('private portal analytics boundary',()=>{
 beforeEach(()=>{cleanup();vi.resetModules();vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID','123456');window.fbq=vi.fn();});
 it('does not render external trackers or pixel image on account or admin pages',async()=>{
  const {default:MetaPixel}=await import('./meta-pixel');
  for(const path of ['/akun/aktivasi','/akun/login','/akun','/admin','/admin/jaringan']){
   mocks.path=path;const view=render(<MetaPixel/>);expect(view.container.querySelector('script')).toBeNull();expect(view.container.querySelector('img')).toBeNull();view.unmount();
  }
  expect(window.fbq).not.toHaveBeenCalled();
 });
 it('does not emit a pageview when navigating from public pages into a private portal',async()=>{
  const {default:MetaPixel}=await import('./meta-pixel');mocks.path='/tes-stifin';const view=render(<MetaPixel/>);mocks.path='/akun/aktivasi';view.rerender(<MetaPixel/>);expect(window.fbq).not.toHaveBeenCalled();
 });
});

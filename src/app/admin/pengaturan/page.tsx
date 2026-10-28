import {redirect} from 'next/navigation';
import {getAdminPrincipal} from '@/lib/admin-auth';
import {getOperationsService} from '@/lib/operations-store';
import {getDatabaseClient} from '@/lib/article-store';
import SettingsManager from './settings-manager';
export const dynamic='force-dynamic';
export const metadata={title:'Pengaturan Admin | Konsep STIFIn'};
export default async function SettingsPage(){
 const actor=await getAdminPrincipal();if(!actor)redirect('/admin/login');
 const service=getOperationsService();
 const results=await Promise.allSettled([service.settings(),service.accounts(),service.recentAudit(),getDatabaseClient()`SELECT 1 AS ready`]);
 const settings=results[0].status==='fulfilled'?results[0].value:null;
 const accounts=results[1].status==='fulfilled'?results[1].value:[];
 const audit=results[2].status==='fulfilled'?results[2].value:[];
 const states=[{label:'Database',ready:results[3].status==='fulfilled'},{label:'Migrasi pengaturan',ready:Boolean(settings)},{label:'Alamat aplikasi',ready:Boolean(process.env.PLATFORM_ORIGIN)},{label:'Bantuan AI',ready:Boolean(process.env.OPENAI_API_KEY||process.env.GEMINI_API_KEY)}];
 return <main className="portal-page"><header className="portal-heading"><div><span className="portal-eyebrow">PENGATURAN</span><h1>Atur operasional platform</h1><p>Kelola rekening, petunjuk pembayaran, dan akses admin.</p></div><span className="portal-version">Versi 0.7.0</span></header>
 <section className="portal-status-grid" aria-label="Status sistem">{states.map(state=><div key={state.label}><span className={state.ready?'status-dot ready':'status-dot'} /><b>{state.label}</b><small>{state.ready?'Tersedia':'Belum tersedia'}</small></div>)}</section>
 {!settings&&<p className="portal-error" role="alert">Pengaturan belum dapat dimuat. Pastikan database terhubung dan migrasi 003-operations sudah dijalankan. Perubahan tidak disimpan sebelum database siap.</p>}
 <SettingsManager initialSettings={settings} initialAccounts={accounts} actorId={actor.userId} isOwner={actor.roles.includes('super_admin')}/>
 <div className="portal-columns"><section className="portal-card"><h2>Penyimpanan & pemulihan</h2><p>Dokumen pustaka disimpan di direktori <code>/app/storage</code>. Pasang volume persisten di Coolify agar file tetap tersedia saat redeploy.</p><p>Cadangkan database PostgreSQL dan direktori file sebelum pembaruan. Jadwal backup dan uji pemulihan dikelola melalui server/Coolify.</p><p>Kunci API dan koneksi database diatur melalui environment Coolify. Nilainya tidak ditampilkan di dashboard.</p></section><section className="portal-card"><h2>Aktivitas administrasi</h2>{audit.length?<ul className="portal-records">{audit.map(row=><li key={String(row.id)}><div><b>{({'settings.updated':'Pengaturan diperbarui','account.created':'Admin ditambahkan','account.updated':'Akun diperbarui'} as Record<string,string>)[String(row.action)]||String(row.action)}</b><span>{String(row.email)}</span><time>{new Date(row.created_at as string).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</time></div></li>)}</ul>:<p className="portal-empty">{results[2].status==='rejected'?'Riwayat belum tersedia.':'Belum ada perubahan administrasi.'}</p>}</section></div></main>;
}

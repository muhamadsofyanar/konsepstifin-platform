import { getAccountPrincipal } from '@/lib/identity/server';
import LearningPortal from './portal';
import './learning.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kelas dan Produk Digital | KonsepSTIFIn', description: 'Temukan kelas dan materi KonsepSTIFIn. Belajar melalui satu akun dan lanjutkan progres Anda.' };
export default async function Page({ searchParams }: {
    searchParams: Promise<Record<string, string | undefined>>;
}) { let signedIn = false; let roles: readonly string[] = []; try {
    const p = await getAccountPrincipal();
    signedIn = !!p?.active && !!p?.sessionValid;
    roles = p?.roles ?? [];
}
catch { } const tab = (await searchParams).tab; return <LearningPortal key={tab ?? 'classes'} signedIn={signedIn} roles={roles} initialTab={tab}/>; }

import {redirect} from 'next/navigation';
import {getAccountPrincipal} from '@/lib/identity/server';
import Partner from './partner';
import '../../belajar/learning.css';
export const dynamic='force-dynamic';
export default async function Page(){const p=await getAccountPrincipal();if(!p?.active||!p.sessionValid)redirect('/akun/login');return <Partner/>;}

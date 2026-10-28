import {redirect} from 'next/navigation';
import {getAdminPrincipal} from '@/lib/admin-auth';
import LearningAdmin from './learning-admin';
import '../../belajar/learning.css';
export const dynamic='force-dynamic';
export const metadata={title:'Kelas dan Komisi | Admin KonsepSTIFIn'};
export default async function Page(){if(!await getAdminPrincipal())redirect('/admin/login');return <LearningAdmin/>;}

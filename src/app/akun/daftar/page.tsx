import { safeReturnPath } from '@/lib/product-links';
import RegisterForm from './register-form';
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}){return <RegisterForm next={safeReturnPath((await searchParams).next)}/>;}

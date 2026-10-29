import { getAccountPrincipal } from '@/lib/identity/server';
import { getPromoterPortal } from '@/lib/network-store';

export const runtime = 'nodejs';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const principal = await getAccountPrincipal();
    if (!principal || !principal.active || !principal.sessionValid) {
      return Response.json({ message: 'Silakan masuk.' }, { status: 401, headers });
    }

    const roles = principal.roles;
    const isAdmin = roles.some(role => role === 'admin' || role === 'super_admin');
    const isPromoter = roles.includes('promoter');
    const isAffiliate = roles.includes('affiliate');
    let isBranchManager = false;
    let displayName: string | null = null;
    if (isPromoter) {
      try {
        const portal = await getPromoterPortal(principal.userId);
        isBranchManager = Boolean(portal?.profile.isManager);
        displayName = portal?.profile.name || null;
      } catch {
        // Role detection must not break a valid session when network mapping is unavailable.
      }
    }

    const accountType = isAdmin ? 'admin'
      : isBranchManager ? 'branch_manager'
      : isPromoter ? 'promoter'
      : isAffiliate ? 'affiliate'
      : roles.includes('instructor') ? 'instructor'
      : 'member';

    const accountLabel = accountType === 'admin' ? 'Administrator'
      : accountType === 'branch_manager' ? 'Kepala cabang'
      : accountType === 'promoter' ? 'Promotor'
      : accountType === 'affiliate' ? 'Affiliate'
      : accountType === 'instructor' ? 'Pengajar'
      : 'Peserta terdaftar';

    return Response.json({
      userId: principal.userId,
      email: principal.email,
      displayName,
      roles,
      promoterCode: principal.promoterCode,
      accountType,
      accountLabel,
      isBranchManager,
      registered: true,
    }, { headers });
  } catch {
    return Response.json({ message: 'Layanan akun sementara tidak tersedia.' }, { status: 503, headers });
  }
}

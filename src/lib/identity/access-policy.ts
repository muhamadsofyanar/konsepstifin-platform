/** Pure policy only. Principal MUST come from server-verified session/account data.
 * SQL consumers must enforce scope before SELECT/count/update, not after fetching.
 */
export type Principal = {
  userId: string;
  roles: readonly string[];
  active: boolean;
  sessionValid: boolean;
  promoterCode: string | null;
};
export type LeadScope = { kind: 'none' } | { kind: 'all' }
  | { kind: 'assigned'; promoterCode: string; consentToShare: true };
export type LeadAccess = { assignedPromoterCode: string; consentToShare: boolean };
export type PromoterLead = LeadAccess & {
  id: number; name: string; phone: string; email: string; city: string; status: string;
};

export function accessScope(principal: Principal | null): LeadScope {
  if (!principal || principal.active !== true || principal.sessionValid !== true
    || typeof principal.userId !== 'string' || !principal.userId.trim()
    || !Array.isArray(principal.roles)) return { kind: 'none' };
  if (principal.roles.includes('admin') || principal.roles.includes('super_admin')) return { kind: 'all' };
  if (principal.roles.includes('promoter') && typeof principal.promoterCode === 'string'
    && principal.promoterCode.trim()) {
    return { kind: 'assigned', promoterCode: principal.promoterCode, consentToShare: true };
  }
  return { kind: 'none' };
}

export function canReadLead(principal: Principal | null, lead: LeadAccess): boolean {
  const scope = accessScope(principal);
  return scope.kind === 'all' || (scope.kind === 'assigned'
    && lead.assignedPromoterCode === scope.promoterCode && lead.consentToShare === true);
}

/** Explicit allowlist: no spread of stored rows, financial fields or history. */
export function projectPromoterLead(principal: Principal | null, lead: PromoterLead) {
  if (!canReadLead(principal, lead)) throw new Error('Access denied');
  return { id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, city: lead.city, status: lead.status };
}

/** This validates fields, NOT authorization. Caller must authorize and lock the
 * assigned row in the same transaction as mutation/audit. Statuses from server only.
 */
export function validatePromoterPatch(input: unknown, allowedStatuses: readonly string[]): { status?: string; activityNote?: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid payload');
  const data = input as Record<string, unknown>;
  const keys = Object.keys(data);
  if (!keys.length) throw new Error('Empty update');
  if (keys.some(key => key !== 'status' && key !== 'activityNote')) throw new Error('Field not allowed');
  const result: { status?: string; activityNote?: string } = {};
  if (Object.hasOwn(data, 'status')) {
    if (typeof data.status !== 'string' || !allowedStatuses.includes(data.status)) throw new Error('Invalid status');
    result.status = data.status;
  }
  if (Object.hasOwn(data, 'activityNote')) {
    if (typeof data.activityNote !== 'string' || !data.activityNote.trim() || data.activityNote.length > 2000) throw new Error('Invalid activity note');
    result.activityNote = data.activityNote.trim();
  }
  return result;
}

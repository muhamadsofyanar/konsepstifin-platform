import { createInterestLead, validateIdempotencyKey, validateInterestInput } from './interest-store';
import { findPromoterMatch } from './promoter-store';
import { resolveTestCheckoutUrl } from './product-store';
import type { PromoterMatch } from './promoter-domain';

type Dependencies = { findMatch: typeof findPromoterMatch; createLead: typeof createInterestLead; resolveCheckout: typeof resolveTestCheckoutUrl };
const defaults: Dependencies = { findMatch: findPromoterMatch, createLead: createInterestLead, resolveCheckout: resolveTestCheckoutUrl };

export async function submitInterest(raw: unknown, dependencies: Dependencies = defaults) {
  const input = validateInterestInput(raw);
  const idempotencyKey = validateIdempotencyKey(raw && typeof raw === 'object' ? (raw as Record<string, unknown>).idempotencyKey : '');
  const checkoutUrl = await dependencies.resolveCheckout(input.productKey);
  let match: PromoterMatch = { method: 'none', primary: null, candidates: [] };
  try { match = await dependencies.findMatch({ provinceCode: input.provinceCode, provinceName: input.provinceName, regencyCode: input.regencyCode, regencyName: input.regencyName }); }
  catch { match = { method: 'none', primary: null, candidates: [] }; }
  const status = match.primary ? 'ditawarkan' as const : 'mencari_promotor' as const;
  const lead = await dependencies.createLead({ interest: input, idempotencyKey, status, match: {
    matchMethod: match.method, assignedPromoterCode: match.primary?.code ?? '', matchedPromoterName: match.primary?.name ?? '', matchedBranchCode: match.primary?.branchCode ?? '',
  } });
  return { id: lead.id, reference: 'KSF-' + lead.id, status, match: { method: match.method, promoter: match.primary ? {
    code: match.primary.code, name: match.primary.name, area: match.primary.area, province: match.primary.province,
  } : null }, checkoutUrl };
}

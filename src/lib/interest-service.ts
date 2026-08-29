import { isOfficialSejoliUrl } from '@/app/site-config';
import { matchPromoters, type PromoterMatch, type PublicPromoter } from '@/lib/promoter-domain';
import {
  createInterestLead,
  validateIdempotencyKey,
  validateInterestInput,
  type CreateInterestLeadCommand,
  type InterestInput,
  type LeadMatchSnapshot,
  type StoredLead,
  type StoredPromoterCandidate,
} from '@/lib/interest-store';

type CheckoutResolver = (productKey: string) => Promise<string>;
type MatchResolver = (interest: InterestInput) => Promise<PromoterMatch>;
type PromoterResolver = (regionCode: string) => Promise<PublicPromoter[]>;
type LeadCreator = (command: CreateInterestLeadCommand) => Promise<StoredLead | { id: number; leadType?: string; status?: string }>;

export type SubmissionDependencies = {
  createLead?: LeadCreator;
  findMatch?: MatchResolver;
  findPromoters?: PromoterResolver;
  resolveCheckout?: CheckoutResolver;
};

function storedCandidate(promoter: PublicPromoter): StoredPromoterCandidate {
  return {
    code: promoter.code,
    name: promoter.name,
    branchCode: promoter.branchCode,
    area: promoter.area,
    province: promoter.province,
  };
}

function snapshot(match: PromoterMatch): LeadMatchSnapshot {
  const primary = match.primary;
  return {
    matchMethod: match.method === 'manual_region' ? 'manual' : match.method,
    assignedPromoterCode: primary?.code ?? '',
    matchedPromoterName: primary?.name ?? '',
    matchedBranchCode: primary?.branchCode ?? '',
    candidates: match.candidates.slice(0, 3).map(storedCandidate),
  };
}

async function resolveMatch(interest: InterestInput, dependencies: SubmissionDependencies) {
  try {
    if (dependencies.findMatch) return await dependencies.findMatch(interest);
    if (dependencies.findPromoters) {
      const promoters = await dependencies.findPromoters(interest.regencyCode || interest.provinceCode);
      return matchPromoters(promoters, interest);
    }
  } catch {
    // Kegagalan katalog tidak menggagalkan pencatatan lead tes.
  }
  return { method: 'none', primary: null, candidates: [] } satisfies PromoterMatch;
}

function publicMatch(match: PromoterMatch) {
  return {
    method: match.method === 'manual_region' ? 'manual' : match.method,
    promoter: match.primary ? storedCandidate(match.primary) : null,
  };
}

export async function submitInterest(payload: unknown, dependencies: SubmissionDependencies) {
  if (!payload || typeof payload !== 'object') throw new Error('Data formulir tidak valid.');
  const raw = payload as Record<string, unknown>;
  const interest = validateInterestInput(raw);
  const idempotencyKey = validateIdempotencyKey(raw.idempotencyKey);
  const createLead = dependencies.createLead ?? createInterestLead;

  if (interest.leadType === 'promoter_candidate') {
    const status = 'baru' as const;
    const lead = await createLead({ interest, idempotencyKey, status, match: null });
    return {
      lead,
      reference: `KSF-${lead.id}`,
      status: lead.status ?? status,
      match: null,
      checkoutUrl: '',
    };
  }

  const checkoutUrl = dependencies.resolveCheckout ? await dependencies.resolveCheckout(interest.productKey) : '';
  if (checkoutUrl && !isOfficialSejoliUrl(checkoutUrl)) {
    throw new Error('Checkout produk belum tersedia.');
  }
  const match = await resolveMatch(interest, dependencies);
  const status = match.primary ? 'ditawarkan' as const : 'mencari_promotor' as const;
  const lead = await createLead({ interest, idempotencyKey, status, match: snapshot(match) });
  return {
    lead,
    reference: `KSF-${lead.id}`,
    status: lead.status ?? status,
    match: publicMatch(match),
    checkoutUrl,
  };
}

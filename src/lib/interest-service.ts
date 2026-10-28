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

import type { ReferralSource } from './referral-service';

type CheckoutResolver = (productKey: string) => Promise<string>;
type MatchResolver = (interest: InterestInput) => Promise<PromoterMatch>;
type PromoterResolver = (regionCode: string) => Promise<PublicPromoter[]>;
type LeadCreator = (command: CreateInterestLeadCommand) => Promise<StoredLead | { id: number; leadType?: string; status?: string }>;

export type SubmissionDependencies = {
  createLead?: LeadCreator;
  /** Only a server-validated cookie resolver may supply this dependency. */
  referralSource?: ReferralSource | null;
  findMatch?: MatchResolver;
  findPromoters?: PromoterResolver;
  /** Accepted only for old callers; public submissions never resolve a checkout URL. */
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
    const source = interest.consentToShare ? dependencies.referralSource : null;
    const lead = await createLead({ interest, idempotencyKey, status, match: source ? referralSnapshot(source) : null, source });
    return {
      lead,
      reference: `KSF-${lead.id}`,
      status: lead.status ?? status,
      match: null,
    };
  }

  const source = interest.consentToShare ? dependencies.referralSource : null;
  const match = source ? { method: 'referral' as const, primary: { code: source.promoterCode, name: source.name, branchCode: source.branchCode, area: source.area, province: '', active: true, regionCodes: [], mappingSource: 'unresolved' as const }, candidates: [] } : await resolveMatch(interest, dependencies);
  const status = match.primary ? 'ditawarkan' as const : 'mencari_promotor' as const;
  const lead = await createLead({ interest, idempotencyKey, status, match: source ? referralSnapshot(source) : snapshot(match), source });
  return {
    lead,
    reference: `KSF-${lead.id}`,
    status: lead.status ?? status,
    match: publicMatch(match),
  };
}

function referralSnapshot(source: ReferralSource): LeadMatchSnapshot {
 return {matchMethod:'referral',assignedPromoterCode:source.promoterCode,matchedPromoterName:source.name,matchedBranchCode:source.branchCode,candidates:[]};
}

export type LeadType = 'test_service' | 'promoter_candidate';

export const testServiceStatuses = [
  'baru', 'mencari_promotor', 'ditawarkan', 'diklaim', 'dijadwalkan', 'selesai', 'ditutup',
] as const;

export const promoterCandidateStatuses = [
  'baru', 'dihubungi', 'konsultasi', 'mengikuti_preview', 'mengikuti_wsl', 'aktivasi', 'selesai', 'ditutup',
] as const;

export const leadStatuses = [...new Set([...testServiceStatuses, ...promoterCandidateStatuses])] as const;

export type TestServiceStatus = typeof testServiceStatuses[number];
export type PromoterCandidateStatus = typeof promoterCandidateStatuses[number];
export type LeadStatus = TestServiceStatus | PromoterCandidateStatus;
export type PaymentStatus = 'belum_dicek' | 'menunggu' | 'dibayar' | 'gagal' | 'dikembalikan';
export type MatchMethod = 'manual' | 'automatic' | 'province' | 'area' | 'none';

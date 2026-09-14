import type { LeadStatus, LeadType } from './lead-domain';

export const crmGroups = ['prospect', 'client', 'candidate', 'promoter'] as const;
export type CrmGroup = typeof crmGroups[number];
export const crmLabels: Record<CrmGroup, string> = {
  prospect: 'Calon Klien', client: 'Klien', candidate: 'Calon Promotor', promoter: 'Promotor Jaringan',
};
export function crmGroup(lead: { leadType: LeadType; status: LeadStatus }): CrmGroup {
  return lead.leadType === 'test_service'
    ? lead.status === 'selesai' ? 'client' : 'prospect'
    : lead.status === 'selesai' ? 'promoter' : 'candidate';
}
export function crmType(group: CrmGroup): LeadType {
  return group === 'client' || group === 'prospect' ? 'test_service' : 'promoter_candidate';
}
export function crmInitialStatus(group: CrmGroup): LeadStatus {
  return group === 'client' || group === 'promoter' ? 'selesai' : 'baru';
}

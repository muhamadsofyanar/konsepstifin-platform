import { describe, it, expect } from 'vitest';
import { crmGroup, crmInitialStatus, crmType, crmGroups } from './crm-domain';
import { validateContactUpdate } from './interest-store';

describe('CRM lifecycle', () => {
  it('maps each manual group back to the same group', () => {
    for (const group of crmGroups) expect(crmGroup({ leadType: crmType(group), status: crmInitialStatus(group) })).toBe(group);
  });
  it('keeps activation candidates and closed prospects out of active groups', () => {
    expect(crmGroup({ leadType: 'promoter_candidate', status: 'aktivasi' })).toBe('candidate');
    expect(crmGroup({ leadType: 'test_service', status: 'ditutup' })).toBe('prospect');
  });
  it('validates optional contact edits and normalizes phones', () => {
    expect(validateContactUpdate({ phone: '0812-3456-7890' })).toEqual({ phone: '6281234567890' });
    expect(validateContactUpdate({})).toEqual({});
    expect(() => validateContactUpdate({ email: 'invalid' })).toThrow();
    expect(() => validateContactUpdate({ name: 'A' })).toThrow();
    expect(() => validateContactUpdate({ phone: '123' })).toThrow();
    expect(() => validateContactUpdate({ city: '' })).toThrow();
  });
});

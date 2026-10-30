import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessScope, canReadLead, projectPromoterLead, validatePromoterPatch } from '../../src/lib/identity/access-policy.ts';

const promoter = { userId: 'p1', roles: ['promoter'], active: true, sessionValid: true, promoterCode: 'PRO-1' };
const admin = { ...promoter, roles: ['admin'], promoterCode: null };
const lead = { id: 1, assignedPromoterCode: 'PRO-1', consentToShare: true, name: 'Synthetic', phone: '000', email: 'test@example.invalid', city: 'Test', status: 'baru', internalNotes: 'private', saleAmount: 550000, sourcePromoter: 'PRO-2' };

test('anonymous has no scope', () => assert.deepEqual(accessScope(null), { kind: 'none' }));
test('active admin receives all scope', () => assert.deepEqual(accessScope(admin), { kind: 'all' }));
test('inactive admin denied', () => assert.deepEqual(accessScope({ ...admin, active: false }), { kind: 'none' }));
test('revoked session denied', () => assert.equal(canReadLead({ ...promoter, sessionValid: false }, lead), false));
test('unknown role denied', () => assert.deepEqual(accessScope({ ...promoter, roles: ['editor'] }), { kind: 'none' }));
test('unmapped promoter denied', () => assert.deepEqual(accessScope({ ...promoter, promoterCode: '' }), { kind: 'none' }));
test('promoter scope requires sharing consent', () => assert.deepEqual(accessScope(promoter), { kind: 'assigned', promoterCode: 'PRO-1', consentToShare: true }));
test('assigned consenting lead readable', () => assert.equal(canReadLead(promoter, lead), true));
test('other promoter lead denied even if source matches', () => assert.equal(canReadLead(promoter, { ...lead, assignedPromoterCode: 'PRO-2', sourcePromoter: 'PRO-1' }), false));
test('withdrawn consent denied', () => assert.equal(canReadLead(promoter, { ...lead, consentToShare: false }), false));
test('admin retains authorized internal read', () => assert.equal(canReadLead(admin, { ...lead, consentToShare: false }), true));
test('reassignment removes previous access', () => assert.equal(canReadLead(promoter, { ...lead, assignedPromoterCode: 'PRO-3' }), false));
test('public DTO excludes internal and financial fields', () => assert.deepEqual(projectPromoterLead(promoter, lead), { id: 1, name: 'Synthetic', phone: '000', email: 'test@example.invalid', city: 'Test', status: 'baru' }));
test('DTO refuses unauthorized lead', () => assert.throws(() => projectPromoterLead(promoter, { ...lead, consentToShare: false }), /Access denied/));
test('forged truthy active flag denied', () => assert.deepEqual(accessScope({ ...admin, active: 'yes' }), { kind: 'none' }));
test('empty account denied', () => assert.deepEqual(accessScope({ ...admin, userId: '' }), { kind: 'none' }));
test('accept operational status from server allowlist', () => assert.deepEqual(validatePromoterPatch({ status: 'dijadwalkan' }, ['baru', 'dijadwalkan']), { status: 'dijadwalkan' }));
for (const key of ['role', 'saleAmount', 'paymentStatus', 'assignedPromoterCode', 'consentToShare', 'internalNotes', 'sourcePromoter']) {
  test(`reject injected ${key}`, () => assert.throws(() => validatePromoterPatch({ status: 'baru', [key]: 'injected' }, ['baru']), /Field not allowed/));
}
test('reject invalid status', () => assert.throws(() => validatePromoterPatch({ status: 'paid' }, ['baru']), /Invalid status/));
test('reject empty update', () => assert.throws(() => validatePromoterPatch({}, ['baru']), /Empty update/));
test('reject array payload', () => assert.throws(() => validatePromoterPatch([], ['baru']), /Invalid payload/));
test('trim bounded activity note', () => assert.deepEqual(validatePromoterPatch({ activityNote: ' contacted ' }, ['baru']), { activityNote: 'contacted' }));
test('reject oversized activity note', () => assert.throws(() => validatePromoterPatch({ activityNote: 'x'.repeat(2001) }, ['baru']), /Invalid activity note/));

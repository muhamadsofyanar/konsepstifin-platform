import { expect, it } from 'vitest';
import { defaultPromotionSettings, familyPromoTotal, promotionIsActive } from './promotion-store';

it('keeps the central campaign active on inclusive Jakarta dates', () => {
  const settings = defaultPromotionSettings();
  expect(promotionIsActive(settings, new Date('2026-10-27T17:00:00.000Z'))).toBe(true);
  expect(promotionIsActive(settings, new Date('2026-12-31T16:59:59.000Z'))).toBe(true);
  expect(promotionIsActive(settings, new Date('2026-12-31T17:00:00.000Z'))).toBe(false);
});

it('calculates Family Test minimums from paid tests only', () => {
  const settings = defaultPromotionSettings();
  expect(familyPromoTotal(settings, 'family-3-1')).toMatchObject({ paidTests: 3, freeTests: 1, totalParticipants: 4, minimumTotal: 1_500_000 });
  expect(familyPromoTotal(settings, 'family-4-1')).toMatchObject({ totalParticipants: 5, minimumTotal: 2_000_000 });
  expect(familyPromoTotal(settings, 'family-7-2')).toMatchObject({ totalParticipants: 9, minimumTotal: 3_500_000 });
  expect(familyPromoTotal(settings, 'not-a-promo')).toBeNull();
});

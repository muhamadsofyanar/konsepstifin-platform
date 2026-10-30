import { describe, expect, it } from 'vitest';
import { calculateLines, paymentStatus, validateMoney } from '../../src/lib/commerce-domain';
describe('commerce amounts', () => {
 it('snapshots agreed lines and calculates integer Rupiah', () => { expect(calculateLines([{ name:' Tes ',unitPrice:250000,quantity:2 }])).toEqual({lines:[{name:'Tes',unitPrice:250000,quantity:2}],total:500000}); });
 it.each([-1, 1.5, Number.MAX_SAFE_INTEGER, '1000', NaN])('rejects invalid money %s', value => { expect(()=>validateMoney(value)).toThrow(); });
 it('rejects overflowing totals and empty lines',()=>{ expect(()=>calculateLines([])).toThrow(); expect(()=>calculateLines([{name:'A',unitPrice:999999999999,quantity:99999}])).toThrow(); });
 it('derives status from ledger balance',()=>{ expect(paymentStatus(100,0)).toBe('unpaid'); expect(paymentStatus(100,40)).toBe('partial'); expect(paymentStatus(100,100)).toBe('paid'); });
});

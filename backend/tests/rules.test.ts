import { describe, it, expect } from 'vitest';
import {
  isWithinWindow,
  isItemEligible,
  validateReturnRequest,
  RETURN_WINDOW_DAYS,
  type OrderItemState,
  type OrderState,
  type RequestedLine,
} from '../src/domain/rules.js';

const NOW = new Date('2026-09-18T12:00:00Z');

const daysBefore = (n: number): Date => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
};

const item = (over: Partial<OrderItemState> = {}): OrderItemState => ({
  id: 1,
  quantity: 3,
  isSale: false,
  category: 'accessory',
  alreadyRequested: 0,
  ...over,
});

const order = (items: OrderItemState[], orderedDaysAgo = 5): OrderState => ({
  orderedAt: daysBefore(orderedDaysAgo),
  items,
});

const line = (over: Partial<RequestedLine> = {}): RequestedLine => ({
  orderItemId: 1,
  quantity: 1,
  reason: 'changed_mind',
  ...over,
});

/** Convenience: the set of error codes a validation produced. */
const codes = (o: OrderState, lines: RequestedLine[]): string[] =>
  validateReturnRequest(o, lines, NOW).errors.map((e) => e.code);

// ---------------------------------------------------------------------------

describe('return window', () => {
  it('is 30 days, per the AGB (not the 14 in the owner’s email — see REFINEMENT Q1)', () => {
    expect(RETURN_WINDOW_DAYS).toBe(30);
  });

  it.each([
    ['ordered today', 0, true],
    ['one day before the deadline', 29, true],
    ['exactly on the deadline', 30, true],
    ['one day after the deadline', 31, false],
    ['long expired', 90, false],
  ])('%s -> %s', (_label, daysAgo, expected) => {
    expect(isWithinWindow(daysBefore(daysAgo as number), NOW)).toBe(expected);
  });
});

describe('item eligibility', () => {
  it.each([
    ['plain accessory', { isSale: false, category: 'accessory' as const }, true],
    ['sale accessory', { isSale: true, category: 'accessory' as const }, false],
    ['tea / food', { isSale: false, category: 'food' as const }, false],
    ['tea on sale', { isSale: true, category: 'food' as const }, false],
  ])('%s + changed_mind -> %s', (_label, attrs, expected) => {
    expect(isItemEligible(attrs, 'changed_mind')).toBe(expected);
  });

  it.each([
    ['sale accessory', { isSale: true, category: 'accessory' as const }],
    ['tea / food', { isSale: false, category: 'food' as const }],
    ['tea on sale', { isSale: true, category: 'food' as const }],
  ])('%s + damaged -> accepted despite the exclusion', (_label, attrs) => {
    expect(isItemEligible(attrs, 'damaged')).toBe(true);
  });

  it('treats wrong_item and other like changed_mind for exclusions', () => {
    const sale = { isSale: true, category: 'accessory' as const };
    expect(isItemEligible(sale, 'wrong_item')).toBe(false);
    expect(isItemEligible(sale, 'other')).toBe(false);
  });
});

describe('validateReturnRequest', () => {
  it('accepts a normal partial return (2 of 3 mugs)', () => {
    const result = validateReturnRequest(
      order([item({ quantity: 3 })]),
      [line({ quantity: 2 })],
      NOW,
    );
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects everything once the window has closed', () => {
    expect(codes(order([item()], 31), [line()])).toContain('OUTSIDE_WINDOW');
  });

  it('applies the window to damaged items too (warranty claims go via email)', () => {
    expect(codes(order([item()], 31), [line({ reason: 'damaged' })])).toContain('OUTSIDE_WINDOW');
  });

  it('rejects an empty submission', () => {
    expect(codes(order([item()]), [])).toEqual(['NO_ITEMS']);
  });

  describe('quantity', () => {
    it.each([
      ['zero', 0],
      ['negative', -1],
      ['fractional', 1.5],
    ])('rejects a %s quantity', (_label, quantity) => {
      expect(codes(order([item()]), [line({ quantity: quantity as number })])).toContain(
        'INVALID_QUANTITY',
      );
    });

    it('rejects more than was ordered', () => {
      expect(codes(order([item({ quantity: 2 })]), [line({ quantity: 3 })])).toContain(
        'QUANTITY_EXCEEDS_REMAINING',
      );
    });

    it('counts against quantity already requested: 3 of the remaining 3 is fine', () => {
      const o = order([item({ quantity: 4, alreadyRequested: 1 })]);
      expect(validateReturnRequest(o, [line({ quantity: 3 })], NOW).valid).toBe(true);
    });

    it('counts against quantity already requested: the 4th is not', () => {
      const o = order([item({ quantity: 4, alreadyRequested: 1 })]);
      expect(codes(o, [line({ quantity: 4 })])).toContain('QUANTITY_EXCEEDS_REMAINING');
    });

    it('reports how many are actually left', () => {
      const o = order([item({ quantity: 4, alreadyRequested: 1 })]);
      const [err] = validateReturnRequest(o, [line({ quantity: 4 })], NOW).errors;
      expect(err.message).toContain('3');
    });
  });

  describe('eligibility in context', () => {
    it('rejects a sale item returned because the customer changed their mind', () => {
      expect(codes(order([item({ isSale: true })]), [line()])).toContain('ITEM_NOT_ELIGIBLE');
    });

    it('rejects tea returned because the customer changed their mind', () => {
      expect(codes(order([item({ category: 'food' })]), [line()])).toContain('ITEM_NOT_ELIGIBLE');
    });

    it('accepts that same tea when it arrived damaged', () => {
      const o = order([item({ category: 'food' })]);
      expect(validateReturnRequest(o, [line({ reason: 'damaged' })], NOW).valid).toBe(true);
    });
  });

  describe('malformed submissions', () => {
    it('rejects an item that belongs to a different order', () => {
      expect(codes(order([item({ id: 1 })]), [line({ orderItemId: 99 })])).toContain(
        'ITEM_NOT_IN_ORDER',
      );
    });

    it('rejects the same line listed twice', () => {
      expect(codes(order([item()]), [line(), line()])).toContain('DUPLICATE_ITEM');
    });
  });

  describe('all-or-nothing', () => {
    it('fails the whole request when one line is ineligible', () => {
      const o = order([
        item({ id: 1, category: 'accessory' }),
        item({ id: 2, category: 'food' }),
      ]);
      const result = validateReturnRequest(
        o,
        [line({ orderItemId: 1 }), line({ orderItemId: 2 })],
        NOW,
      );
      expect(result.valid).toBe(false);
    });

    it('reports every problem at once instead of stopping at the first', () => {
      const o = order([item({ id: 1, isSale: true }), item({ id: 2, quantity: 1 })], 31);
      const found = codes(o, [line({ orderItemId: 1 }), line({ orderItemId: 2, quantity: 5 })]);
      expect(found).toEqual(
        expect.arrayContaining([
          'OUTSIDE_WINDOW',
          'ITEM_NOT_ELIGIBLE',
          'QUANTITY_EXCEEDS_REMAINING',
        ]),
      );
    });

    it('attaches the offending line id to per-item errors', () => {
      const o = order([item({ id: 7, isSale: true })]);
      const [err] = validateReturnRequest(o, [line({ orderItemId: 7 })], NOW).errors;
      expect(err.orderItemId).toBe(7);
    });
  });
});

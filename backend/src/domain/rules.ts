export const RETURN_WINDOW_DAYS = 30;

export const REASONS = ['wrong_item', 'damaged', 'changed_mind', 'other'] as const;
export type ReturnReason = (typeof REASONS)[number];

export const STATUSES = ['open', 'approved', 'rejected'] as const;
export type ReturnStatus = (typeof STATUSES)[number];

export type Category = 'food' | 'accessory';

const isOneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === 'string' && (values as readonly string[]).includes(value);

export const isReturnReason = isOneOf(REASONS);
export const isReturnStatus = isOneOf(STATUSES);

export interface OrderItemState {
  id: number;
  quantity: number;
  isSale: boolean;
  category: Category;
  alreadyRequested: number;
}

export interface OrderState {
  orderedAt: Date;
  items: OrderItemState[];
}

export interface RequestedLine {
  orderItemId: number;
  quantity: number;
  reason: ReturnReason;
}

export interface ValidationError {
  orderItemId?: number;
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

type Item = Pick<OrderItemState, 'isSale' | 'category'>;

export function isWithinWindow(orderedAt: Date, now: Date = new Date()): boolean {
  const deadline = new Date(orderedAt);
  deadline.setDate(deadline.getDate() + RETURN_WINDOW_DAYS);
  return now <= deadline;
}

/** Sale items are final; tea is food and excluded for hygiene (assumption A2). */
export function isExcludedFromReturns(item: Item): boolean {
  return item.isSale || item.category === 'food';
}

/** `damaged` is always accepted, which overrides the exclusions. */
export function isItemEligible(item: Item, reason: ReturnReason): boolean {
  return reason === 'damaged' || !isExcludedFromReturns(item);
}

function checkLine(
  line: RequestedLine,
  item: OrderItemState | undefined,
  alreadySeen: boolean,
): ValidationError | null {
  const on = (code: string, message: string) => ({ orderItemId: line.orderItemId, code, message });

  if (!item) return on('ITEM_NOT_IN_ORDER', 'This item does not belong to the order.');
  if (alreadySeen) return on('DUPLICATE_ITEM', 'This item was listed more than once.');

  if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
    return on('INVALID_QUANTITY', 'Quantity must be a positive whole number.');
  }

  if (!isItemEligible(item, line.reason)) {
    return on(
      'ITEM_NOT_ELIGIBLE',
      item.isSale
        ? 'Sale items cannot be returned.'
        : 'This item cannot be returned (opened food is excluded for hygiene reasons).',
    );
  }

  const remaining = item.quantity - item.alreadyRequested;
  if (line.quantity > remaining) {
    return on('QUANTITY_EXCEEDS_REMAINING', `Only ${remaining} of this item can still be returned.`);
  }

  return null;
}

/** Collects every violation rather than stopping at the first, so the customer sees them all at once. */
export function validateReturnRequest(
  order: OrderState,
  lines: RequestedLine[],
  now: Date = new Date(),
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isWithinWindow(order.orderedAt, now)) {
    errors.push({
      code: 'OUTSIDE_WINDOW',
      message: `The ${RETURN_WINDOW_DAYS}-day return window has passed for this order.`,
    });
  }

  if (lines.length === 0) {
    errors.push({ code: 'NO_ITEMS', message: 'No items were selected for return.' });
  }

  const itemsById = new Map(order.items.map((item) => [item.id, item]));
  const seen = new Set<number>();

  for (const line of lines) {
    const error = checkLine(line, itemsById.get(line.orderItemId), seen.has(line.orderItemId));
    seen.add(line.orderItemId);
    if (error) errors.push(error);
  }

  return { valid: errors.length === 0, errors };
}

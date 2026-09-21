import {
  findOrder,
  insertReturnRequest,
  nextReturnNumber,
  reservedByItem,
  type OrderWithItems,
} from '../persistence/returns.repository.js';
import { SerializationConflict, runSerializable } from '../persistence/transaction.js';
import { ReturnConflict, ReturnRulesViolation } from './errors.js';
import {
  isExcludedFromReturns,
  isWithinWindow,
  validateReturnRequest,
  type RequestedLine,
} from './rules.js';

export function findOrderByCredentials(orderNumber: string, email: string) {
  return findOrder(orderNumber, email);
}

export async function buildOrderView(order: OrderWithItems) {
  const reserved = await reservedByItem(order.id);

  return {
    orderNumber: order.orderNumber,
    orderedAt: order.orderedAt,
    withinWindow: isWithinWindow(order.orderedAt),
    items: order.items.map((item) => {
      const alreadyRequested = reserved.get(item.id) ?? 0;
      return {
        id: item.id,
        name: item.name,
        orderedQuantity: item.quantity,
        alreadyRequested,
        returnableQuantity: Math.max(0, item.quantity - alreadyRequested),
        isSale: item.isSale,
        category: item.category,
        // UX hint only; the server re-decides on submit, and `damaged` overrides it.
        eligibleWithoutDamage: !isExcludedFromReturns(item),
      };
    }),
  };
}

/**
 * Reads reserved quantities, validates and writes inside ONE serializable
 * transaction. Reading outside it let two simultaneous submissions both see the
 * same "already requested" total and together return more than was ordered.
 */
export async function createReturnRequest(order: OrderWithItems, lines: RequestedLine[]) {
  try {
    return await runSerializable(async (tx) => {
      const reserved = await reservedByItem(order.id, tx);

      const result = validateReturnRequest(
        {
          orderedAt: order.orderedAt,
          items: order.items.map((item) => ({
            ...item,
            alreadyRequested: reserved.get(item.id) ?? 0,
          })),
        },
        lines,
      );

      if (!result.valid) throw new ReturnRulesViolation(result.errors);

      return insertReturnRequest(tx, order.id, await nextReturnNumber(tx), lines);
    });
  } catch (err) {
    if (err instanceof SerializationConflict) throw new ReturnConflict();
    throw err;
  }
}

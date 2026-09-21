import {
  findReturnRequestWithItems,
  listReturnRequests,
  reservedByItem,
  updateReturnRequestStatus,
} from '../persistence/returns.repository.js';
import { SerializationConflict, runSerializable } from '../persistence/transaction.js';
import { ReturnConflict, ReturnRequestNotFound, ReturnRulesViolation } from './errors.js';
import { checkReinstatement, reservesQuantity, type ReturnStatus } from './rules.js';

export function listReturns() {
  return listReturnRequests();
}

/**
 * Status decides whether a request reserves quantity: rejecting one frees its
 * items for new requests. Moving it out of `rejected` takes them back, so that
 * is re-checked against what is left, in ONE serializable transaction with the
 * write. Otherwise a customer submitting at the same moment could claim the
 * same items and together they would exceed what was ordered.
 */
export async function setReturnStatus(id: number, status: ReturnStatus) {
  try {
    return await runSerializable(async (tx) => {
      const request = await findReturnRequestWithItems(id, tx);
      if (!request) throw new ReturnRequestNotFound();

      if (!reservesQuantity(request.status) && reservesQuantity(status)) {
        // This request is rejected, so it is not part of `reserved`.
        const reserved = await reservedByItem(request.orderId, tx);
        const errors = checkReinstatement(
          request.items,
          request.items.map(({ orderItem }) => ({
            ...orderItem,
            alreadyRequested: reserved.get(orderItem.id) ?? 0,
          })),
        );
        if (errors.length > 0) throw new ReturnRulesViolation(errors);
      }

      return updateReturnRequestStatus(id, status, tx);
    });
  } catch (err) {
    if (err instanceof SerializationConflict) throw new ReturnConflict();
    throw err;
  }
}

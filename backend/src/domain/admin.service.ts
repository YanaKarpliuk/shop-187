import {
  findReturnRequestById,
  listReturnRequests,
  updateReturnRequestStatus,
} from '../persistence/returns.repository.js';
import { ReturnRequestNotFound } from './errors.js';
import type { ReturnStatus } from './rules.js';

export function listReturns() {
  return listReturnRequests();
}

/** Status decides whether a request still reserves quantity, so rejecting one frees its items. */
export async function setReturnStatus(id: number, status: ReturnStatus) {
  const existing = await findReturnRequestById(id);
  if (!existing) throw new ReturnRequestNotFound();

  return updateReturnRequestStatus(id, status);
}

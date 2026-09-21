import {
  findReturnRequestById,
  listReturnRequests,
  updateReturnRequestStatus,
  type ReturnStatus,
} from '../persistence/returns.repository.js';
import { ReturnRequestNotFound } from './errors.js';

export const OWNER_STATUSES = ['open', 'approved', 'rejected'] as const satisfies readonly ReturnStatus[];
export type OwnerStatus = ReturnStatus;

export function isOwnerStatus(value: unknown): value is OwnerStatus {
  return typeof value === 'string' && (OWNER_STATUSES as readonly string[]).includes(value);
}

export function listReturns() {
  return listReturnRequests();
}

/** Status decides whether a request still reserves quantity, so rejecting one frees its items. */
export async function setReturnStatus(id: number, status: OwnerStatus) {
  const existing = await findReturnRequestById(id);
  if (!existing) throw new ReturnRequestNotFound();

  return updateReturnRequestStatus(id, status);
}

import { Prisma, type $Enums } from '@prisma/client';
import { prisma } from './client.js';
import {
  RESERVING_STATUSES,
  type Category,
  type RequestedLine,
  type ReturnReason,
  type ReturnStatus,
} from '../domain/rules.js';

/** The shared client or a transaction handle, so a query can join the submission transaction. */
export type Db = typeof prisma | Prisma.TransactionClient;

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof findOrder>>>;

// Compile-time guard: the domain lists must match the database enums exactly.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const domainMatchesSchema: Same<ReturnReason, $Enums.ReturnReason> &
  Same<ReturnStatus, $Enums.ReturnStatus> &
  Same<Category, $Enums.Category> = true;

/**
 * Both fields must match the same order. Returns null on any mismatch.
 */
export function findOrder(orderNumber: string, email: string) {
  return prisma.order.findUnique({
    where: {
      orderNumber: orderNumber.trim().toUpperCase(),
      email: { equals: email.trim(), mode: 'insensitive' },
    },
    include: { items: true },
  });
}

/** Quantity reserved per order item. Rejected requests release theirs. */
export async function reservedByItem(orderId: number, db: Db = prisma) {
  const grouped = await db.returnRequestItem.groupBy({
    by: ['orderItemId'],
    where: { returnRequest: { orderId, status: { in: [...RESERVING_STATUSES] } } },
    _sum: { quantity: true },
  });

  return new Map(grouped.map((row) => [row.orderItemId, row._sum.quantity ?? 0]));
}

/** A sequence, not a row count: atomic, and unaffected by deleted rows. */
export async function nextReturnNumber(tx: Prisma.TransactionClient) {
  const [{ n }] = await tx.$queryRaw<{ n: bigint }[]>`
    SELECT nextval('return_request_number_seq') AS n
  `;
  return `RET-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
}

export function insertReturnRequest(
  tx: Prisma.TransactionClient,
  orderId: number,
  returnNumber: string,
  lines: RequestedLine[],
) {
  return tx.returnRequest.create({
    data: {
      orderId,
      returnNumber,
      status: 'open',
      items: { create: lines },
    },
    include: { items: true },
  });
}

export function listReturnRequests() {
  return prisma.returnRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      order: { select: { orderNumber: true, email: true } },
      items: { include: { orderItem: { select: { name: true } } } },
    },
  });
}

/** With each line's ordered quantity, which a status change has to re-check against. */
export function findReturnRequestWithItems(id: number, db: Db = prisma) {
  return db.returnRequest.findUnique({
    where: { id },
    include: { items: { include: { orderItem: true } } },
  });
}

export function updateReturnRequestStatus(id: number, status: ReturnStatus, db: Db = prisma) {
  return db.returnRequest.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });
}

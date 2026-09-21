// Every Prisma query. Decides nothing: no eligibility, no window, no status rules.

import { Prisma, type $Enums } from '@prisma/client';
import { prisma } from './client.js';

/** The shared client or a transaction handle, so a query can join the submission transaction. */
export type Db = typeof prisma | Prisma.TransactionClient;

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof findOrder>>>;

// From Prisma's generated enums, so they cannot drift from db/schema.prisma.
export type ReturnStatus = $Enums.ReturnStatus;
export type ReturnReason = $Enums.ReturnReason;

export interface ReturnLineRow {
  orderItemId: number;
  quantity: number;
  reason: ReturnReason;
}

/**
 * Both fields must match the same order. Returns null on any mismatch.
 *
 * findUnique, not findFirst: order_number carries a unique index, so at most
 * one row can match. It also throws rather than guessing if orderNumber is ever
 * missing, instead of silently matching on email alone.
 */
export function findOrder(orderNumber: string, email: string) {
  return prisma.order.findUnique({
    where: {
      orderNumber: orderNumber.trim(),
      email: { equals: email.trim(), mode: 'insensitive' },
    },
    include: { items: true },
  });
}

/** Quantity reserved per order item. Rejected requests release theirs (assumption A4). */
export async function reservedByItem(orderId: number, db: Db = prisma) {
  const grouped = await db.returnRequestItem.groupBy({
    by: ['orderItemId'],
    where: { returnRequest: { orderId, status: { in: ['open', 'approved'] } } },
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
  lines: ReturnLineRow[],
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

export function findReturnRequestById(id: number) {
  return prisma.returnRequest.findUnique({ where: { id } });
}

export async function updateReturnRequestStatus(id: number, status: ReturnStatus) {
  const { id: updatedId, status: updatedStatus } = await prisma.returnRequest.update({
    where: { id },
    data: { status },
  });
  return { id: updatedId, status: updatedStatus };
}

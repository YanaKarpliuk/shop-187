import { Router } from 'express';
import { ApiError, badRequest, notFound } from './errors.js';
import { isReturnReason, type RequestedLine } from '../domain/rules.js';
import {
  buildOrderView,
  createReturnRequest,
  findOrderByCredentials,
} from '../domain/returns.service.js';
import { ReturnConflict, ReturnRulesViolation } from '../domain/errors.js';

export const returnsRouter = Router();

function parseLine(raw: unknown): RequestedLine {
  const line = raw as Partial<RequestedLine> | null;

  if (
    !line ||
    typeof line.orderItemId !== 'number' ||
    typeof line.quantity !== 'number' ||
    !isReturnReason(line.reason)
  ) {
    throw badRequest(
      'Each item needs orderItemId, quantity and a valid reason (wrong_item, damaged, changed_mind, other).',
    );
  }

  // Rebuilt rather than passed through, so no extra properties reach the service.
  return { orderItemId: line.orderItemId, quantity: line.quantity, reason: line.reason };
}

function parseLines(items: unknown): RequestedLine[] {
  if (!Array.isArray(items)) {
    throw badRequest('orderNumber, email and items[] are required.');
  }
  return items.map(parseLine);
}

async function requireOrder(orderNumber: unknown, email: unknown) {
  if (typeof orderNumber !== 'string' || typeof email !== 'string') {
    throw badRequest('orderNumber and email are required.');
  }

  const order = await findOrderByCredentials(orderNumber, email);

  if (!order) throw notFound('ORDER_NOT_FOUND', 'No order matches those details.');

  return order;
}

returnsRouter.post('/lookup', async (req, res) => {
  const { orderNumber, email } = req.body ?? {};
  const order = await requireOrder(orderNumber, email);

  res.json(await buildOrderView(order));
});

returnsRouter.post('/returns', async (req, res) => {
  const { orderNumber, email, items } = req.body ?? {};
  const lines = parseLines(items);
  const order = await requireOrder(orderNumber, email);

  try {
    const created = await createReturnRequest(order, lines);
    res.status(201).json({
      returnNumber: created.returnNumber,
      status: created.status,
      items: created.items,
    });
  } catch (err) {
    if (err instanceof ReturnRulesViolation) {
      throw new ApiError(422, 'RETURN_INVALID', err.message, err.errors);
    }
    if (err instanceof ReturnConflict) {
      throw new ApiError(409, 'RETURN_CONFLICT', err.message);
    }
    throw err;
  }
});

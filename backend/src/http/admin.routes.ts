// UNAUTHENTICATED on purpose: auth is out of scope per SHOP-187.

import { Router } from 'express';
import { ApiError, badRequest, notFound } from './errors.js';
import { listReturns, setReturnStatus } from '../domain/admin.service.js';
import { isReturnStatus } from '../domain/rules.js';
import { ReturnConflict, ReturnRequestNotFound, ReturnRulesViolation } from '../domain/errors.js';

export const adminRouter = Router();

adminRouter.get('/returns', async (_req, res) => {
  res.json(await listReturns());
});

adminRouter.patch('/returns/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid return id.');

  const { status } = req.body ?? {};
  if (!isReturnStatus(status)) throw badRequest('status must be open, approved or rejected.');

  try {
    res.json(await setReturnStatus(id, status));
  } catch (err) {
    if (err instanceof ReturnRequestNotFound) {
      throw notFound('RETURN_NOT_FOUND', err.message);
    }
    if (err instanceof ReturnRulesViolation) {
      throw new ApiError(
        422,
        'REOPEN_EXCEEDS_REMAINING',
        'This request can no longer be reopened: its items were requested again after it was rejected.',
        err.errors,
      );
    }
    if (err instanceof ReturnConflict) {
      throw new ApiError(409, 'RETURN_CONFLICT', err.message);
    }
    throw err;
  }
});

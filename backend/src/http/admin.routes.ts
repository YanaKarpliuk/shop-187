// UNAUTHENTICATED on purpose: auth is out of scope per SHOP-187.

import { Router } from 'express';
import { badRequest, notFound } from './errors.js';
import { listReturns, setReturnStatus } from '../domain/admin.service.js';
import { isReturnStatus } from '../domain/rules.js';
import { ReturnRequestNotFound } from '../domain/errors.js';

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
    throw err;
  }
});

// UNAUTHENTICATED on purpose: auth is out of scope per SHOP-187.

import { Router } from 'express';
import { badRequest, notFound } from './errors.js';
import { isOwnerStatus, listReturns, setReturnStatus } from '../app/admin.service.js';
import { ReturnRequestNotFound } from '../app/errors.js';

export const adminRouter = Router();

adminRouter.get('/returns', async (_req, res) => {
  res.json(await listReturns());
});

adminRouter.patch('/returns/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid return id.');

  const { status } = req.body ?? {};
  if (!isOwnerStatus(status)) throw badRequest('status must be open, approved or rejected.');

  try {
    res.json(await setReturnStatus(id, status));
  } catch (err) {
    if (err instanceof ReturnRequestNotFound) {
      throw notFound('RETURN_NOT_FOUND', err.message);
    }
    throw err;
  }
});

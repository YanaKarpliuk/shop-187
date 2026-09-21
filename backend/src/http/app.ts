import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { returnsRouter } from './returns.routes.js';
import { ApiError } from './errors.js';

/** Kept separate from server start so tests can import the app. */
export function buildApp() {
  const app = express();

  // Off unless an origin is named: nginx and the Vite proxy both serve the API
  // on the page's own origin, so no cross-origin request is ever made.
  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  if (corsOrigin) {
    app.use(cors({ origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()) }));
  }

  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', returnsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found.' } });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
      res.status(err.status).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
      return;
    }

    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
  };
  app.use(errorHandler);

  return app;
}

import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const HEADER = 'x-request-id';

/** Usa el id entrante si es válido; si no, genera uno y lo devuelve siempre. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[HEADER];
  const candidate = typeof incoming === 'string' ? incoming.trim() : '';
  const requestId = candidate.length > 0 && candidate.length <= 200 ? candidate : randomUUID();

  req.headers[HEADER] = requestId;
  res.setHeader(HEADER, requestId);
  next();
}

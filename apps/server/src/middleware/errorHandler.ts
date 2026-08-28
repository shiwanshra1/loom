import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Validation failed', details: err.flatten() });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

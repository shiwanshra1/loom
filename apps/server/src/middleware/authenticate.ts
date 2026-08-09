import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@forge-loom/shared-types';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export interface AuthenticatedUser {
  userId: string;
  role: Role;
  collegeId?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);
  req.user = verifyAccessToken(token);
  next();
}

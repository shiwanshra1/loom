import type { NextFunction, Request, Response } from 'express';
import { Role } from '@forge-loom/shared-types';
import { ApiError } from '../utils/ApiError.js';

declare module 'express-serve-static-core' {
  interface Request {
    collegeFilter?: Record<string, unknown>;
  }
}

/**
 * Attaches req.collegeFilter for downstream repository queries to spread into
 * their Mongo filter. Forge Admin bypasses scoping entirely (national oversight
 * per architecture doc §4.3); every other college-scoped role is pinned to their
 * own collegeId so a mentor at College A can never query College B's data.
 */
export function scopeToCollege(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }

  if (req.user.role === Role.ForgeAdmin) {
    req.collegeFilter = {};
    return next();
  }

  if (!req.user.collegeId) {
    throw new ApiError(403, 'This account is not associated with a college');
  }

  req.collegeFilter = { collegeId: req.user.collegeId };
  next();
}

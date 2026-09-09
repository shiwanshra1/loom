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
 * their Prisma `where` clause. Forge Admin bypasses scoping entirely (national
 * oversight per architecture doc §4.3); every other college-scoped role is
 * pinned to their own collegeId so a mentor at College A can never query
 * College B's data.
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

/**
 * For read-only cross-college endpoints (Forge Admin hierarchy Phase 9's
 * drill-in view) that need a single resolved collegeId rather than a filter
 * object: a Forge Admin caller supplies `?collegeId=` explicitly (their own
 * `User.collegeId` is always null, so there's no "own college" to default
 * to); every other college-scoped role is pinned to their own collegeId,
 * ignoring anything passed in the query string.
 */
export function resolveViewedCollegeId(req: Request): string | undefined {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  if (req.user.role === Role.ForgeAdmin) {
    return typeof req.query.collegeId === 'string' ? req.query.collegeId : undefined;
  }
  return req.user.collegeId;
}

export function requireViewedCollegeId(req: Request): string {
  const collegeId = resolveViewedCollegeId(req);
  if (!collegeId) {
    throw new ApiError(
      403,
      'This account is not associated with a college, and no collegeId was provided'
    );
  }
  return collegeId;
}

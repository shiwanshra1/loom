import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@forge-loom/shared-types';
import { ApiError } from '../utils/ApiError.js';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have access to this resource');
    }
    next();
  };
}

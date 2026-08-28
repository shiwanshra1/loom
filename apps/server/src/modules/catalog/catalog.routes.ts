import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { list } from '../courses/course.controller.js';

// Thin wrapper over Phase 1's GET /courses (published-only, paginated) —
// a distinct path for the student-facing catalog rather than reusing
// /api/courses directly, so it can diverge later (e.g. student-specific
// framing or filters) without touching the course_admin-facing route.
export const catalogRouter = Router();

catalogRouter.get('/', authenticate, asyncHandler(list));

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getCourseProgress } from './courseProgress.controller.js';

// Mounted at /api/students, alongside session.routes.ts's attendance-history
// route — both are keyed by student id, per the roadmap's own path choice.
export const courseProgressRouter = Router();

courseProgressRouter.get('/:id/course-progress', authenticate, asyncHandler(getCourseProgress));

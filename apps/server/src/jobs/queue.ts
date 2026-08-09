import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

// Registered now so the connection/naming exists; the actual worker (score
// recompute per architecture doc §9) lands in Phase 4 alongside the score engine.
export const scoreRecalculationQueue = new Queue('score-recalculation', { connection: redis });

import { Redis } from 'ioredis';
import { env } from './env.js';

// maxRetriesPerRequest must be null on any connection BullMQ also touches.
export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

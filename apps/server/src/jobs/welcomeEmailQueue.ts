import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export interface WelcomeEmailJobData {
  userId: string;
  email: string;
  displayName: string;
  tempPassword: string;
}

export const WELCOME_EMAIL_QUEUE_NAME = 'welcome-email';
export const SEND_WELCOME_EMAIL_JOB = 'send-welcome-email';

export const welcomeEmailQueue = new Queue<WelcomeEmailJobData>(WELCOME_EMAIL_QUEUE_NAME, {
  connection: redis,
});

// A single CSV upload can enqueue hundreds of these at once — retry/backoff
// is configured here (not per-call-site) so every enqueue path gets the same
// resilience against a transient SMTP hiccup without needing to remember to
// pass options each time.
export async function enqueueWelcomeEmail(data: WelcomeEmailJobData): Promise<void> {
  await welcomeEmailQueue.add(SEND_WELCOME_EMAIL_JOB, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

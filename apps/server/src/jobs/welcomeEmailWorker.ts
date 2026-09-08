import { Worker, type Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { mailTransporter } from '../config/mail.js';
import { env } from '../config/env.js';
import {
  WELCOME_EMAIL_QUEUE_NAME,
  SEND_WELCOME_EMAIL_JOB,
  type WelcomeEmailJobData,
} from './welcomeEmailQueue.js';

async function sendWelcomeEmail(data: WelcomeEmailJobData): Promise<void> {
  const loginUrl = `${env.publicAppUrl}/login`;
  await mailTransporter.sendMail({
    from: env.mail.fromAddress,
    to: data.email,
    subject: 'Welcome to Forge Loom — your account is ready',
    text: [
      `Hi ${data.displayName},`,
      '',
      'Your Forge Loom account has been created. Here are your login details:',
      `  Email: ${data.email}`,
      `  Temporary password: ${data.tempPassword}`,
      '',
      `Log in at ${loginUrl} — you'll be asked to set a new password on first login.`,
    ].join('\n'),
  });
}

// Async, queued (not sent synchronously in the request handler) for the same
// reason recompute-score jobs are queued — a single CSV bulk-upload can
// enqueue hundreds of these, and blocking an HTTP request on hundreds of SMTP
// round-trips would be exactly the kind of problem BullMQ already exists to
// solve elsewhere in this codebase.
export function startWelcomeEmailWorker(): Worker<WelcomeEmailJobData> {
  return new Worker<WelcomeEmailJobData>(
    WELCOME_EMAIL_QUEUE_NAME,
    async (job: Job<WelcomeEmailJobData>) => {
      if (job.name === SEND_WELCOME_EMAIL_JOB) {
        await sendWelcomeEmail(job.data);
      }
    },
    {
      connection: redis,
      // Stay well under a typical transactional-SMTP provider's per-second
      // send cap even during a large bulk upload — tune to the real
      // provider's limits once one is actually configured.
      limiter: { max: 5, duration: 1000 },
    }
  );
}

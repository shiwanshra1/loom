import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  courseId: z.string().min(1),
});

export const verifyPaymentSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

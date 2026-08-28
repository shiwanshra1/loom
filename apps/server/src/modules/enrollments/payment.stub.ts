import { randomUUID } from 'node:crypto';
import type { EnrollmentDocument } from '../../models/Enrollment.js';

export interface PaymentResult {
  success: true;
  paymentRef: string;
}

// Stubbed gateway — always succeeds. Deliberately isolated so swapping in real
// Razorpay later (create order, verify signature, handle failure) is a
// one-function change: same signature, same call site, no flow rewrite.
export async function processPayment(enrollment: EnrollmentDocument): Promise<PaymentResult> {
  return Promise.resolve({
    success: true,
    paymentRef: `stub_${enrollment._id.toString()}_${randomUUID()}`,
  });
}

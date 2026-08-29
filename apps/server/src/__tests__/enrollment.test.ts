import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { Role } from '@forge-loom/shared-types';
import { buildApp, connectDb, disconnectDb, createTestUser } from './helpers.js';
import { CourseAdminProfileModel } from '../models/CourseAdminProfile.js';
import { CourseModel } from '../models/Course.js';
import { EnrollmentModel } from '../models/Enrollment.js';

// The only network call in the create-enrollment path is the outbound
// Razorpay order-creation request — mocked here so the suite is
// deterministic and offline. `verifyRazorpaySignature` (the security-
// critical half) is deliberately NOT mocked below: the test computes a real
// HMAC with the same test-mode key_secret the server uses and lets the real
// verification function judge it, exactly like Phase 8's manual live check.
vi.mock('../modules/enrollments/razorpay.client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../modules/enrollments/razorpay.client.js')>();
  return {
    ...actual,
    createRazorpayOrder: vi.fn(async (amountInPaise: number, currency: string) => ({
      id: `order_test_${Date.now()}`,
      amount: amountInPaise,
      currency,
    })),
  };
});

const app = buildApp();

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

async function createPublishedCourse(price: number) {
  const { user: adminUser } = await createTestUser(Role.CourseAdmin);
  const adminProfile = await CourseAdminProfileModel.create({
    userId: adminUser._id,
    name: 'Test Course Admin',
  });
  const course = await CourseModel.create({
    title: 'Test Course',
    createdBy: adminProfile._id,
    deliveryMode: 'online',
    durationHours: 10,
    durationDays: 5,
    price,
    status: 'published',
    syllabus: [],
  });
  return course;
}

describe('enrollment + payment flow', () => {
  it('creates a pending enrollment with a real Razorpay order id, then verifies payment with a correctly-computed signature', async () => {
    const { email, password } = await createTestUser(Role.Student);
    const course = await createPublishedCourse(499);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    const token = login.body.accessToken as string;

    const created = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString() });

    expect(created.status).toBe(201);
    expect(created.body.enrollment.status).toBe('pending_payment');
    expect(created.body.razorpay.orderId).toMatch(/^order_test_/);

    const enrollmentId = created.body.enrollment.id as string;
    const orderId = created.body.razorpay.orderId as string;
    const paymentId = 'pay_test_123';

    // Same algorithm as verifyRazorpaySignature: HMAC-SHA256("orderId|paymentId").
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET!;
    const validSignature = createHmac('sha256', razorpaySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const badVerify = await request(app)
      .post(`/api/enrollments/${enrollmentId}/verify-payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'not-a-real-signature',
      });
    expect(badVerify.status).toBe(400);

    const goodVerify = await request(app)
      .post(`/api/enrollments/${enrollmentId}/verify-payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });
    expect(goodVerify.status).toBe(200);
    expect(goodVerify.body.enrollment.status).toBe('active');

    const stored = await EnrollmentModel.findById(enrollmentId);
    expect(stored?.status).toBe('active');
    expect(stored?.paymentRef).toBe(paymentId);
  });

  it('blocks a second purchase of a course the student is already active in', async () => {
    const { email, password } = await createTestUser(Role.Student);
    const course = await createPublishedCourse(199);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    const token = login.body.accessToken as string;

    await EnrollmentModel.create({
      studentId: login.body.user.id,
      courseId: course._id,
      status: 'active',
      paymentAmount: 199,
    });

    const res = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString() });

    expect(res.status).toBe(409);
  });

  it('rejects enrollment for a role other than student', async () => {
    const { email, password } = await createTestUser(Role.Mentor);
    const course = await createPublishedCourse(99);
    const login = await request(app).post('/api/auth/login').send({ email, password });

    const res = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ courseId: course._id.toString() });

    expect(res.status).toBe(403);
  });
});

import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { createEnrollmentSchema, verifyPaymentSchema } from './enrollment.validation.js';
import * as enrollmentService from './enrollment.service.js';
import { toEnrollmentDto } from './enrollment.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${name}`);
  }
  return value;
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { courseId } = createEnrollmentSchema.parse(req.body);
  const { enrollment, course, order } = await enrollmentService.createEnrollment(
    user.userId,
    courseId
  );
  res.status(201).json({
    enrollment: toEnrollmentDto(enrollment, course),
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.razorpay.keyId,
    },
  });
}

export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = verifyPaymentSchema.parse(req.body);
  const { enrollment, course } = await enrollmentService.verifyEnrollmentPayment(
    requireParam(req, 'id'),
    user.userId,
    input
  );
  res.json({ enrollment: toEnrollmentDto(enrollment, course) });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const rows = await enrollmentService.listMyEnrollments(user.userId);
  res.json({
    enrollments: rows.map(({ enrollment, course }) => toEnrollmentDto(enrollment, course)),
  });
}

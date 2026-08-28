import { z } from 'zod';

export const markAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(['present', 'absent', 'excused']),
      })
    )
    .min(1),
});

export const updateSessionSchema = z
  .object({
    status: z.enum(['completed', 'cancelled']),
    cancelReason: z.string().min(1).optional(),
  })
  .refine((val) => val.status !== 'cancelled' || Boolean(val.cancelReason), {
    message: 'cancelReason is required when cancelling a session',
    path: ['cancelReason'],
  });

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

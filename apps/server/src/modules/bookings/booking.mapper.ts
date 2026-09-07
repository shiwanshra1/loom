import type { BookingDto } from '@forge-loom/shared-types';
import type { Booking } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export async function toBookingDto(booking: Booking): Promise<BookingDto> {
  const [requester, mentor] = await Promise.all([
    prisma.user.findUnique({ where: { id: booking.requesterId } }),
    prisma.user.findUnique({ where: { id: booking.mentorId } }),
  ]);

  return {
    id: booking.id,
    requesterId: booking.requesterId,
    requesterEmail: requester?.email ?? '',
    mentorId: booking.mentorId,
    mentorEmail: mentor?.email ?? '',
    title: booking.title,
    scheduledAt: booking.scheduledAt.toISOString(),
    durationMinutes: booking.durationMinutes,
    mode: booking.mode,
    status: booking.status,
    agenda: booking.agenda,
    note: booking.note ?? undefined,
    meetingLink: booking.meetingLink ?? undefined,
  };
}

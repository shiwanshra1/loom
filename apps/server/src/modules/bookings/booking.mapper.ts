import type { BookingDto } from '@forge-loom/shared-types';
import type { BookingDocument } from '../../models/Booking.js';
import { UserModel } from '../../models/User.js';

export async function toBookingDto(booking: BookingDocument): Promise<BookingDto> {
  const [requester, mentor] = await Promise.all([
    UserModel.findById(booking.requesterId),
    UserModel.findById(booking.mentorId),
  ]);

  return {
    id: booking._id.toString(),
    requesterId: booking.requesterId.toString(),
    requesterEmail: requester?.email ?? '',
    mentorId: booking.mentorId.toString(),
    mentorEmail: mentor?.email ?? '',
    title: booking.title,
    scheduledAt: booking.scheduledAt.toISOString(),
    durationMinutes: booking.durationMinutes,
    mode: booking.mode,
    status: booking.status,
    agenda: booking.agenda,
    note: booking.note,
    meetingLink: booking.meetingLink,
  };
}

import { Role } from '@forge-loom/shared-types';
import { BookingModel, type BookingDocument } from '../../models/Booking.js';
import { UserModel } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { createNotification } from '../notifications/notification.service.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateBookingInput, UpdateBookingInput } from './booking.validation.js';

// Either side can initiate — a Student booking a mentor, or a Mentor
// scheduling with one of their students — since both existing mock pages
// (Student's Mentor Sessions, Mentor's own Sessions) had their own
// "schedule" affordance. `counterpartEmail` is whichever role the caller
// isn't: a mentor's email when a student books, a student's email when a
// mentor schedules.
export async function createBooking(
  viewer: AuthenticatedUser,
  input: CreateBookingInput
): Promise<BookingDocument> {
  let requesterId: string;
  let mentorId: string;

  if (viewer.role === Role.Student) {
    const mentor = await UserModel.findOne({
      email: input.counterpartEmail,
      role: Role.Mentor,
      collegeId: viewer.collegeId,
    });
    if (!mentor) {
      throw new ApiError(
        400,
        `No mentor account found for ${input.counterpartEmail} at this college`
      );
    }
    requesterId = viewer.userId;
    mentorId = mentor._id.toString();
  } else {
    const student = await UserModel.findOne({
      email: input.counterpartEmail,
      role: Role.Student,
      collegeId: viewer.collegeId,
    });
    if (!student) {
      throw new ApiError(
        400,
        `No student account found for ${input.counterpartEmail} at this college`
      );
    }
    requesterId = student._id.toString();
    mentorId = viewer.userId;
  }

  const booking = await BookingModel.create({
    requesterId,
    mentorId,
    title: input.title,
    scheduledAt: new Date(input.scheduledAt),
    durationMinutes: input.durationMinutes ?? 30,
    agenda: input.agenda ?? [],
  });

  const notifyUserId = viewer.role === Role.Student ? mentorId : requesterId;
  await createNotification(
    notifyUserId,
    'booking_created',
    `New session scheduled: ${input.title}`,
    `Scheduled for ${new Date(input.scheduledAt).toLocaleString()}`
  );

  return booking;
}

export async function listMyBookings(viewer: AuthenticatedUser): Promise<BookingDocument[]> {
  const filter =
    viewer.role === Role.Mentor ? { mentorId: viewer.userId } : { requesterId: viewer.userId };
  return BookingModel.find(filter).sort({ scheduledAt: -1 });
}

function canManageBooking(booking: BookingDocument, viewer: AuthenticatedUser): boolean {
  return (
    booking.requesterId.toString() === viewer.userId ||
    booking.mentorId.toString() === viewer.userId
  );
}

export async function updateBooking(
  bookingId: string,
  viewer: AuthenticatedUser,
  input: UpdateBookingInput
): Promise<BookingDocument> {
  const booking = await BookingModel.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  if (!canManageBooking(booking, viewer)) {
    throw new ApiError(403, 'You do not have access to this booking');
  }

  if (input.note !== undefined) booking.note = input.note;
  if (input.meetingLink !== undefined) booking.meetingLink = input.meetingLink;

  if (input.status !== undefined && input.status !== booking.status) {
    booking.status = input.status;
    if (input.status === 'cancelled') {
      const otherPartyId =
        viewer.userId === booking.requesterId.toString()
          ? booking.mentorId.toString()
          : booking.requesterId.toString();
      await createNotification(
        otherPartyId,
        'booking_cancelled',
        `Session cancelled: ${booking.title}`
      );
    }
  }

  await booking.save();
  return booking;
}

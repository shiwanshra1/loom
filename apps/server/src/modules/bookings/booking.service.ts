import { Role } from '@forge-loom/shared-types';
import type { Booking, Role as PrismaRole } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { toPrismaEnum } from '../../utils/prismaEnum.js';
import { ApiError } from '../../utils/ApiError.js';
import { createNotification } from '../notifications/notification.service.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateBookingInput, UpdateBookingInput } from './booking.validation.js';

// Either side can initiate — a Student booking a mentor, or a Mentor
// scheduling with one of their students — since both existing mock pages
// (Student's Mentor Sessions, Mentor's own Sessions) had their own
// "schedule" affordance. `counterpartEmail` is whichever role the caller
// isn't: a mentor's email when a student books, a student's email when a
// mentor schedules. A Sponsor booking a College Admin (wireframe §6 "book a
// meet") reuses the same model/field names — `mentorId` just means
// "the other party" once a Sponsor is the requester.
export async function createBooking(
  viewer: AuthenticatedUser,
  input: CreateBookingInput
): Promise<Booking> {
  let requesterId: string;
  let mentorId: string;

  if (viewer.role === Role.Sponsor) {
    const collegeAdmin = await prisma.user.findFirst({
      where: { email: input.counterpartEmail, role: toPrismaEnum<PrismaRole>(Role.CollegeAdmin) },
    });
    if (!collegeAdmin) {
      throw new ApiError(400, `No college admin account found for ${input.counterpartEmail}`);
    }
    requesterId = viewer.userId;
    mentorId = collegeAdmin.id;
  } else if (viewer.role === Role.Student) {
    const mentor = await prisma.user.findFirst({
      where: {
        email: input.counterpartEmail,
        role: toPrismaEnum<PrismaRole>(Role.Mentor),
        collegeId: viewer.collegeId,
      },
    });
    if (!mentor) {
      throw new ApiError(
        400,
        `No mentor account found for ${input.counterpartEmail} at this college`
      );
    }
    requesterId = viewer.userId;
    mentorId = mentor.id;
  } else {
    const student = await prisma.user.findFirst({
      where: {
        email: input.counterpartEmail,
        role: toPrismaEnum<PrismaRole>(Role.Student),
        collegeId: viewer.collegeId,
      },
    });
    if (!student) {
      throw new ApiError(
        400,
        `No student account found for ${input.counterpartEmail} at this college`
      );
    }
    requesterId = student.id;
    mentorId = viewer.userId;
  }

  const booking = await prisma.booking.create({
    data: {
      requesterId,
      mentorId,
      title: input.title,
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes ?? 30,
      agenda: input.agenda ?? [],
    },
  });

  const notifyUserId = viewer.userId === requesterId ? mentorId : requesterId;
  await createNotification(
    notifyUserId,
    'booking_created',
    `New session scheduled: ${input.title}`,
    `Scheduled for ${new Date(input.scheduledAt).toLocaleString()}`
  );

  return booking;
}

export async function listMyBookings(viewer: AuthenticatedUser): Promise<Booking[]> {
  return prisma.booking.findMany({
    where: { OR: [{ requesterId: viewer.userId }, { mentorId: viewer.userId }] },
    orderBy: { scheduledAt: 'desc' },
  });
}

function canManageBooking(booking: Booking, viewer: AuthenticatedUser): boolean {
  return booking.requesterId === viewer.userId || booking.mentorId === viewer.userId;
}

export async function updateBooking(
  bookingId: string,
  viewer: AuthenticatedUser,
  input: UpdateBookingInput
): Promise<Booking> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }
  if (!canManageBooking(booking, viewer)) {
    throw new ApiError(403, 'You do not have access to this booking');
  }

  const statusChanged = input.status !== undefined && input.status !== booking.status;

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...(input.note !== undefined && { note: input.note }),
      ...(input.meetingLink !== undefined && { meetingLink: input.meetingLink }),
      ...(statusChanged && { status: input.status }),
    },
  });

  if (statusChanged && input.status === 'cancelled') {
    const otherPartyId =
      viewer.userId === booking.requesterId ? booking.mentorId : booking.requesterId;
    await createNotification(otherPartyId, 'booking_cancelled', `Session cancelled: ${booking.title}`);
  }

  return updated;
}

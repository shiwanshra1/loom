import type { Event } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateEventInput } from './event.validation.js';

export async function createEvent(host: AuthenticatedUser, input: CreateEventInput): Promise<Event> {
  return prisma.event.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      hostedBy: host.userId,
      collegeId: host.collegeId ?? null,
      venue: input.venue,
      scheduledAt: new Date(input.scheduledAt),
      agenda: input.agenda ?? [],
      featured: input.featured ?? false,
    },
  });
}

export interface EventRow {
  event: Event;
  registeredCount: number;
  isRegistered: boolean;
}

export async function listEvents(viewerId: string, collegeId?: string): Promise<EventRow[]> {
  const events = await prisma.event.findMany({
    where: { ...(collegeId && { collegeId }) },
    orderBy: { scheduledAt: 'asc' },
  });

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: { in: events.map((e) => e.id) } },
  });
  const countByEvent = new Map<string, number>();
  const registeredEventIds = new Set<string>();
  for (const reg of registrations) {
    countByEvent.set(reg.eventId, (countByEvent.get(reg.eventId) ?? 0) + 1);
    if (reg.userId === viewerId) {
      registeredEventIds.add(reg.eventId);
    }
  }

  return events.map((event) => ({
    event,
    registeredCount: countByEvent.get(event.id) ?? 0,
    isRegistered: registeredEventIds.has(event.id),
  }));
}

export async function registerForEvent(userId: string, eventId: string): Promise<void> {
  const exists = await prisma.event.findUnique({ where: { id: eventId } });
  if (!exists) {
    throw new ApiError(404, 'Event not found');
  }
  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: {},
    create: { eventId, userId },
  });
}

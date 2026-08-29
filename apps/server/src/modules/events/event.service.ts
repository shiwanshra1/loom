import { EventModel, type EventDocument } from '../../models/Event.js';
import { EventRegistrationModel } from '../../models/EventRegistration.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateEventInput } from './event.validation.js';

export async function createEvent(
  host: AuthenticatedUser,
  input: CreateEventInput
): Promise<EventDocument> {
  return EventModel.create({
    title: input.title,
    description: input.description,
    type: input.type,
    hostedBy: host.userId,
    collegeId: host.collegeId ?? null,
    venue: input.venue,
    scheduledAt: new Date(input.scheduledAt),
    agenda: input.agenda ?? [],
    featured: input.featured ?? false,
  });
}

export interface EventRow {
  event: EventDocument;
  registeredCount: number;
  isRegistered: boolean;
}

export async function listEvents(viewerId: string, collegeId?: string): Promise<EventRow[]> {
  const filter = collegeId ? { collegeId } : {};
  const events = await EventModel.find(filter).sort({ scheduledAt: 1 });

  const registrations = await EventRegistrationModel.find({
    eventId: { $in: events.map((e) => e._id) },
  });
  const countByEvent = new Map<string, number>();
  const registeredEventIds = new Set<string>();
  for (const reg of registrations) {
    const key = reg.eventId.toString();
    countByEvent.set(key, (countByEvent.get(key) ?? 0) + 1);
    if (reg.userId.toString() === viewerId) {
      registeredEventIds.add(key);
    }
  }

  return events.map((event) => ({
    event,
    registeredCount: countByEvent.get(event._id.toString()) ?? 0,
    isRegistered: registeredEventIds.has(event._id.toString()),
  }));
}

export async function registerForEvent(userId: string, eventId: string): Promise<void> {
  const exists = await EventModel.exists({ _id: eventId });
  if (!exists) {
    throw new ApiError(404, 'Event not found');
  }
  await EventRegistrationModel.findOneAndUpdate(
    { eventId, userId },
    { eventId, userId },
    { upsert: true }
  );
}

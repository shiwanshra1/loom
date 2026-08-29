import type { EventDto } from '@forge-loom/shared-types';
import { UserModel } from '../../models/User.js';
import { CollegeModel } from '../../models/College.js';
import type { EventRow } from './event.service.js';

export async function toEventDto(row: EventRow): Promise<EventDto> {
  const [host, college] = await Promise.all([
    UserModel.findById(row.event.hostedBy),
    row.event.collegeId ? CollegeModel.findById(row.event.collegeId) : null,
  ]);

  return {
    id: row.event._id.toString(),
    title: row.event.title,
    description: row.event.description,
    type: row.event.type,
    hostedByEmail: host?.email ?? '',
    collegeName: college?.name,
    venue: row.event.venue,
    scheduledAt: row.event.scheduledAt.toISOString(),
    agenda: row.event.agenda,
    featured: row.event.featured,
    registeredCount: row.registeredCount,
    isRegistered: row.isRegistered,
  };
}

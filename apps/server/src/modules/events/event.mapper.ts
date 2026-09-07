import type { EventDto } from '@forge-loom/shared-types';
import { prisma } from '../../config/prisma.js';
import type { EventRow } from './event.service.js';

export async function toEventDto(row: EventRow): Promise<EventDto> {
  const [host, college] = await Promise.all([
    prisma.user.findUnique({ where: { id: row.event.hostedBy } }),
    row.event.collegeId ? prisma.college.findUnique({ where: { id: row.event.collegeId } }) : null,
  ]);

  return {
    id: row.event.id,
    title: row.event.title,
    description: row.event.description ?? undefined,
    type: row.event.type,
    hostedByEmail: host?.email ?? '',
    collegeName: college?.name,
    venue: row.event.venue ?? undefined,
    scheduledAt: row.event.scheduledAt.toISOString(),
    agenda: row.event.agenda,
    featured: row.event.featured,
    registeredCount: row.registeredCount,
    isRegistered: row.isRegistered,
  };
}

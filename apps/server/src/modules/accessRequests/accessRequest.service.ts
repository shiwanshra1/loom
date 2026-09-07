import type { AccessRequest } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { createNotification } from '../notifications/notification.service.js';

export async function requestAccess(requesterId: string, eventId: string): Promise<AccessRequest> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  const request = await prisma.accessRequest.upsert({
    where: { requesterId_eventId: { requesterId, eventId } },
    update: {},
    create: { requesterId, eventId },
  });

  await createNotification(
    event.hostedBy,
    'booking_created', // reusing the closest existing type — a dedicated
    // access_request_* notification type would be the cleaner long-term fix
    `Access requested for ${event.title}`
  );

  return request;
}

export async function listMyAccessRequests(
  requesterId: string
): Promise<{ request: AccessRequest; eventTitle: string }[]> {
  const requests = await prisma.accessRequest.findMany({
    where: { requesterId },
    orderBy: { requestedAt: 'desc' },
  });
  const events = await prisma.event.findMany({
    where: { id: { in: requests.map((r) => r.eventId) } },
  });
  const titleByEventId = new Map(events.map((e) => [e.id, e.title]));

  return requests.map((request) => ({
    request,
    eventTitle: titleByEventId.get(request.eventId) ?? 'Unknown event',
  }));
}

export async function decideAccessRequest(
  hostUserId: string,
  requestId: string,
  approve: boolean
): Promise<AccessRequest> {
  const request = await prisma.accessRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw new ApiError(404, 'Access request not found');
  }
  const event = await prisma.event.findUnique({ where: { id: request.eventId } });
  if (!event || event.hostedBy !== hostUserId) {
    throw new ApiError(403, 'You do not have access to this request');
  }

  return prisma.accessRequest.update({
    where: { id: requestId },
    data: { status: approve ? 'approved' : 'denied', decidedAt: new Date() },
  });
}

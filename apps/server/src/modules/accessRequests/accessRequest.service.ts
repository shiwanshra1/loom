import { AccessRequestModel, type AccessRequestDocument } from '../../models/AccessRequest.js';
import { EventModel } from '../../models/Event.js';
import { ApiError } from '../../utils/ApiError.js';
import { createNotification } from '../notifications/notification.service.js';

export async function requestAccess(
  requesterId: string,
  eventId: string
): Promise<AccessRequestDocument> {
  const event = await EventModel.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  const request = await AccessRequestModel.findOneAndUpdate(
    { requesterId, eventId },
    { requesterId, eventId },
    { upsert: true, new: true }
  );

  await createNotification(
    event.hostedBy.toString(),
    'booking_created', // reusing the closest existing type — a dedicated
    // access_request_* notification type would be the cleaner long-term fix
    `Access requested for ${event.title}`
  );

  return request!;
}

export async function listMyAccessRequests(
  requesterId: string
): Promise<{ request: AccessRequestDocument; eventTitle: string }[]> {
  const requests = await AccessRequestModel.find({ requesterId }).sort({ requestedAt: -1 });
  const events = await EventModel.find({ _id: { $in: requests.map((r) => r.eventId) } });
  const titleByEventId = new Map(events.map((e) => [e._id.toString(), e.title]));

  return requests.map((request) => ({
    request,
    eventTitle: titleByEventId.get(request.eventId.toString()) ?? 'Unknown event',
  }));
}

export async function decideAccessRequest(
  hostUserId: string,
  requestId: string,
  approve: boolean
): Promise<AccessRequestDocument> {
  const request = await AccessRequestModel.findById(requestId);
  if (!request) {
    throw new ApiError(404, 'Access request not found');
  }
  const event = await EventModel.findById(request.eventId);
  if (!event || event.hostedBy.toString() !== hostUserId) {
    throw new ApiError(403, 'You do not have access to this request');
  }

  request.status = approve ? 'approved' : 'denied';
  request.decidedAt = new Date();
  await request.save();
  return request;
}

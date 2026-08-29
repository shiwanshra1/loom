import type { AccessRequestDto } from '@forge-loom/shared-types';
import type { AccessRequestDocument } from '../../models/AccessRequest.js';

export function toAccessRequestDto(
  request: AccessRequestDocument,
  eventTitle: string
): AccessRequestDto {
  return {
    id: request._id.toString(),
    eventId: request.eventId.toString(),
    eventTitle,
    status: request.status,
    requestedAt: request.requestedAt.toISOString(),
    decidedAt: request.decidedAt ? request.decidedAt.toISOString() : null,
  };
}

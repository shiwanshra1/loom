import type { AccessRequestDto } from '@forge-loom/shared-types';
import type { AccessRequest } from '@prisma/client';

export function toAccessRequestDto(request: AccessRequest, eventTitle: string): AccessRequestDto {
  return {
    id: request.id,
    eventId: request.eventId,
    eventTitle,
    status: request.status,
    requestedAt: request.requestedAt.toISOString(),
    decidedAt: request.decidedAt ? request.decidedAt.toISOString() : null,
  };
}

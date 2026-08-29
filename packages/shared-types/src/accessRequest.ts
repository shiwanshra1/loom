export type AccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface AccessRequestDto {
  id: string;
  eventId: string;
  eventTitle: string;
  status: AccessRequestStatus;
  requestedAt: string;
  decidedAt: string | null;
}

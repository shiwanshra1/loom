export type NotificationType =
  | 'booking_created'
  | 'booking_cancelled'
  | 'milestone_reviewed'
  | 'investor_access_granted'
  | 'session_cancelled'
  | 'certificate_issued';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

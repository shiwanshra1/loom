import type { NotificationDto } from '@forge-loom/shared-types';
import type { Notification } from '@prisma/client';

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body ?? undefined,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

import type { NotificationDto } from '@forge-loom/shared-types';
import type { NotificationDocument } from '../../models/Notification.js';

export function toNotificationDto(notification: NotificationDocument): NotificationDto {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

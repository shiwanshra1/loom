import {
  NotificationModel,
  type NotificationDocument,
  type NotificationType,
} from '../../models/Notification.js';
import { ApiError } from '../../utils/ApiError.js';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string
): Promise<void> {
  await NotificationModel.create({ userId, type, title, body });
}

export async function listMyNotifications(userId: string): Promise<NotificationDocument[]> {
  return NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  const notification = await NotificationModel.findOne({ _id: notificationId, userId });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  notification.read = true;
  await notification.save();
}

export async function markAllRead(userId: string): Promise<void> {
  await NotificationModel.updateMany({ userId, read: false }, { read: true });
}

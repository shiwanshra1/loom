import mongoose from 'mongoose';
import {
  NotificationModel,
  type NotificationDocument,
  type NotificationType,
} from '../../models/Notification.js';
import { ApiError } from '../../utils/ApiError.js';

// Notification isn't migrated until Phase 5 — `userId` here is a strict
// Mongoose ObjectId cast. Callers upstream (courses/enrollments/sessions,
// migrated in Phase 2) now pass Postgres-native ids for any account created
// after that cutover, which aren't valid ObjectId hex. Rather than let every
// caller remember to guard this, or let it throw a CastError, the guard
// lives here once: silently skip the notification for accounts this
// collection can't reference yet. Closes on its own once Phase 5 migrates
// Notification too. See docs/prisma-migration-tickets.md.
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string
): Promise<void> {
  if (!mongoose.isValidObjectId(userId)) {
    return;
  }
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

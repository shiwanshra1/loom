import type { Notification, NotificationType as PrismaNotificationType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { toPrismaEnum } from '../../utils/prismaEnum.js';
import { ApiError } from '../../utils/ApiError.js';

export type NotificationType =
  | 'booking_created'
  | 'booking_cancelled'
  | 'milestone_reviewed'
  | 'investor_access_granted'
  | 'session_cancelled'
  | 'certificate_issued';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type: toPrismaEnum<PrismaNotificationType>(type), title, body },
  });
}

export async function listMyNotifications(userId: string): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  await prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}

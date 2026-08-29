import { useState } from 'react';
import { Bell, Calendar, CalendarX2, MessageSquare, Trophy, GraduationCap } from 'lucide-react';
import type { NotificationDto, NotificationType } from '@forge-loom/shared-types';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from '../features/notifications/hooks';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  booking_created: Calendar,
  booking_cancelled: CalendarX2,
  milestone_reviewed: MessageSquare,
  investor_access_granted: Trophy,
  session_cancelled: CalendarX2,
  certificate_issued: GraduationCap,
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const { data: notifications } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  function handleOpenNotification(notification: NotificationDto) {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-sm font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(!notifications || notifications.length === 0) && (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  No notifications yet.
                </p>
              )}
              {notifications?.map((notification) => {
                const Icon = TYPE_ICON[notification.type];
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className={`flex w-full items-start gap-2 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50 ${
                      notification.read ? '' : 'bg-blue-50/50'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-slate-400">
                      <Icon size={16} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm text-slate-800">{notification.title}</span>
                      {notification.body && (
                        <span className="block text-xs text-slate-500">{notification.body}</span>
                      )}
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

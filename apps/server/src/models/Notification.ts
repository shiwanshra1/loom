import { Schema, model, type Types } from 'mongoose';

export type NotificationType =
  | 'booking_created'
  | 'booking_cancelled'
  | 'milestone_reviewed'
  | 'investor_access_granted'
  | 'session_cancelled'
  | 'certificate_issued';

export interface NotificationDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_cancelled',
        'milestone_reviewed',
        'investor_access_granted',
        'session_cancelled',
        'certificate_issued',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = model<NotificationDocument>('Notification', notificationSchema);

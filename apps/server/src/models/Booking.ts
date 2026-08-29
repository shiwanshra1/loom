import { Schema, model, type Types } from 'mongoose';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface BookingDocument {
  _id: Types.ObjectId;
  requesterId: Types.ObjectId;
  mentorId: Types.ObjectId;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  mode: string;
  status: BookingStatus;
  agenda: string[];
  note?: string;
  meetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 5 },
    mode: { type: String, default: 'Google Meet' },
    status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
    agenda: { type: [String], default: [] },
    note: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
  },
  { timestamps: true }
);

bookingSchema.index({ requesterId: 1, scheduledAt: -1 });
bookingSchema.index({ mentorId: 1, scheduledAt: -1 });

export const BookingModel = model<BookingDocument>('Booking', bookingSchema);

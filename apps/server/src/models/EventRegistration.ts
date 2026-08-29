import { Schema, model, type Types } from 'mongoose';

export interface EventRegistrationDocument {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  registeredAt: Date;
}

const eventRegistrationSchema = new Schema<EventRegistrationDocument>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registeredAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventRegistrationModel = model<EventRegistrationDocument>(
  'EventRegistration',
  eventRegistrationSchema
);

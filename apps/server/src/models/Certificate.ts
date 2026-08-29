import { Schema, model, type Types } from 'mongoose';

export interface CertificateDocument {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  courseTitle: string;
  issuingBody: string;
  // Cryptographically random, not a JWT — verification is a DB lookup by
  // token, not a payload decode, so there's nothing to gain from a signed
  // token format here.
  token: string;
  pdfKey: string;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<CertificateDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, unique: true },
    courseTitle: { type: String, required: true },
    issuingBody: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    pdfKey: { type: String, required: true },
    issuedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export const CertificateModel = model<CertificateDocument>('Certificate', certificateSchema);

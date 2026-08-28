import { Schema, model, type Types } from 'mongoose';

export interface BookmarkDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  problemStatementId: Types.ObjectId;
  createdAt: Date;
}

// A separate collection rather than a bookmarkedBy[] array on ProblemStatement
// — many students bookmarking the same problem statement would otherwise mean
// concurrent writes to one shared document (per the binding doc's own note).
const bookmarkSchema = new Schema<BookmarkDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemStatementId: { type: Schema.Types.ObjectId, ref: 'ProblemStatement', required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

bookmarkSchema.index({ userId: 1, problemStatementId: 1 }, { unique: true });

export const BookmarkModel = model<BookmarkDocument>('Bookmark', bookmarkSchema);

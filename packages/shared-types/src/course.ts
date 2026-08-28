export type CourseDeliveryMode = 'online' | 'offline';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface SyllabusDayDto {
  dayNumber: number;
  title: string;
  description?: string;
  // Online-only: the syllabus day's video (Phase 4). Unlisted YouTube videos
  // only — Private videos fail to embed for students.
  youtubeVideoId?: string;
}

export interface CourseDto {
  id: string;
  title: string;
  description?: string;
  deliveryMode: CourseDeliveryMode;
  durationHours: number;
  durationDays: number;
  price: number;
  currency: string;
  status: CourseStatus;
  syllabus: SyllabusDayDto[];
  // The Trainer assigned to teach this course (Phase 3) — null until a
  // course_admin assigns one. No dedicated faculty/roster system exists yet
  // (that's Phase 6); this is the minimal bridge until then.
  trainerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListPageDto {
  courses: CourseDto[];
  nextCursor: string | null;
}

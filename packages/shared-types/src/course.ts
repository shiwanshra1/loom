export type CourseDeliveryMode = 'online' | 'offline';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface SyllabusDayDto {
  dayNumber: number;
  title: string;
  description?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CourseListPageDto {
  courses: CourseDto[];
  nextCursor: string | null;
}

import type { CourseDeliveryMode, SyllabusDayDto } from '@forge-loom/shared-types';

export interface CreateCourseInput {
  title: string;
  description?: string;
  deliveryMode: CourseDeliveryMode;
  durationHours: number;
  durationDays: number;
  price: number;
  currency?: string;
  syllabus?: SyllabusDayDto[];
}

export type UpdateCourseInput = Partial<CreateCourseInput>;

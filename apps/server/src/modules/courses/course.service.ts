import { Types } from 'mongoose';
import { Role } from '@forge-loom/shared-types';
import { CourseAdminProfileModel } from '../../models/CourseAdminProfile.js';
import { CourseModel, type CourseDocument, type CourseStatus } from '../../models/Course.js';
import { UserModel } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import type {
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from './course.validation.js';

// draft -> published -> archived only. There's no stated use case for moving
// backwards (e.g. un-publishing), so that's rejected rather than silently
// allowed — disclosed here since the roadmap didn't spell out the transition
// rules explicitly.
const ALLOWED_STATUS_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  draft: ['published'],
  published: ['archived'],
  archived: [],
};

async function getOwnCourseAdminProfile(userId: string) {
  const profile = await CourseAdminProfileModel.findOne({ userId });
  if (!profile) {
    throw new ApiError(404, 'Course admin profile not found');
  }
  return profile;
}

async function getOwnedCourse(courseId: string, courseAdminProfileId: Types.ObjectId) {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  if (!course.createdBy.equals(courseAdminProfileId)) {
    throw new ApiError(403, 'You do not have access to this course');
  }
  return course;
}

async function resolveTrainerId(trainerEmail: string): Promise<Types.ObjectId> {
  const trainer = await UserModel.findOne({ email: trainerEmail, role: Role.Trainer });
  if (!trainer) {
    throw new ApiError(400, `No trainer account found for ${trainerEmail}`);
  }
  return trainer._id;
}

export async function createCourse(
  userId: string,
  input: CreateCourseInput
): Promise<CourseDocument> {
  const profile = await getOwnCourseAdminProfile(userId);

  const syllabus = (input.syllabus ?? []).map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title,
    description: day.description,
    youtubeVideoId: day.youtubeVideoId ?? null,
  }));

  const trainerId = input.trainerEmail ? await resolveTrainerId(input.trainerEmail) : null;

  return CourseModel.create({
    title: input.title,
    description: input.description,
    createdBy: profile._id,
    deliveryMode: input.deliveryMode,
    durationHours: input.durationHours,
    durationDays: input.durationDays,
    price: input.price,
    currency: input.currency ?? 'INR',
    status: 'draft',
    syllabus,
    trainerId,
  });
}

export async function updateCourse(
  userId: string,
  courseId: string,
  input: UpdateCourseInput
): Promise<CourseDocument> {
  const profile = await getOwnCourseAdminProfile(userId);
  const course = await getOwnedCourse(courseId, profile._id);

  if (input.title !== undefined) course.title = input.title;
  if (input.description !== undefined) course.description = input.description;
  if (input.deliveryMode !== undefined) course.deliveryMode = input.deliveryMode;
  if (input.durationHours !== undefined) course.durationHours = input.durationHours;
  if (input.durationDays !== undefined) course.durationDays = input.durationDays;
  if (input.price !== undefined) course.price = input.price;
  if (input.currency !== undefined) course.currency = input.currency;
  if (input.syllabus !== undefined) {
    course.syllabus = input.syllabus.map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
      youtubeVideoId: day.youtubeVideoId ?? null,
    }));
  }
  if (input.trainerEmail !== undefined) {
    course.trainerId = await resolveTrainerId(input.trainerEmail);
  }

  await course.save();
  return course;
}

export async function updateCourseStatus(
  userId: string,
  courseId: string,
  nextStatus: CourseStatus
): Promise<CourseDocument> {
  const profile = await getOwnCourseAdminProfile(userId);
  const course = await getOwnedCourse(courseId, profile._id);

  const allowed = ALLOWED_STATUS_TRANSITIONS[course.status];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Cannot move a course from "${course.status}" to "${nextStatus}"`);
  }

  course.status = nextStatus;
  await course.save();
  return course;
}

export async function listMyCourses(userId: string): Promise<CourseDocument[]> {
  const profile = await getOwnCourseAdminProfile(userId);
  return CourseModel.find({ createdBy: profile._id }).sort({ createdAt: -1 });
}

export async function listTeachingCourses(trainerUserId: string): Promise<CourseDocument[]> {
  return CourseModel.find({ trainerId: trainerUserId }).sort({ createdAt: -1 });
}

export interface CourseListPage {
  courses: CourseDocument[];
  nextCursor: string | null;
}

export async function listPublishedCourses(query: ListCoursesQuery): Promise<CourseListPage> {
  const limit = query.limit ?? 20;

  const filter: Record<string, unknown> = { status: 'published' };
  if (query.deliveryMode) {
    filter.deliveryMode = query.deliveryMode;
  }
  if (query.cursor) {
    filter.createdAt = { $lt: new Date(query.cursor) };
  }

  const rows = await CourseModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const courses = hasMore ? rows.slice(0, limit) : rows;
  const last = courses[courses.length - 1];

  return {
    courses,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
  };
}

export async function getCourseById(
  courseId: string,
  viewer: { userId: string; role: string }
): Promise<CourseDocument> {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  if (course.status === 'published') {
    return course;
  }

  // Non-published courses are only visible to the course_admin who owns them.
  if (viewer.role === 'course_admin') {
    const profile = await CourseAdminProfileModel.findOne({ userId: viewer.userId });
    if (profile && course.createdBy.equals(profile._id)) {
      return course;
    }
  }

  throw new ApiError(404, 'Course not found');
}

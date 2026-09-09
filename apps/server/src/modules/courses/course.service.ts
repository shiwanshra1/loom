import { Role } from '@forge-loom/shared-types';
import type { Role as PrismaRole } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { toPrismaEnum } from '../../utils/prismaEnum.js';
import type {
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from './course.validation.js';
import type { CourseWithSyllabus } from './courseAccess.js';

type CourseStatus = 'draft' | 'published' | 'archived';

// draft -> published -> archived only. There's no stated use case for moving
// backwards (e.g. un-publishing), so that's rejected rather than silently
// allowed — disclosed here since the roadmap didn't spell out the transition
// rules explicitly.
const ALLOWED_STATUS_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  draft: ['published'],
  published: ['archived'],
  archived: [],
};

const SYLLABUS_INCLUDE = { syllabus: { orderBy: { dayNumber: 'asc' as const } } };

async function getOwnedCourse(courseId: string, userId: string): Promise<CourseWithSyllabus> {
  const course = await prisma.course.findUnique({ where: { id: courseId }, include: SYLLABUS_INCLUDE });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  if (course.createdBy !== userId) {
    throw new ApiError(403, 'You do not have access to this course');
  }
  return course;
}

async function resolveTrainerId(trainerEmail: string): Promise<string> {
  const trainer = await prisma.user.findFirst({
    where: { email: trainerEmail, role: toPrismaEnum<PrismaRole>(Role.Trainer) },
  });
  if (!trainer) {
    throw new ApiError(400, `No trainer account found for ${trainerEmail}`);
  }
  return trainer.id;
}

// collegeId is null for the CourseAdmin variant (stays in the global
// catalog, unchanged since Phase 1/2) and forced to the caller's own
// college for the CollegeAdmin variant (Phase 8) — resolved by the
// controller from the session, never trusted from the request body.
export async function createCourse(
  userId: string,
  collegeId: string | null,
  input: CreateCourseInput
): Promise<CourseWithSyllabus> {
  const syllabus = (input.syllabus ?? []).map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title,
    description: day.description,
    youtubeVideoId: day.youtubeVideoId ?? null,
  }));

  const trainerId = input.trainerEmail ? await resolveTrainerId(input.trainerEmail) : null;

  return prisma.course.create({
    data: {
      title: input.title,
      description: input.description,
      createdBy: userId,
      collegeId,
      deliveryMode: input.deliveryMode,
      durationHours: input.durationHours,
      durationDays: input.durationDays,
      price: input.price,
      currency: input.currency ?? 'INR',
      status: 'draft',
      trainerId,
      syllabus: { create: syllabus },
    },
    include: SYLLABUS_INCLUDE,
  });
}

export async function updateCourse(
  userId: string,
  courseId: string,
  input: UpdateCourseInput
): Promise<CourseWithSyllabus> {
  await getOwnedCourse(courseId, userId);

  const trainerId =
    input.trainerEmail !== undefined ? await resolveTrainerId(input.trainerEmail) : undefined;

  const fieldUpdates = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.deliveryMode !== undefined && { deliveryMode: input.deliveryMode }),
    ...(input.durationHours !== undefined && { durationHours: input.durationHours }),
    ...(input.durationDays !== undefined && { durationDays: input.durationDays }),
    ...(input.price !== undefined && { price: input.price }),
    ...(input.currency !== undefined && { currency: input.currency }),
    ...(trainerId !== undefined && { trainerId }),
  };

  if (input.syllabus !== undefined) {
    // Wholesale replace, matching the original Mongoose behavior exactly —
    // the whole syllabus array was always overwritten, never patched
    // incrementally.
    const newSyllabus = input.syllabus.map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
      youtubeVideoId: day.youtubeVideoId ?? null,
    }));
    await prisma.$transaction([
      prisma.syllabusDay.deleteMany({ where: { courseId } }),
      prisma.course.update({
        where: { id: courseId },
        data: { ...fieldUpdates, syllabus: { create: newSyllabus } },
      }),
    ]);
  } else if (Object.keys(fieldUpdates).length > 0) {
    await prisma.course.update({ where: { id: courseId }, data: fieldUpdates });
  }

  return prisma.course.findUniqueOrThrow({ where: { id: courseId }, include: SYLLABUS_INCLUDE });
}

export async function updateCourseStatus(
  userId: string,
  courseId: string,
  nextStatus: CourseStatus
): Promise<CourseWithSyllabus> {
  const course = await getOwnedCourse(courseId, userId);

  const allowed = ALLOWED_STATUS_TRANSITIONS[course.status as CourseStatus];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Cannot move a course from "${course.status}" to "${nextStatus}"`);
  }

  return prisma.course.update({
    where: { id: courseId },
    data: { status: nextStatus },
    include: SYLLABUS_INCLUDE,
  });
}

export async function listMyCourses(userId: string): Promise<CourseWithSyllabus[]> {
  return prisma.course.findMany({
    where: { createdBy: userId },
    orderBy: { createdAt: 'desc' },
    include: SYLLABUS_INCLUDE,
  });
}

// Forge Admin's cross-college drill-in (Phase 9) — every course at a given
// college regardless of which College Admin created it, not "mine".
export async function listCollegeCourses(collegeId: string): Promise<CourseWithSyllabus[]> {
  return prisma.course.findMany({
    where: { collegeId },
    orderBy: { createdAt: 'desc' },
    include: SYLLABUS_INCLUDE,
  });
}

export async function listTeachingCourses(trainerUserId: string): Promise<CourseWithSyllabus[]> {
  return prisma.course.findMany({
    where: { trainerId: trainerUserId },
    orderBy: { createdAt: 'desc' },
    include: SYLLABUS_INCLUDE,
  });
}

export interface CourseListPage {
  courses: CourseWithSyllabus[];
  nextCursor: string | null;
}

export interface CourseCatalogViewer {
  role: string;
  collegeId?: string;
}

// A college-scoped course (collegeId set, Phase 8) is visible only to that
// college's own members and Forge Admin — never other colleges' students,
// even once published. A course with collegeId: null (the pre-Phase-8
// global CourseAdmin catalog) stays visible to everyone, unchanged.
function catalogVisibilityFilter(viewer: CourseCatalogViewer) {
  if (viewer.role === Role.ForgeAdmin) {
    return {};
  }
  return {
    OR: [{ collegeId: null }, ...(viewer.collegeId ? [{ collegeId: viewer.collegeId }] : [])],
  };
}

export async function listPublishedCourses(
  query: ListCoursesQuery,
  viewer: CourseCatalogViewer
): Promise<CourseListPage> {
  const limit = query.limit ?? 20;

  const rows = await prisma.course.findMany({
    where: {
      status: 'published',
      ...catalogVisibilityFilter(viewer),
      ...(query.deliveryMode && { deliveryMode: query.deliveryMode }),
      ...(query.cursor && { createdAt: { lt: new Date(query.cursor) } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    include: SYLLABUS_INCLUDE,
  });

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
  viewer: { userId: string; role: string; collegeId?: string }
): Promise<CourseWithSyllabus> {
  const course = await prisma.course.findUnique({ where: { id: courseId }, include: SYLLABUS_INCLUDE });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const visibleToViewersCollege =
    !course.collegeId || viewer.role === Role.ForgeAdmin || course.collegeId === viewer.collegeId;

  if (course.status === 'published') {
    // A college-scoped course is a 404, not just "not returned", to a
    // viewer outside that college — same as any other not-visible-to-you
    // resource in this codebase, so its existence isn't leaked either.
    if (!visibleToViewersCollege) {
      throw new ApiError(404, 'Course not found');
    }
    return course;
  }

  // Non-published courses are only visible to the course_admin/college_admin
  // who owns them — ownership (createdBy) already implies the right college
  // for a college_admin-created course, so no separate collegeId check is
  // needed on this branch.
  if (
    (viewer.role === Role.CourseAdmin || viewer.role === Role.CollegeAdmin) &&
    course.createdBy === viewer.userId
  ) {
    return course;
  }

  throw new ApiError(404, 'Course not found');
}

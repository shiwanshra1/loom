import mongoose from 'mongoose';
import {
  Role,
  type CollegeFacultyMemberDto,
  type CollegeProgramDto,
} from '@forge-loom/shared-types';
import type { College } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { CohortModel } from '../../models/Cohort.js';
import { TeamModel } from '../../models/Team.js';
import type { CreateCollegeInput } from './college.validation.js';

export async function createCollege(input: CreateCollegeInput): Promise<College> {
  return prisma.college.create({
    data: {
      name: input.name,
      location: input.location,
      partnerTier: input.partnerTier ?? 'bronze',
    },
  });
}

export async function listColleges(): Promise<College[]> {
  return prisma.college.findMany({ orderBy: { name: 'asc' } });
}

// Legacy Mongo collections (Enrollment/Course/Cohort — not migrated until
// Phases 2/6) still key everything off Mongo ObjectId-shaped ids. A college
// or student created after the Phase 1 cutover has a Prisma cuid id, which
// is not valid ObjectId hex — passing one into a Mongoose `$in` filter
// throws a CastError for the whole query, not just a no-match. Filtering
// down to valid-looking ids first means "no legacy data for this new
// record" resolves to an empty/zero result instead of an exception. This
// gap closes on its own as each domain migrates, and fully once Phase 8's
// data migration runs.
function keepValidObjectIds(ids: string[]): string[] {
  return ids.filter((id) => mongoose.isValidObjectId(id));
}

// "Programs" for a college isn't a stored field anywhere — courses are a
// global catalog (Phase 1/2), not college-scoped. This computes it instead:
// any course with at least one of this college's students actively/formerly
// enrolled counts as one of its programs. Real, correctly scoped, without
// retrofitting a collegeId onto Course (which would contradict the open
// catalog model Phases 1-2 already shipped).
//
// Course/Enrollment moved to Prisma in Phase 2 — this closes the gap Phase 1
// had to accept here (new-era students showed 0 programs since Enrollment
// was still Mongo-only). Now a single consistent Postgres read.
export async function getCollegePrograms(collegeId: string): Promise<CollegeProgramDto[]> {
  const students = await prisma.studentProfile.findMany({ where: { collegeId } });

  const enrollments = await prisma.enrollment.groupBy({
    by: ['courseId'],
    where: {
      studentId: { in: students.map((s) => s.userId) },
      status: { in: ['active', 'completed'] },
    },
    _count: { _all: true },
  });

  const courses = await prisma.course.findMany({
    where: { id: { in: enrollments.map((e) => e.courseId) } },
  });
  const countByCourseId = new Map(enrollments.map((e) => [e.courseId, e._count._all]));

  return courses.map((course) => ({
    courseId: course.id,
    title: course.title,
    status: course.status,
    studentsEnrolled: countByCourseId.get(course.id) ?? 0,
  }));
}

export interface PartnerCollegeRow {
  college: College;
  studentCount: number;
  activePhase: 'activation' | 'bootcamp' | 'citadel' | null;
  contactEmail: string | null;
}

// Sponsor-facing directory (wireframe §6) — "active cohort phase" picks each
// college's most recently started cohort rather than trying to define a
// single canonical "current" cohort, since the schema doesn't mark one.
export async function listPartnerColleges(): Promise<PartnerCollegeRow[]> {
  const colleges = await prisma.college.findMany({ orderBy: { name: 'asc' } });
  const collegeIds = colleges.map((c) => c.id);
  const legacyCollegeIds = keepValidObjectIds(collegeIds);

  const [studentCounts, latestCohorts, collegeAdmins] = await Promise.all([
    prisma.studentProfile.groupBy({
      by: ['collegeId'],
      where: { collegeId: { in: collegeIds } },
      _count: { _all: true },
    }),
    CohortModel.find({ collegeId: { $in: legacyCollegeIds } }).sort({ startDate: -1 }),
    prisma.user.findMany({ where: { role: Role.CollegeAdmin, collegeId: { in: collegeIds } } }),
  ]);

  const studentCountByCollege = new Map(
    studentCounts.map((row) => [row.collegeId as string, row._count._all])
  );
  const latestPhaseByCollege = new Map<string, 'activation' | 'bootcamp' | 'citadel'>();
  for (const cohort of latestCohorts) {
    const key = cohort.collegeId.toString();
    if (!latestPhaseByCollege.has(key)) {
      latestPhaseByCollege.set(key, cohort.phase);
    }
  }
  const contactEmailByCollege = new Map(
    collegeAdmins.filter((admin) => admin.collegeId).map((admin) => [admin.collegeId!, admin.email])
  );

  return colleges.map((college) => ({
    college,
    studentCount: studentCountByCollege.get(college.id) ?? 0,
    activePhase: latestPhaseByCollege.get(college.id) ?? null,
    contactEmail: contactEmailByCollege.get(college.id) ?? null,
  }));
}

// Team hasn't moved to Prisma yet (Citadel is Phase 3) — until it does, a
// trainer registered after the Phase 1 cutover has a Prisma cuid id that can
// never match a legacy Team document (not valid ObjectId hex), so the Mongo
// count is skipped for those rather than left to throw.
async function countTeamsForTrainer(trainerUserId: string): Promise<number> {
  if (!mongoose.isValidObjectId(trainerUserId)) {
    return 0;
  }
  return TeamModel.countDocuments({ trainerId: trainerUserId });
}

export async function getCollegeFaculty(collegeId: string): Promise<CollegeFacultyMemberDto[]> {
  const [trainers, mentors] = await Promise.all([
    prisma.trainerProfile.findMany({ where: { collegeId } }),
    prisma.mentorProfile.findMany({ where: { collegeId } }),
  ]);
  const userIds = [...trainers.map((t) => t.userId), ...mentors.map((m) => m.userId)];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  const trainerWorkloads = await Promise.all(
    trainers.map((t) => countTeamsForTrainer(t.userId))
  );
  const mentorWorkloads = await Promise.all(
    mentors.map((m) => prisma.studentProfile.count({ where: { mentorId: m.id } }))
  );

  return [
    ...trainers.map((t, i) => ({
      userId: t.userId,
      email: emailByUserId.get(t.userId) ?? '',
      role: 'trainer' as const,
      workload: trainerWorkloads[i] ?? 0,
    })),
    ...mentors.map((m, i) => ({
      userId: m.userId,
      email: emailByUserId.get(m.userId) ?? '',
      role: 'mentor' as const,
      workload: mentorWorkloads[i] ?? 0,
    })),
  ];
}

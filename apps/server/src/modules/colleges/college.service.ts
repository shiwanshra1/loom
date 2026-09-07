import { Role } from '@forge-loom/shared-types';
import type { College, Role as PrismaRole } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { toPrismaEnum } from '../../utils/prismaEnum.js';
import type { CreateCollegeInput } from './college.validation.js';
import type { CollegeFacultyMemberDto, CollegeProgramDto } from '@forge-loom/shared-types';

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

// "Programs" for a college isn't a stored field anywhere — courses are a
// global catalog (Phase 1/2), not college-scoped. This computes it instead:
// any course with at least one of this college's students actively/formerly
// enrolled counts as one of its programs. Real, correctly scoped, without
// retrofitting a collegeId onto Course (which would contradict the open
// catalog model Phases 1-2 already shipped).
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

  const [studentCounts, latestCohorts, collegeAdmins] = await Promise.all([
    prisma.studentProfile.groupBy({
      by: ['collegeId'],
      where: { collegeId: { in: collegeIds } },
      _count: { _all: true },
    }),
    prisma.cohort.findMany({
      where: { collegeId: { in: collegeIds } },
      orderBy: { startDate: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: toPrismaEnum<PrismaRole>(Role.CollegeAdmin), collegeId: { in: collegeIds } },
    }),
  ]);

  const studentCountByCollege = new Map(
    studentCounts.map((row) => [row.collegeId as string, row._count._all])
  );
  const latestPhaseByCollege = new Map<string, 'activation' | 'bootcamp' | 'citadel'>();
  for (const cohort of latestCohorts) {
    if (!latestPhaseByCollege.has(cohort.collegeId)) {
      latestPhaseByCollege.set(cohort.collegeId, cohort.phase);
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

export async function getCollegeFaculty(collegeId: string): Promise<CollegeFacultyMemberDto[]> {
  const [trainers, mentors] = await Promise.all([
    prisma.trainerProfile.findMany({ where: { collegeId } }),
    prisma.mentorProfile.findMany({ where: { collegeId } }),
  ]);
  const userIds = [...trainers.map((t) => t.userId), ...mentors.map((m) => m.userId)];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  // Team moved to Prisma in Phase 3 — this used to be a guarded Mongo
  // fallback (Team.trainerId) from back when Team was still Mongo-only;
  // now a plain Postgres count like the mentor side below.
  const trainerWorkloads = await Promise.all(
    trainers.map((t) => prisma.team.count({ where: { trainerId: t.userId } }))
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

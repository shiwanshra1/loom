import type { CollegeFacultyMemberDto, CollegeProgramDto } from '@forge-loom/shared-types';
import { CollegeModel, type CollegeDocument } from '../../models/College.js';
import { StudentProfileModel } from '../../models/StudentProfile.js';
import { TrainerProfileModel } from '../../models/TrainerProfile.js';
import { MentorProfileModel } from '../../models/MentorProfile.js';
import { EnrollmentModel } from '../../models/Enrollment.js';
import { CourseModel } from '../../models/Course.js';
import { UserModel } from '../../models/User.js';
import type { CreateCollegeInput } from './college.validation.js';

export async function createCollege(input: CreateCollegeInput): Promise<CollegeDocument> {
  return CollegeModel.create({
    name: input.name,
    location: input.location,
    partnerTier: input.partnerTier ?? 'bronze',
  });
}

export async function listColleges(): Promise<CollegeDocument[]> {
  return CollegeModel.find().sort({ name: 1 });
}

// "Programs" for a college isn't a stored field anywhere — courses are a
// global catalog (Phase 1/2), not college-scoped. This computes it instead:
// any course with at least one of this college's students actively/formerly
// enrolled counts as one of its programs. Real, correctly scoped, without
// retrofitting a collegeId onto Course (which would contradict the open
// catalog model Phases 1-2 already shipped).
export async function getCollegePrograms(collegeId: string): Promise<CollegeProgramDto[]> {
  const students = await StudentProfileModel.find({ collegeId });
  const enrollments = await EnrollmentModel.find({
    studentId: { $in: students.map((s) => s.userId) },
    status: { $in: ['active', 'completed'] },
  });

  const countByCourseId = new Map<string, number>();
  for (const enrollment of enrollments) {
    const key = enrollment.courseId.toString();
    countByCourseId.set(key, (countByCourseId.get(key) ?? 0) + 1);
  }

  const courses = await CourseModel.find({ _id: { $in: [...countByCourseId.keys()] } });
  return courses.map((course) => ({
    courseId: course._id.toString(),
    title: course.title,
    status: course.status,
    studentsEnrolled: countByCourseId.get(course._id.toString()) ?? 0,
  }));
}

export async function getCollegeFaculty(collegeId: string): Promise<CollegeFacultyMemberDto[]> {
  const [trainers, mentors] = await Promise.all([
    TrainerProfileModel.find({ collegeId }),
    MentorProfileModel.find({ collegeId }),
  ]);
  const userIds = [...trainers.map((t) => t.userId), ...mentors.map((m) => m.userId)];
  const users = await UserModel.find({ _id: { $in: userIds } });
  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));

  return [
    ...trainers.map((t) => ({
      userId: t.userId.toString(),
      email: emailByUserId.get(t.userId.toString()) ?? '',
      role: 'trainer' as const,
      workload: t.assignedTeams.length,
    })),
    ...mentors.map((m) => ({
      userId: m.userId.toString(),
      email: emailByUserId.get(m.userId.toString()) ?? '',
      role: 'mentor' as const,
      workload: m.assignedStudents.length,
    })),
  ];
}

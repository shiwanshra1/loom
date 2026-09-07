// One-time Mongo -> Postgres data migration (Phase 8 of the Prisma
// migration, docs/prisma-migration-tickets.md). Reads every Mongo
// collection (read-only — this script never writes to Mongo) and creates
// the equivalent Postgres rows via Prisma, in FK-dependency order,
// preserving every Mongo `_id` as the literal new Postgres `id` string
// (design doc §0.1 / §7 — this only works cleanly against an empty or
// non-conflicting target; see the safety note below).
//
// Safety: every `createMany` call uses `skipDuplicates: true`, and every
// per-row `create` (for models with nested writes) is wrapped to skip a
// unique-constraint violation rather than crash. This means running this
// script against a Postgres database that already has independently-created
// rows sharing a unique key (most commonly `User.email`) will silently skip
// those specific rows — it will NOT merge or overwrite them.
//
// Real historical data has real corruption: verified by testing this script
// against a genuine (if messy) Mongo dev database, not just written from the
// design doc's happy path. Found and handled two concrete cases along the
// way — both disclosed at their call sites: (1) documents predating a field
// being added to the schema (a CollegeProfile with no `collegeId` at all),
// (2) dangling references to a User that no longer exists in Mongo (a
// leftover from a dev-fixture reset — see memory.txt's Phase 5&6 entry).
// Every User-referencing field is therefore validated against the actual
// set of Users that made it into Postgres (`validUserIds`, computed right
// after migrateUsers()) — optional fields are nulled out, required fields
// cause that specific record to be skipped, both logged. Run `--dry-run`
// first and compare the printed counts against your Mongo collection counts
// before doing a real run, especially against a non-empty target.
//
// Usage: tsx src/scripts/migrateMongoToPostgres.ts [--dry-run]
import mongoose from 'mongoose';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma, disconnectPrisma } from '../config/prisma.js';
import { toPrismaEnum } from '../utils/prismaEnum.js';

import { UserModel } from '../models/User.js';
import { StudentProfileModel } from '../models/StudentProfile.js';
import { MentorProfileModel } from '../models/MentorProfile.js';
import { TrainerProfileModel } from '../models/TrainerProfile.js';
import { SpeakerProfileModel } from '../models/SpeakerProfile.js';
import { HrProfileModel } from '../models/HrProfile.js';
import { SponsorProfileModel } from '../models/SponsorProfile.js';
import { CollegeProfileModel } from '../models/CollegeProfile.js';
import { CommunityLeaderProfileModel } from '../models/CommunityLeaderProfile.js';
import { MediaPartnerProfileModel } from '../models/MediaPartnerProfile.js';
import { MemberProfileModel } from '../models/MemberProfile.js';
import { CourseAdminProfileModel } from '../models/CourseAdminProfile.js';
import { CollegeModel } from '../models/College.js';
import { CohortModel } from '../models/Cohort.js';
import { TeamModel } from '../models/Team.js';
import { CourseModel } from '../models/Course.js';
import { CourseSessionModel } from '../models/CourseSession.js';
import { EnrollmentModel } from '../models/Enrollment.js';
import { AttendanceRecordModel } from '../models/AttendanceRecord.js';
import { VideoProgressModel } from '../models/VideoProgress.js';
import { AssessmentModel } from '../models/Assessment.js';
import { CertificateModel } from '../models/Certificate.js';
import { ProblemStatementModel } from '../models/ProblemStatement.js';
import { SprintModel } from '../models/Sprint.js';
import { MilestoneSubmissionModel } from '../models/MilestoneSubmission.js';
import { InvestorAccessGrantModel } from '../models/InvestorAccessGrant.js';
import { BookmarkModel } from '../models/Bookmark.js';
import { InterestExpressionModel } from '../models/InterestExpression.js';
import { ScoreEventModel } from '../models/ScoreEvent.js';
import { BookingModel } from '../models/Booking.js';
import { NotificationModel } from '../models/Notification.js';
import { CommunityPostModel } from '../models/CommunityPost.js';
import { EventModel } from '../models/Event.js';
import { EventRegistrationModel } from '../models/EventRegistration.js';
import { AccessRequestModel } from '../models/AccessRequest.js';
import { SpeakerTopicModel } from '../models/SpeakerTopic.js';

const DRY_RUN = process.argv.includes('--dry-run');

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

function oid(id: mongoose.Types.ObjectId | null | undefined): string | null {
  return id ? id.toString() : null;
}

// For an optional User-reference field: null it out if the referenced User
// doesn't actually exist in the migrated Postgres target.
function sanitizeUserRef(id: mongoose.Types.ObjectId | null | undefined, validUserIds: Set<string>): string | null {
  const s = oid(id);
  return s && validUserIds.has(s) ? s : null;
}

async function migrateColleges() {
  const colleges = await CollegeModel.find();
  console.log(`College: ${colleges.length} found in Mongo`);
  if (DRY_RUN) return;

  const result = await prisma.college.createMany({
    data: colleges.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      location: c.location,
      partnerTier: toPrismaEnum(c.partnerTier),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    skipDuplicates: true,
  });
  console.log(`College: ${result.count} migrated (${colleges.length - result.count} skipped)`);
}

async function migrateUsers(): Promise<Set<string>> {
  const users = await UserModel.find();
  console.log(`User: ${users.length} found in Mongo`);
  if (DRY_RUN) return new Set(users.map((u) => u._id.toString()));

  await prisma.user.createMany({
    data: users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      passwordHash: u.passwordHash,
      role: toPrismaEnum(u.role),
      status: toPrismaEnum(u.status),
      collegeId: oid(u.collegeId),
      mfaEnabled: u.mfaEnabled,
      refreshTokenVersion: u.refreshTokenVersion,
      lastLoginAt: u.lastLoginAt ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    skipDuplicates: true,
  });

  // Authoritative: query back what's actually in Postgres now, rather than
  // assume "found in Mongo" == "exists in the target" — a skipped duplicate
  // (most commonly an email collision with a pre-existing account) means
  // that Mongo id does NOT exist in Postgres even though it was just
  // "migrated" in the loose sense. Every downstream User reference is
  // validated against this real set, not the Mongo one.
  const migratedUsers = await prisma.user.findMany({ select: { id: true } });
  const validUserIds = new Set(migratedUsers.map((u) => u.id));
  console.log(
    `User: ${validUserIds.size} exist in Postgres target (${users.length - validUserIds.size} of the ${users.length} Mongo users were not created — email collision with a pre-existing account, most likely)`
  );
  return validUserIds;
}

async function migrateProfiles(validUserIds: Set<string>) {
  const [students, mentors, trainers, speakers, hrs, sponsors, collegeProfiles, communityLeaders, mediaPartners, members, courseAdmins] =
    await Promise.all([
      StudentProfileModel.find(),
      MentorProfileModel.find(),
      TrainerProfileModel.find(),
      SpeakerProfileModel.find(),
      HrProfileModel.find(),
      SponsorProfileModel.find(),
      CollegeProfileModel.find(),
      CommunityLeaderProfileModel.find(),
      MediaPartnerProfileModel.find(),
      MemberProfileModel.find(),
      CourseAdminProfileModel.find(),
    ]);
  console.log(
    `Profiles found: student=${students.length} mentor=${mentors.length} trainer=${trainers.length} speaker=${speakers.length} hr=${hrs.length} sponsor=${sponsors.length} collegeAdmin=${collegeProfiles.length} communityLeader=${communityLeaders.length} mediaPartner=${mediaPartners.length} member=${members.length} courseAdmin=${courseAdmins.length}`
  );
  if (DRY_RUN) return;

  // Every profile's OWN `userId` is required and, by construction, always
  // belongs to that same profile's owner — but that owner might still be one
  // of the skipped Users above, so this is validated too, not assumed.
  const validStudents = students.filter((s) => validUserIds.has(s.userId.toString()));
  const validMentors = mentors.filter((m) => validUserIds.has(m.userId.toString()));
  const validTrainers = trainers.filter((t) => validUserIds.has(t.userId.toString()));
  const validSpeakers = speakers.filter((s) => validUserIds.has(s.userId.toString()));
  const validHrs = hrs.filter((h) => validUserIds.has(h.userId.toString()));
  const validSponsors = sponsors.filter((s) => validUserIds.has(s.userId.toString()));
  const validMediaPartners = mediaPartners.filter((m) => validUserIds.has(m.userId.toString()));
  const validMembers = members.filter((m) => validUserIds.has(m.userId.toString()));
  const validCourseAdmins = courseAdmins.filter((c) => validUserIds.has(c.userId.toString()));

  // assignedStudents[]/assignedTeams[] intentionally NOT carried forward —
  // dropped as redundant/derivable during Phase 1 of the Prisma migration
  // (design doc §0.3); Team.trainerId / StudentProfile.mentorId, migrated
  // below/earlier, are the real source of truth now.
  await prisma.studentProfile.createMany({
    data: validStudents.map((s) => ({
      id: s._id.toString(),
      userId: s.userId.toString(),
      collegeId: oid(s.collegeId),
      name: s.name,
      course: s.course,
      mentorId: null, // resolved below once MentorProfile rows exist
      builderScore: s.builderScore,
      skills: s.skills,
      domain: s.domain,
      linkedIn: s.linkedIn,
      currentStreak: s.currentStreak,
      xp: s.xp,
      streakHistory: s.streakHistory,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    skipDuplicates: true,
  });

  await prisma.mentorProfile.createMany({
    data: validMentors.map((m) => ({
      id: m._id.toString(),
      userId: m.userId.toString(),
      collegeId: oid(m.collegeId),
      expertise: m.expertise,
      bio: m.bio,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
    skipDuplicates: true,
  });

  // StudentProfile.mentorId references MentorProfile.id (not a User id) —
  // resolved as a second pass now that MentorProfile rows exist, validated
  // against the MentorProfile rows that actually made it in.
  const migratedMentorIds = new Set((await prisma.mentorProfile.findMany({ select: { id: true } })).map((m) => m.id));
  await Promise.all(
    validStudents
      .filter((s) => s.mentorId && migratedMentorIds.has(s.mentorId.toString()))
      .map((s) =>
        prisma.studentProfile.update({
          where: { id: s._id.toString() },
          data: { mentorId: s.mentorId!.toString() },
        })
      )
  );

  await prisma.trainerProfile.createMany({
    data: validTrainers.map((t) => ({
      id: t._id.toString(),
      userId: t.userId.toString(),
      collegeId: oid(t.collegeId),
      expertise: t.expertise,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    skipDuplicates: true,
  });

  await prisma.speakerProfile.createMany({
    data: validSpeakers.map((s) => ({
      id: s._id.toString(),
      userId: s.userId.toString(),
      topics: s.topics,
      bio: s.bio,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    skipDuplicates: true,
  });
  // pastSessions[] -> SpeakerPastSession: dormant in the live app (confirmed
  // via the Phase 1 repo audit — never read or written outside the model
  // file itself), left empty here for the same reason.

  await prisma.hrProfile.createMany({
    data: validHrs.map((h) => ({
      id: h._id.toString(),
      userId: h.userId.toString(),
      companyName: h.companyName,
      industry: h.industry,
      companyDetails: h.companyDetails,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    })),
    skipDuplicates: true,
  });

  await prisma.sponsorProfile.createMany({
    data: validSponsors.map((s) => ({
      id: s._id.toString(),
      userId: s.userId.toString(),
      orgName: s.orgName,
      sponsorshipTier: s.sponsorshipTier,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    skipDuplicates: true,
  });

  // `collegeId` is required in the Prisma schema, but some historical Mongo
  // documents predate this field being added to CollegeProfile at all
  // (found via testing: an early `collegeadmin1` test account from before
  // Phase 6 of milestone-1.md introduced it) — skip those with a warning
  // rather than crash or fabricate a value.
  const validCollegeProfiles = collegeProfiles.filter(
    (c) => Boolean(c.collegeId) && validUserIds.has(c.userId.toString())
  );
  if (validCollegeProfiles.length < collegeProfiles.length) {
    console.warn(
      `CollegeProfile: ${collegeProfiles.length - validCollegeProfiles.length} skipped — missing collegeId, or owning User was skipped`
    );
  }
  await prisma.collegeProfile.createMany({
    data: validCollegeProfiles.map((c) => ({
      id: c._id.toString(),
      userId: c.userId.toString(),
      collegeId: c.collegeId.toString(),
      collegeName: c.collegeName,
      accreditationInfo: c.accreditationInfo,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    skipDuplicates: true,
  });

  const validCommunityLeaders = communityLeaders.filter((c) => validUserIds.has(c.userId.toString()));
  await prisma.communityLeaderProfile.createMany({
    data: validCommunityLeaders.map((c) => ({
      id: c._id.toString(),
      userId: c.userId.toString(),
      orgName: c.orgName,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    skipDuplicates: true,
  });
  // members[] fans out into the CommunityMember subcollection — a genuine
  // schema change, not a 1:1 copy (design doc §2.1), so this needs its own
  // per-row loop rather than a flat createMany. Each member's own userId is
  // validated too (a leader's member list can reference an account that no
  // longer exists just as easily as any other User reference).
  let communityMemberCount = 0;
  for (const c of validCommunityLeaders) {
    for (const member of c.members) {
      const memberUserId = member.userId.toString();
      if (!validUserIds.has(memberUserId)) continue;
      try {
        await prisma.communityMember.create({
          data: {
            communityLeaderProfileId: c._id.toString(),
            userId: memberUserId,
            role: toPrismaEnum(member.role),
          },
        });
        communityMemberCount += 1;
      } catch (err) {
        if (isUniqueViolation(err)) continue;
        throw err;
      }
    }
  }
  console.log(`CommunityMember: ${communityMemberCount} migrated`);
  // volunteerNetwork[] -> CommunityVolunteer: dormant, same reasoning as
  // pastSessions above, left empty.

  await prisma.mediaPartnerProfile.createMany({
    data: validMediaPartners.map((m) => ({
      id: m._id.toString(),
      userId: m.userId.toString(),
      outlet: m.outlet,
      accessLevel: m.accessLevel,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
    skipDuplicates: true,
  });

  await prisma.memberProfile.createMany({
    data: validMembers.map((m) => ({
      id: m._id.toString(),
      userId: m.userId.toString(),
      interests: m.interests,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
    skipDuplicates: true,
  });

  await prisma.courseAdminProfile.createMany({
    data: validCourseAdmins.map((c) => ({
      id: c._id.toString(),
      userId: c.userId.toString(),
      name: c.name,
      department: c.department,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    skipDuplicates: true,
  });
}

async function migrateCohortsTeamsAndMembers(validUserIds: Set<string>) {
  const [cohorts, teams] = await Promise.all([CohortModel.find(), TeamModel.find()]);
  console.log(`Cohort: ${cohorts.length}, Team: ${teams.length} found in Mongo`);
  if (DRY_RUN) return;

  await prisma.cohort.createMany({
    data: cohorts.map((c) => ({
      id: c._id.toString(),
      collegeId: c.collegeId.toString(),
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
      phase: toPrismaEnum(c.phase),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    skipDuplicates: true,
  });

  // ProblemStatement must already exist by this point (migrated earlier in
  // main() — its own comment there explains why) since problemStatementId
  // is a real FK.
  const migratedProblemStatementIds = new Set(
    (await prisma.problemStatement.findMany({ select: { id: true } })).map((p) => p.id)
  );

  await prisma.team.createMany({
    data: teams.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      collegeId: t.collegeId.toString(),
      mentorId: sanitizeUserRef(t.mentorId, validUserIds),
      trainerId: sanitizeUserRef(t.trainerId, validUserIds),
      problemStatementId:
        t.problemStatementId && migratedProblemStatementIds.has(t.problemStatementId.toString())
          ? t.problemStatementId.toString()
          : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    skipDuplicates: true,
  });

  // TeamMember requires each member's StudentProfile id, which Mongo's flat
  // memberStudentIds[] never stored directly — resolved here via the
  // StudentProfile rows migrated in the previous step. A member id that
  // isn't a valid User (or never got a StudentProfile migrated) is skipped.
  const allMemberUserIds = [
    ...new Set(teams.flatMap((t) => t.memberStudentIds.map((id) => id.toString()))),
  ].filter((id) => validUserIds.has(id));
  const studentProfiles = await prisma.studentProfile.findMany({
    where: { userId: { in: allMemberUserIds } },
  });
  const profileIdByUserId = new Map(studentProfiles.map((p) => [p.userId, p.id]));

  const teamMemberRows = teams.flatMap((t) =>
    t.memberStudentIds
      .map((studentId) => {
        const userId = studentId.toString();
        const studentProfileId = profileIdByUserId.get(userId);
        if (!studentProfileId) return null;
        return { teamId: t._id.toString(), studentUserId: userId, studentProfileId };
      })
      .filter((row): row is { teamId: string; studentUserId: string; studentProfileId: string } => row !== null)
  );
  const totalMembers = teams.reduce((sum, t) => sum + t.memberStudentIds.length, 0);
  const skipped = totalMembers - teamMemberRows.length;
  if (skipped > 0) {
    console.warn(
      `TeamMember: ${skipped} member row(s) skipped — invalid User reference or no matching StudentProfile`
    );
  }
  const result = await prisma.teamMember.createMany({ data: teamMemberRows, skipDuplicates: true });
  console.log(`TeamMember: ${result.count} migrated`);
}

async function migrateCoursesAndSyllabus(validUserIds: Set<string>) {
  const courses = await CourseModel.find();
  console.log(`Course: ${courses.length} found in Mongo`);
  if (DRY_RUN) return;

  const validCourseAdminIds = new Set(
    (await prisma.courseAdminProfile.findMany({ select: { id: true } })).map((c) => c.id)
  );
  const validCourses = courses.filter((c) => validCourseAdminIds.has(c.createdBy.toString()));
  if (validCourses.length < courses.length) {
    console.warn(
      `Course: ${courses.length - validCourses.length} skipped — owning CourseAdminProfile was skipped`
    );
  }

  let migrated = 0;
  for (const c of validCourses) {
    try {
      await prisma.course.create({
        data: {
          id: c._id.toString(),
          title: c.title,
          description: c.description,
          createdBy: c.createdBy.toString(),
          deliveryMode: toPrismaEnum(c.deliveryMode),
          durationHours: c.durationHours,
          durationDays: c.durationDays,
          price: c.price,
          currency: c.currency,
          status: toPrismaEnum(c.status),
          trainerId: sanitizeUserRef(c.trainerId, validUserIds),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          syllabus: {
            create: c.syllabus.map((day) => ({
              dayNumber: day.dayNumber,
              title: day.title,
              description: day.description,
              youtubeVideoId: day.youtubeVideoId,
            })),
          },
        },
      });
      migrated += 1;
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }
  console.log(`Course: ${migrated} migrated (${courses.length - migrated} skipped)`);
}

async function migrateCourseSessions(validUserIds: Set<string>) {
  const sessions = await CourseSessionModel.find();
  console.log(`CourseSession: ${sessions.length} found in Mongo`);
  if (DRY_RUN) return;

  const validCourseIds = new Set((await prisma.course.findMany({ select: { id: true } })).map((c) => c.id));
  const validSessions = sessions.filter((s) => validCourseIds.has(s.courseId.toString()));
  if (validSessions.length < sessions.length) {
    console.warn(`CourseSession: ${sessions.length - validSessions.length} skipped — owning Course was skipped`);
  }

  const result = await prisma.courseSession.createMany({
    data: validSessions.map((s) => ({
      id: s._id.toString(),
      courseId: s.courseId.toString(),
      dayNumber: s.dayNumber,
      scheduledDate: s.scheduledDate,
      mode: toPrismaEnum(s.mode),
      status: toPrismaEnum(s.status),
      cancelReason: s.cancelReason,
      trainerId: sanitizeUserRef(s.trainerId, validUserIds),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    skipDuplicates: true,
  });
  console.log(`CourseSession: ${result.count} migrated`);
}

async function migrateEnrollments(validUserIds: Set<string>) {
  const enrollments = await EnrollmentModel.find();
  console.log(`Enrollment: ${enrollments.length} found in Mongo`);
  if (DRY_RUN) return;

  const validCourseIds = new Set((await prisma.course.findMany({ select: { id: true } })).map((c) => c.id));
  const validEnrollments = enrollments.filter(
    (e) => validUserIds.has(e.studentId.toString()) && validCourseIds.has(e.courseId.toString())
  );
  if (validEnrollments.length < enrollments.length) {
    console.warn(
      `Enrollment: ${enrollments.length - validEnrollments.length} skipped — invalid student or course reference`
    );
  }

  const result = await prisma.enrollment.createMany({
    data: validEnrollments.map((e) => ({
      id: e._id.toString(),
      studentId: e.studentId.toString(),
      courseId: e.courseId.toString(),
      status: toPrismaEnum(e.status),
      razorpayOrderId: e.razorpayOrderId,
      paymentRef: e.paymentRef,
      paymentAmount: e.paymentAmount,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
    skipDuplicates: true,
  });
  console.log(`Enrollment: ${result.count} migrated`);
}

async function migrateAttendanceVideoAssessmentsCertificates(validUserIds: Set<string>) {
  const [attendance, videoProgress, assessments, certificates] = await Promise.all([
    AttendanceRecordModel.find(),
    VideoProgressModel.find(),
    AssessmentModel.find(),
    CertificateModel.find(),
  ]);
  console.log(
    `AttendanceRecord: ${attendance.length}, VideoProgress: ${videoProgress.length}, Assessment: ${assessments.length}, Certificate: ${certificates.length} found in Mongo`
  );
  if (DRY_RUN) return;

  const [validSessionIds, validCourseIds, validEnrollmentIds] = await Promise.all([
    prisma.courseSession.findMany({ select: { id: true } }).then((rows) => new Set(rows.map((r) => r.id))),
    prisma.course.findMany({ select: { id: true } }).then((rows) => new Set(rows.map((r) => r.id))),
    prisma.enrollment.findMany({ select: { id: true } }).then((rows) => new Set(rows.map((r) => r.id))),
  ]);

  const validAttendance = attendance.filter(
    (a) =>
      validSessionIds.has(a.sessionId.toString()) &&
      validUserIds.has(a.studentId.toString()) &&
      validUserIds.has(a.markedBy.toString())
  );
  await prisma.attendanceRecord.createMany({
    data: validAttendance.map((a) => ({
      id: a._id.toString(),
      sessionId: a.sessionId.toString(),
      studentId: a.studentId.toString(),
      status: toPrismaEnum(a.status),
      markedAt: a.markedAt,
      markedBy: a.markedBy.toString(),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
    skipDuplicates: true,
  });

  const validVideoProgress = videoProgress.filter(
    (v) => validUserIds.has(v.studentId.toString()) && validCourseIds.has(v.courseId.toString())
  );
  await prisma.videoProgress.createMany({
    data: validVideoProgress.map((v) => ({
      id: v._id.toString(),
      studentId: v.studentId.toString(),
      courseId: v.courseId.toString(),
      dayNumber: v.dayNumber,
      lastPositionSeconds: v.lastPositionSeconds,
      durationSeconds: v.durationSeconds,
      percentWatched: v.percentWatched,
      completed: v.completed,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    })),
    skipDuplicates: true,
  });

  const validAssessments = assessments.filter((a) => validCourseIds.has(a.courseId.toString()));
  await prisma.assessment.createMany({
    data: validAssessments.map((a) => ({
      id: a._id.toString(),
      courseId: a.courseId.toString(),
      title: a.title,
      type: toPrismaEnum(a.type),
      scheduledDate: a.scheduledDate,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
    skipDuplicates: true,
  });

  const validCertificates = certificates.filter(
    (c) =>
      validUserIds.has(c.studentId.toString()) &&
      validCourseIds.has(c.courseId.toString()) &&
      validEnrollmentIds.has(c.enrollmentId.toString())
  );
  await prisma.certificate.createMany({
    data: validCertificates.map((c) => ({
      id: c._id.toString(),
      studentId: c.studentId.toString(),
      courseId: c.courseId.toString(),
      enrollmentId: c.enrollmentId.toString(),
      courseTitle: c.courseTitle,
      issuingBody: c.issuingBody,
      token: c.token,
      pdfKey: c.pdfKey,
      issuedAt: c.issuedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    skipDuplicates: true,
  });
  console.log(
    `AttendanceRecord: ${validAttendance.length}/${attendance.length}, VideoProgress: ${validVideoProgress.length}/${videoProgress.length}, Assessment: ${validAssessments.length}/${assessments.length}, Certificate: ${validCertificates.length}/${certificates.length} valid and migrated`
  );
}

async function migrateProblemStatementsAndDeliverables(validUserIds: Set<string>) {
  const problemStatements = await ProblemStatementModel.find();
  console.log(`ProblemStatement: ${problemStatements.length} found in Mongo`);
  if (DRY_RUN) return;

  let migrated = 0;
  for (const ps of problemStatements) {
    try {
      await prisma.problemStatement.create({
        data: {
          id: ps._id.toString(),
          title: ps.title,
          description: ps.description,
          overview: ps.overview,
          source: toPrismaEnum(ps.source),
          domain: ps.domain,
          tags: ps.tags,
          teamSize: ps.teamSize,
          durationWeeks: ps.durationWeeks,
          difficulty: toPrismaEnum(ps.difficulty),
          status: toPrismaEnum(ps.status),
          featured: ps.featured,
          postedBy: sanitizeUserRef(ps.postedBy, validUserIds),
          createdAt: ps.createdAt,
          updatedAt: ps.updatedAt,
          deliverables: {
            create: ps.deliverables.map((d, order) => ({ title: d.title, done: d.done, order })),
          },
        },
      });
      migrated += 1;
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }
  console.log(`ProblemStatement: ${migrated} migrated (${problemStatements.length - migrated} skipped)`);
}

async function migrateSprintsAndTasks() {
  const sprints = await SprintModel.find();
  console.log(`Sprint: ${sprints.length} found in Mongo`);
  if (DRY_RUN) return;

  const validTeamIds = new Set((await prisma.team.findMany({ select: { id: true } })).map((t) => t.id));
  const validSprints = sprints.filter((s) => validTeamIds.has(s.teamId.toString()));
  if (validSprints.length < sprints.length) {
    console.warn(`Sprint: ${sprints.length - validSprints.length} skipped — owning Team was skipped`);
  }

  let migrated = 0;
  for (const s of validSprints) {
    try {
      await prisma.sprint.create({
        data: {
          id: s._id.toString(),
          teamId: s.teamId.toString(),
          cycleNumber: s.cycleNumber,
          status: toPrismaEnum(s.status),
          startDate: s.startDate,
          endDate: s.endDate,
          progressPercent: s.progressPercent,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          tasks: {
            create: s.tasks.map((t, order) => ({
              title: t.title,
              status: toPrismaEnum(t.status),
              dueDate: t.dueDate,
              order,
            })),
          },
        },
      });
      migrated += 1;
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }
  console.log(`Sprint: ${migrated} migrated (${validSprints.length - migrated} skipped)`);
}

async function migrateMilestoneSubmissionsAndFeedback(validUserIds: Set<string>) {
  const submissions = await MilestoneSubmissionModel.find();
  console.log(`MilestoneSubmission: ${submissions.length} found in Mongo`);
  if (DRY_RUN) return;

  const [validSprintIds, validTeamIds] = await Promise.all([
    prisma.sprint.findMany({ select: { id: true } }).then((rows) => new Set(rows.map((r) => r.id))),
    prisma.team.findMany({ select: { id: true } }).then((rows) => new Set(rows.map((r) => r.id))),
  ]);
  const validSubmissions = submissions.filter(
    (sub) => validSprintIds.has(sub.sprintId.toString()) && validTeamIds.has(sub.teamId.toString())
  );
  if (validSubmissions.length < submissions.length) {
    console.warn(
      `MilestoneSubmission: ${submissions.length - validSubmissions.length} skipped — owning Sprint or Team was skipped`
    );
  }

  let migrated = 0;
  for (const sub of validSubmissions) {
    try {
      await prisma.milestoneSubmission.create({
        data: {
          id: sub._id.toString(),
          sprintId: sub.sprintId.toString(),
          teamId: sub.teamId.toString(),
          artifactUrls: sub.artifactUrls,
          demoDate: sub.demoDate,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
          // Each feedback entry's mentorId is validated individually — a
          // submission shouldn't be dropped wholesale just because one of
          // its feedback entries names a mentor who no longer exists.
          mentorFeedback: {
            create: sub.mentorFeedback
              .filter((f) => validUserIds.has(f.mentorId.toString()))
              .map((f) => ({
                mentorId: f.mentorId.toString(),
                comment: f.comment,
                rating: f.rating ?? null,
                createdAt: f.createdAt,
              })),
          },
        },
      });
      migrated += 1;
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }
  console.log(`MilestoneSubmission: ${migrated} migrated (${validSubmissions.length - migrated} skipped)`);
}

async function migrateInvestorGrantsBookmarksInterests(validUserIds: Set<string>) {
  const [grants, bookmarks, interests] = await Promise.all([
    InvestorAccessGrantModel.find(),
    BookmarkModel.find(),
    InterestExpressionModel.find(),
  ]);
  console.log(
    `InvestorAccessGrant: ${grants.length}, Bookmark: ${bookmarks.length}, InterestExpression: ${interests.length} found in Mongo`
  );
  if (DRY_RUN) return;

  const [validTeamIds, validProblemStatementIds] = await Promise.all([
    prisma.team.findMany({ select: { id: true } }).then((rows) => new Set(rows.map((r) => r.id))),
    prisma.problemStatement.findMany({ select: { id: true } }).then((rows) => new Set(rows.map((r) => r.id))),
  ]);

  const validGrants = grants.filter((g) => validTeamIds.has(g.teamId.toString()));
  await prisma.investorAccessGrant.createMany({
    data: validGrants.map((g) => ({
      id: g._id.toString(),
      teamId: g.teamId.toString(),
      grantedAt: g.grantedAt,
      reason: g.reason,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    })),
    skipDuplicates: true,
  });

  const validBookmarks = bookmarks.filter(
    (b) => validUserIds.has(b.userId.toString()) && validProblemStatementIds.has(b.problemStatementId.toString())
  );
  await prisma.bookmark.createMany({
    data: validBookmarks.map((b) => ({
      userId: b.userId.toString(),
      problemStatementId: b.problemStatementId.toString(),
      createdAt: b.createdAt,
    })),
    skipDuplicates: true,
  });

  const validInterests = interests.filter(
    (i) => validUserIds.has(i.userId.toString()) && validProblemStatementIds.has(i.problemStatementId.toString())
  );
  await prisma.interestExpression.createMany({
    data: validInterests.map((i) => ({
      userId: i.userId.toString(),
      problemStatementId: i.problemStatementId.toString(),
      createdAt: i.createdAt,
    })),
    skipDuplicates: true,
  });
  console.log(
    `InvestorAccessGrant: ${validGrants.length}/${grants.length}, Bookmark: ${validBookmarks.length}/${bookmarks.length}, InterestExpression: ${validInterests.length}/${interests.length} valid and migrated`
  );
}

async function migrateScoreEvents(validUserIds: Set<string>) {
  const events = await ScoreEventModel.find();
  console.log(`ScoreEvent: ${events.length} found in Mongo`);
  if (DRY_RUN) return;

  const validEvents = events.filter((e) => validUserIds.has(e.studentId.toString()));
  const result = await prisma.scoreEvent.createMany({
    data: validEvents.map((e) => ({
      id: e._id.toString(),
      studentId: e.studentId.toString(),
      category: toPrismaEnum(e.category),
      points: e.points,
      reason: e.reason,
      sourceRef: e.sourceRef,
      createdAt: e.createdAt,
    })),
    skipDuplicates: true,
  });
  console.log(`ScoreEvent: ${result.count} migrated (${events.length - validEvents.length} had an invalid student reference)`);
}

async function migrateEngagementCollections(validUserIds: Set<string>) {
  const [bookings, notifications, posts, events, registrations, accessRequests, speakerTopics] =
    await Promise.all([
      BookingModel.find(),
      NotificationModel.find(),
      CommunityPostModel.find(),
      EventModel.find(),
      EventRegistrationModel.find(),
      AccessRequestModel.find(),
      SpeakerTopicModel.find(),
    ]);
  console.log(
    `Booking: ${bookings.length}, Notification: ${notifications.length}, CommunityPost: ${posts.length}, Event: ${events.length}, EventRegistration: ${registrations.length}, AccessRequest: ${accessRequests.length}, SpeakerTopic: ${speakerTopics.length} found in Mongo`
  );
  if (DRY_RUN) return;

  const validBookings = bookings.filter(
    (b) => validUserIds.has(b.requesterId.toString()) && validUserIds.has(b.mentorId.toString())
  );
  await prisma.booking.createMany({
    data: validBookings.map((b) => ({
      id: b._id.toString(),
      requesterId: b.requesterId.toString(),
      mentorId: b.mentorId.toString(),
      title: b.title,
      scheduledAt: b.scheduledAt,
      durationMinutes: b.durationMinutes,
      mode: b.mode,
      status: toPrismaEnum(b.status),
      agenda: b.agenda,
      note: b.note,
      meetingLink: b.meetingLink,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
    skipDuplicates: true,
  });

  const validNotifications = notifications.filter((n) => validUserIds.has(n.userId.toString()));
  await prisma.notification.createMany({
    data: validNotifications.map((n) => ({
      id: n._id.toString(),
      userId: n.userId.toString(),
      type: toPrismaEnum(n.type),
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    })),
    skipDuplicates: true,
  });

  const validPosts = posts.filter((p) => validUserIds.has(p.authorId.toString()));
  await prisma.communityPost.createMany({
    data: validPosts.map((p) => ({
      id: p._id.toString(),
      authorId: p.authorId.toString(),
      content: p.content,
      createdAt: p.createdAt,
    })),
    skipDuplicates: true,
  });

  const validEvents = events.filter((e) => validUserIds.has(e.hostedBy.toString()));
  await prisma.event.createMany({
    data: validEvents.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      description: e.description,
      type: toPrismaEnum(e.type),
      hostedBy: e.hostedBy.toString(),
      collegeId: oid(e.collegeId),
      venue: e.venue,
      scheduledAt: e.scheduledAt,
      agenda: e.agenda,
      featured: e.featured,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
    skipDuplicates: true,
  });

  const validEventIds = new Set(validEvents.map((e) => e._id.toString()));
  const validRegistrations = registrations.filter(
    (r) => validEventIds.has(r.eventId.toString()) && validUserIds.has(r.userId.toString())
  );
  await prisma.eventRegistration.createMany({
    data: validRegistrations.map((r) => ({
      eventId: r.eventId.toString(),
      userId: r.userId.toString(),
      registeredAt: r.registeredAt,
    })),
    skipDuplicates: true,
  });

  const validAccessRequests = accessRequests.filter(
    (a) => validUserIds.has(a.requesterId.toString()) && validEventIds.has(a.eventId.toString())
  );
  await prisma.accessRequest.createMany({
    data: validAccessRequests.map((a) => ({
      id: a._id.toString(),
      requesterId: a.requesterId.toString(),
      eventId: a.eventId.toString(),
      status: toPrismaEnum(a.status),
      requestedAt: a.requestedAt,
      decidedAt: a.decidedAt,
    })),
    skipDuplicates: true,
  });

  const validSpeakerTopics = speakerTopics.filter((s) => validUserIds.has(s.speakerId.toString()));
  await prisma.speakerTopic.createMany({
    data: validSpeakerTopics.map((s) => ({
      id: s._id.toString(),
      speakerId: s.speakerId.toString(),
      title: s.title,
      description: s.description,
      status: toPrismaEnum(s.status),
      scheduledAt: s.scheduledAt,
      venue: s.venue,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    skipDuplicates: true,
  });
  console.log(
    `Booking: ${validBookings.length}/${bookings.length}, Notification: ${validNotifications.length}/${notifications.length}, CommunityPost: ${validPosts.length}/${posts.length}, Event: ${validEvents.length}/${events.length}, EventRegistration: ${validRegistrations.length}/${registrations.length}, AccessRequest: ${validAccessRequests.length}/${accessRequests.length}, SpeakerTopic: ${validSpeakerTopics.length}/${speakerTopics.length} valid and migrated`
  );
}

async function migrate() {
  console.log(DRY_RUN ? '=== DRY RUN — no writes will be made ===' : '=== LIVE RUN ===');
  await mongoose.connect(env.mongoUri);

  await migrateColleges();
  const validUserIds = await migrateUsers();
  await migrateProfiles(validUserIds);
  // ProblemStatement must come before Team — Team.problemStatementId is a
  // real FK (design doc's own fix for the field Mongo declared without a
  // `ref`), and the ticket's originally-suggested order had this backwards
  // (Team before ProblemStatement), which a real run against this database
  // caught as a P2003 foreign key violation. ProblemStatement itself has no
  // dependency on Team, so moving it earlier is safe.
  await migrateProblemStatementsAndDeliverables(validUserIds);
  await migrateCohortsTeamsAndMembers(validUserIds);
  await migrateCoursesAndSyllabus(validUserIds);
  await migrateCourseSessions(validUserIds);
  await migrateEnrollments(validUserIds);
  await migrateAttendanceVideoAssessmentsCertificates(validUserIds);
  await migrateSprintsAndTasks();
  await migrateMilestoneSubmissionsAndFeedback(validUserIds);
  await migrateInvestorGrantsBookmarksInterests(validUserIds);
  await migrateScoreEvents(validUserIds);
  await migrateEngagementCollections(validUserIds);
  // Placement: zero source data — confirmed dormant (no Mongo documents,
  // no application code path ever wrote to it) — genuinely nothing to migrate.

  await mongoose.disconnect();
  await disconnectPrisma();
  console.log(DRY_RUN ? '=== DRY RUN complete ===' : '=== Migration complete ===');
}

migrate()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Migration failed', error);
    process.exit(1);
  });

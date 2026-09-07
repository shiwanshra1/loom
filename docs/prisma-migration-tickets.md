# Forge Loom — MongoDB → PostgreSQL/Prisma Migration Tickets

Companion to `docs/postgres-database-design.md` (the schema/ER diagram this executes against). Scoped to exactly what's changing: the persistence layer, local infra, and tests. **Auth (JWT/Redis), BullMQ workers, and MinIO/S3 are untouched and not ticketed** — this is a persistence-layer swap, not the broader Firebase migration that was cancelled (see `docs/archive/`).

**Frontend (`apps/client`) impact:** by design, zero — every `.controller.ts`/`.mapper.ts` boundary is preserved, so the JSON shape each endpoint returns doesn't change, and no `apps/client` source file is expected to need an edit. This is *not* the same guarantee the cancelled Firebase plan could make (that plan changed the Talent Pool cursor format and the auth token flow client-side) — here the risk is narrower but not zero: `Decimal` fields don't automatically round-trip to a JSON `number` the way a Mongoose float did, and there's no compiler error if that conversion is missed. See **Phase 10** below for the frontend verification/regression tickets this risk requires — verification tickets, since no code changes are expected, but nothing here should be marked done without someone actually clicking through the app.

**Conventions:** checkpoint and commit locally after each phase; push to `origin/main` only on explicit request (same cadence every prior phase in `memory.txt` has used). Test files referenced below are confirmed to exist: `apps/server/src/__tests__/{auth,enrollment,attendance,citadel,score}.test.ts`.

---

## Phase 0 — Prisma & infra setup

- [ ] **T0.1** `infra/docker-compose.yml`: replace the `mongo:7` service with `postgres:16` (name it `postgres`), keep `redis`/`minio` services byte-for-byte unchanged.
- [ ] **T0.2** `apps/server/package.json`: add `prisma`, `@prisma/client`; keep `mongoose` installed alongside Prisma during the migration window so old and new service files can coexist per-module (removed in Phase 9).
- [ ] **T0.3** New `apps/server/prisma/schema.prisma` — full content in `docs/postgres-database-design.md` §1.
- [ ] **T0.4** `apps/server/src/config/env.ts`: replace `mongoUri: required('MONGO_URI')` with `databaseUrl: required('DATABASE_URL')`.
- [ ] **T0.5** New `apps/server/src/config/prisma.ts` replacing `apps/server/src/config/db.ts` — a Prisma client singleton (`export const prisma = new PrismaClient()`), plus `connectDb`/`disconnectDb`-equivalent `$connect()`/`$disconnect()` wrappers so `apps/server/src/server.ts`'s call sites don't need to change shape, only their import.
- [ ] **T0.6** `apps/server/.env.example` (and local `.env.local`/`.env.test`): swap `MONGO_URI` for `DATABASE_URL` (`postgresql://forgeloom:forgeloom@localhost:5432/forgeloom_dev` etc.).
- [ ] **T0.7** Run `prisma migrate dev --name init` against local Postgres to generate the first migration under `apps/server/prisma/migrations/`; commit it.
- **Checkpoint**: `prisma generate` succeeds, `prisma migrate dev` applies cleanly against a fresh `postgres:16` container, and `apps/server` still builds (`tsc -p tsconfig.build.json`) with Mongoose still in place but the Prisma client also importable — nothing in `src/modules` touched yet.

---

## Phase 1 — Identity module group

Files: `apps/server/src/modules/auth/*.ts` (`auth.service.ts`, `profileFactory.ts`, `collegeProvisioning.ts`), plus `apps/server/src/modules/communityMembers/communityMember.service.ts`, `apps/server/src/modules/colleges/college.service.ts`, `apps/server/src/modules/hrProfile/*`, `apps/server/src/modules/talentPool/talentPool.service.ts`.

- [ ] **T1.1** Delete `apps/server/src/models/User.ts`, `StudentProfile.ts`, `MentorProfile.ts`, `TrainerProfile.ts`, `SpeakerProfile.ts`, `HrProfile.ts`, `SponsorProfile.ts`, `CollegeProfile.ts`, `CommunityLeaderProfile.ts`, `MediaPartnerProfile.ts`, `MemberProfile.ts`, `CourseAdminProfile.ts`, `College.ts` — replace all imports across `auth`/`colleges`/`communityMembers`/`hrProfile`/`talentPool` with `prisma.user.*`, `prisma.studentProfile.*`, etc.
- [ ] **T1.2** `profileFactory.ts`: rewrite the per-role profile-creation switch to `prisma.<role>Profile.create({ data: { userId, ... } })`.
- [ ] **T1.3** `communityMember.service.ts`: rewrite `addMember`'s find-in-array-or-push logic to `prisma.communityMember.upsert({ where: { communityLeaderProfileId_userId: {...} }, update: { role }, create: { ... } })`.
- [ ] **T1.4** `college.service.ts:115,121`: replace `t.assignedTeams.length` / `m.assignedStudents.length` with `prisma.team.count({ where: { trainerId: t.userId } })` / `prisma.studentProfile.count({ where: { mentorId: m.id } })` (per the dropped-field decision, design doc §0.3).
- [ ] **T1.5** `talentPool.service.ts`: rewrite the `{collegeId,domain,builderScore desc}`-indexed query to `prisma.studentProfile.findMany({ where: {...}, orderBy: { builderScore: 'desc' } })`.
- **Checkpoint**: `auth.test.ts` passes against Postgres (registration, login, all 11 role-profile creation paths, MFA/refresh-token-version bumps).

---

## Phase 2 — Courses/Enrollment/Sessions module group

Files: `apps/server/src/modules/courses/*.ts`, `catalog/*.ts`, `enrollments/*.ts`, `sessions/*.ts`, `progress/courseProgress.service.ts`, `videoProgress/*.ts`, `assessments/*.ts`, `certificates/*.ts`.

- [ ] **T2.1** Delete `Course.ts`, `CourseSession.ts`, `Enrollment.ts`, `AttendanceRecord.ts`, `VideoProgress.ts`, `Assessment.ts`, `Certificate.ts` models.
- [ ] **T2.2** `course.service.ts`: syllabus handling — confirmed via `course.service.ts:56` (create) and `:95-96` (update) that the app already does wholesale-replace-on-update, not incremental patching. Port `createCourse` to `prisma.course.create({ data: { ..., syllabus: { create: [...] } } })` (nested write) and `updateCourse`'s syllabus branch to a `prisma.syllabusDay.deleteMany` + `createMany` pair, preserving the exact replace-wholesale semantics.
- [ ] **T2.3** `course.service.ts` / `enrollment.service.ts` / their `.mapper.ts` files: apply the Decimal→number `.toNumber()` conversion at DTO boundaries and at the Razorpay call sites (design doc §0.4).
- [ ] **T2.4** `session.service.ts`: `markAttendance`'s `findOneAndUpdate` upsert becomes `prisma.attendanceRecord.upsert({ where: { sessionId_studentId: {...} }, ... })`.
- [ ] **T2.5** `videoProgress.service.ts`: same upsert pattern via `prisma.videoProgress.upsert({ where: { studentId_courseId_dayNumber: {...} } })`.
- [ ] **T2.6** `certificate.service.ts`: `enrollmentId` uniqueness and `token` uniqueness now DB-enforced; catch Prisma's `P2002` unique-violation error where Mongoose's duplicate-key error was previously caught.
- **Checkpoint**: `attendance.test.ts` and `enrollment.test.ts` pass against Postgres.

---

## Phase 3 — Citadel module group

Files: `apps/server/src/modules/teams/*.ts`, `sprints/*.ts`, `problemStatements/*.ts`, `cohorts/*.ts`.

- [ ] **T3.1** Delete `Team.ts`, `Sprint.ts`, `MilestoneSubmission.ts`, `ProblemStatement.ts`, `InvestorAccessGrant.ts`, `Bookmark.ts`, `InterestExpression.ts`, `Cohort.ts` models.
- [ ] **T3.2** `team.service.ts`: `memberStudentIds` array assignment becomes a `TeamMember` nested-write replace (`deleteMany` + `createMany` under a `$transaction`, matching "whole list replaced on update" semantics from `updateTeam`). Drop the `TrainerProfileModel.updateOne({$addToSet/$pull: {assignedTeams}})` calls at `team.service.ts:74,130,135` entirely — `Team.trainerId` alone is now the source of truth (design doc §0.3).
- [ ] **T3.3** `team.service.ts`: the manual existence-check for `problemStatementId` becomes a real FK; on assignment, the write now gets DB-level referential integrity for free (still keep the app-level "must be `status: open`" business check, since that's a business rule, not referential integrity).
- [ ] **T3.4** `sprint.service.ts`: `tasks[]` embedded writes (`ensureSprintsForTeam`, task status updates) become `SprintTask` nested creates with an explicit `order` index (design doc §0.5); `progressPercent` recompute reads tasks via `prisma.sprintTask.findMany({ where: { sprintId }, orderBy: { order: 'asc' } })`.
- [ ] **T3.5** `problemStatement.service.ts`: `deliverables[]` becomes `ProblemStatementDeliverable` nested creates with `order`; `toggleBookmark` (currently `BookmarkModel.findOne` + `existing.deleteOne()` at line 89, or `BookmarkModel.create`) becomes `prisma.bookmark.delete({ where: { userId_problemStatementId: {...} } })` / `prisma.bookmark.create(...)`; `expressInterest`'s upsert becomes `prisma.interestExpression.upsert(...)`.
- [ ] **T3.6** `MilestoneSubmission`/`MilestoneFeedback`: mentor-feedback append becomes `prisma.milestoneFeedback.create({ data: { milestoneSubmissionId, mentorId, comment, rating } })` instead of pushing into the parent doc's array — a genuine improvement (no more read-modify-write race on the parent row when two mentors comment concurrently).
- **Checkpoint**: `citadel.test.ts` passes against Postgres.

---

## Phase 4 — Scoring module group

Files: `apps/server/src/modules/scoring/scoreEvent.service.ts`, `apps/server/src/modules/sprints/sprint.service.ts` (the write site), the BullMQ score-recompute worker (`apps/server/src/jobs/scoreWorker.ts`).

- [ ] **T4.1** Delete `ScoreEvent.ts` model. `sprint.service.ts`'s `ScoreEventModel.create(...)` calls and `jobs/scoreWorker.ts`'s aggregation become `prisma.scoreEvent.create(...)` / `prisma.scoreEvent.groupBy({ by: ['category'], where: { studentId }, _sum: { points: true } })`.
- [ ] **T4.2** Confirm the BullMQ worker's Redis job payload (student ids, not Mongo-specific data) needs no shape change — only its internal DB calls change.
- **Checkpoint**: `score.test.ts` passes against Postgres, including the recompute worker path (the test calls the worker's exported `recomputeBuilderScore` function directly, per the existing Phase 10 test design — confirm this still holds against Prisma).

---

## Phase 5 — Engagement module group

Files: `apps/server/src/modules/bookings/*.ts`, `notifications/*.ts`, `community/*.ts`, `events/*.ts`, `accessRequests/*.ts`, `speakerTopics/*.ts`.

- [ ] **T5.1** Delete `Booking.ts`, `Notification.ts`, `CommunityPost.ts`, `Event.ts`, `EventRegistration.ts`, `AccessRequest.ts`, `SpeakerTopic.ts` models.
- [ ] **T5.2** `event.service.ts`: `EventRegistrationModel.findOneAndUpdate` upsert becomes `prisma.eventRegistration.upsert({ where: { eventId_userId: {...} } })`.
- [ ] **T5.3** `accessRequest.service.ts`: `findOneAndUpdate` upsert on `{requesterId,eventId}` becomes `prisma.accessRequest.upsert(...)`; `findById(requestId)` becomes `prisma.accessRequest.findUnique({ where: { id: requestId } })` (surrogate id preserved, per design doc §1).
- [ ] **T5.4** `notification.service.ts`: straightforward `create`/`findMany`/`updateMany` (mark-read) translations.
- [ ] **T5.5** `booking.service.ts`: `listMyBookings`'s `$or` on `{requesterId, mentorId}` translates directly to Prisma's `OR: [{ requesterId }, { mentorId }]` — unlike the (cancelled) Firestore plan, Postgres/Prisma supports this natively in one query; no service-layer query-splitting needed here.
- **Checkpoint**: manual/integration smoke of booking, notification, event-registration, and access-request flows (no dedicated `.test.ts` file currently exists for these per the `__tests__/` listing — a **pre-existing test-coverage gap**, not a regression introduced by this migration, but worth flagging during review).

---

## Phase 6 — Admin/Dormant + remaining models

Files: `apps/server/src/modules/admin/*.ts`.

- [ ] **T6.1** Delete `Placement.ts` model — no service/controller/route references it; the Prisma table exists but nothing calls `prisma.placement.*` yet (matches today's dormant state exactly).
- [ ] **T6.2** `admin.service.ts` (national-stats/analytics/users): the on-the-fly aggregates across `User`/`StudentProfile`/`Enrollment`/`Cohort`/`College` (no dedicated Admin collection today) become Prisma `count`/`aggregate`/`groupBy` calls; any `InterestExpressionModel.distinct('userId')`-style call becomes `prisma.interestExpression.findMany({ distinct: ['userId'], select: { userId: true } })`.
- **Checkpoint**: live curl smoke-test of `GET /admin/national-stats`, `GET /admin/analytics`, `GET /admin/users`, `PATCH /admin/users/:id/status` against Postgres.

---

## Phase 7 — Test harness rewrite

Files: `apps/server/vitest.config.ts`, `apps/server/src/__tests__/globalSetup.ts`, `apps/server/src/__tests__/helpers.ts`.

- [ ] **T7.1** `globalSetup.ts`: replace the `MONGO_URI` contains `"forgeloom_test"` guardrail + `dropDatabase()` with a `DATABASE_URL` contains `"forgeloom_test"` guardrail, then a generic `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` loop (via `prisma.$queryRaw` against `information_schema.tables` to enumerate, then `prisma.$executeRawUnsafe` per table) — chosen over `prisma migrate reset` because reset re-runs every migration file on every test run (slow, and couples test speed to migration-history length); a truncate loop is fast regardless of migration count.
- [ ] **T7.2** `vitest.config.ts`: the existing `pool:'forks', singleFork:true, fileParallelism:false` constraint existed because every test file shared one global Mongoose connection. Prisma's client is connection-pooled and safe for concurrent use, but the tests still share one Postgres database with a single truncate-at-start (not per-file) — **keep `fileParallelism:false`/`singleFork:true` for now** (per-test-file transaction-rollback isolation is a bigger, separable follow-up, out of scope here); update the code comment explaining *why* (shared DB with no per-file isolation, not "shared Mongoose connection").
- [ ] **T7.3** `helpers.ts`: `UserModel.create({...})` becomes `prisma.user.create({...})`; `connectDb`/`disconnectDb` re-exports point at the new `prisma.ts`'s `$connect`/`$disconnect`.
- **Checkpoint**: full `npm test` (all 5 existing `.test.ts` files) green against a throwaway `forgeloom_test` Postgres database, run twice in a row to confirm the truncate guardrail gives a clean slate each run.

---

## Phase 8 — One-time Mongo → Postgres data migration script

New file: `apps/server/src/scripts/migrateMongoToPostgres.ts` (sits alongside the existing `apps/server/src/scripts/seed.ts`).

- [ ] **T8.1** Script connects to both a live Mongo instance (read-only, via `mongoose` kept as a devDependency-only import for this one script) and the new Prisma client, and migrates table-by-table in FK-dependency order: `College` → `User` → all 11 profile tables → `Cohort`/`Team`/`TeamMember` → `Course`/`SyllabusDay` → `CourseSession` → `Enrollment` → `AttendanceRecord`/`VideoProgress`/`Assessment`/`Certificate` → `ProblemStatement`/`ProblemStatementDeliverable` → `Sprint`/`SprintTask` → `MilestoneSubmission`/`MilestoneFeedback` → `InvestorAccessGrant`/`Bookmark`/`InterestExpression` → `ScoreEvent` → `Booking`/`Notification`/`CommunityPost`/`Event`/`EventRegistration`/`AccessRequest`/`SpeakerTopic` → `Placement` (empty no-op, no source data).
- [ ] **T8.2** **Identity preservation**: every row's Postgres `id` is set to the literal `mongoDoc._id.toString()` (24-char hex) via `prisma.<model>.create({ data: { id: mongoDoc._id.toString(), ... } })` — no id-mapping table needed anywhere (design doc §0.1), the key simplification versus the cancelled Firebase plan's uid-remapping problem.
- [ ] **T8.3** For the 5 normalized embedded arrays, flatten each subdocument into a row referencing the parent's already-migrated id, assigning `order` from the array index for `SprintTask`/`ProblemStatementDeliverable` (design doc §0.5).
- [ ] **T8.4** For `TrainerProfile.assignedTeams[]`/`MentorProfile.assignedStudents[]`, the script does **nothing** — these fields are dropped entirely and their data is implicitly correct already because `Team.trainerId`/`StudentProfile.mentorId` are migrated directly (design doc §0.3).
- [ ] **T8.5** Script is idempotent-safe via `skipDuplicates: true` on `createMany` calls, and a dry-run mode (`--dry-run` flag) that logs counts without writing, so it can be run against a copy of prod data first.
- **Checkpoint**: run the script against a snapshot of the real dev Mongo database, then spot-check row counts per table against Mongo `db.<collection>.countDocuments()` for all 34 collections; manually verify a handful of cross-references (a `Certificate.enrollmentId` still resolves, a `TeamMember` row exists for each entry that used to be in `Team.memberStudentIds`).

---

## Phase 9 — Cleanup

- [ ] **T9.1** `apps/server/package.json`: remove `mongoose` dependency entirely.
- [ ] **T9.2** Delete `apps/server/src/models/` directory in full (all 34 files + `index.ts`).
- [ ] **T9.3** Delete `apps/server/src/config/db.ts` (superseded by `prisma.ts` from T0.5).
- [ ] **T9.4** `infra/docker-compose.yml`: confirm `mongo` service and `mongo_data` volume are gone (should already be done in T0.1 — this is the "no leftover references" final check, including any `.gitignore`/`README.md`/dev-setup doc mentions of `mongo_data`).
- [ ] **T9.5** `apps/server/src/scripts/seed.ts`: rewrite from Mongoose model calls to `prisma.*` calls (same seeding intent — all 12 `*1@forgeloom.dev` dev accounts — new client).
- [ ] **T9.6** Update `docs/forge-loom-architecture.md`'s data-model section and `docs/forge-loom-local-to-cloud-migration.md`'s hosting section to describe Postgres/Prisma instead of MongoDB/Mongoose/Atlas (already done ahead of schedule as part of the planning pass that produced this doc — verify no residual Mongo language remains after all code-phase changes land).
- **Checkpoint**: `grep -ri mongoose apps/server/src apps/server/package.json` returns nothing; `npm run build && npm test` green end-to-end on a machine that has never had Mongo installed, only `docker compose up postgres redis minio`.

---

## Phase 10 — Frontend regression verification

No `apps/client` source changes are expected in this migration — every ticket below is a **verification/QA ticket**, not a code-change ticket. Skip a ticket only if you can point to the specific backend change that makes it moot (e.g. if T2.3's `.toNumber()` conversion is done, T10.1 should just pass, not be skipped as "not applicable").

- [ ] **T10.1 — Decimal→number regression check (the one genuine risk).** Verified client call sites that assume `course.price`/enrollment amounts are plain JS numbers, not Prisma `Decimal` objects or strings: `apps/client/src/features/course-admin/types.ts:9` (typed as `number`), `apps/client/src/pages/course-admin/CourseEditorPage.tsx:36,50,97` (`String(existing.price)`/`Number(price)` round-trip when editing a course), `apps/client/src/pages/course-admin/CourseListPage.tsx:79` and `apps/client/src/pages/student/CatalogPage.tsx:138,172` (direct `{course.price}` interpolation into JSX). After Phase 2 lands: load the Course Admin editor for an existing course and confirm the price field populates correctly (not `"0"` or `"[object Object]"`), confirm `CatalogPage`/`CourseListPage` render the correct numeric price with no extra decimal artifacts (e.g. Prisma's `Decimal` stringifies with full scale — confirm `599.00` doesn't leak through as `"599.00"` a string where `599` a number was expected, or vice versa break arithmetic if any is ever added later), and confirm creating/editing a course with a decimal price (e.g. 499.50) round-trips exactly, not rounded or truncated.
- [ ] **T10.2 — Talent Pool cursor pagination regression check.** `apps/client/src/features/hr/data.ts:58,61` already treats `cursor`/`nextCursor` as an opaque string (`pageParam` passed straight through, `nextCursor` read straight back) — confirmed via code read that no client-side decoding assumption exists, so this should need zero code changes regardless of how Phase 1's `talentPool.service.ts` encodes cursors internally. Verification only: after Phase 1 lands, click through HR's Talent Pool "Load More" a few pages deep and confirm results don't repeat/skip, and that the domain-filter + search combination still page correctly.
- [ ] **T10.3 — Full click-through smoke test, phase by phase.** Rather than one big smoke test at the very end (which makes it hard to isolate which phase introduced a regression), test each phase's affected screens as soon as that phase's checkpoint passes: Phase 1 → login/register for all 11 roles, HR directory/company profile, Community Leader member management; Phase 2 → Course Admin course CRUD + publish, Student catalog/checkout/enrollment, Trainer attendance-taking, video progress playback; Phase 3 → Citadel hub, sprint cycles, problem statement bookmark/interest, Mentor team/sprint views; Phase 4 → confirm `builderScore` still updates after a sprint completes (no direct UI for this, but Student's Citadel progress views read it); Phase 5 → Booking flows (Student↔Mentor, Sponsor↔College Admin), notification bell, community feed, event registration; Phase 6 → Forge Admin's analytics dashboard (the one page that's pure aggregation, most likely to visually shift if a `count`/`groupBy` translation is subtly wrong).
- **Checkpoint**: all of T10.1–T10.3 pass with zero `apps/client` source edits. If any of them fails, the fix belongs in the corresponding backend phase's mapper/service (per the "zero client changes expected" design goal), not in `apps/client` — a client-side workaround here would mean a backend contract was silently broken.

---

## Cross-cutting items not owned by a single phase

- [ ] **TX.1 — `Decimal` conversion audit.** Beyond the 4 files named in T2.3, grep for any other read site of `Course.price`/`Enrollment.paymentAmount` that assumes a plain JS number (e.g. arithmetic, JSON serialization without `.toNumber()`) before considering Phase 2 complete.
- [ ] **TX.2 — Unique-violation error handling audit.** Every `service.ts` file that currently catches a Mongoose duplicate-key error (code `11000`) needs the Prisma equivalent (`P2002`) — grep `11000` across `apps/server/src/modules/**` to find every site, not just the certificate one called out in T2.6.
- [ ] **TX.3 — Decide `Placement`'s fate explicitly.** It's a dormant, zero-traffic table (per the repo audit, same status the doc `docs/postgres-database-design.md` records). This migration carries the table forward for schema completeness per T6.1's no-op, but confirm with the user whether that's still wanted once the migration is actually underway, versus dropping the model entirely until a future phase builds real placement tracking.

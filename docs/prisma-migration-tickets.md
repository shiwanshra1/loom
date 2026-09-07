# Forge Loom — MongoDB → PostgreSQL/Prisma Migration Tickets

Companion to `docs/postgres-database-design.md` (the schema/ER diagram this executes against). Scoped to exactly what's changing: the persistence layer, local infra, and tests. **Auth (JWT/Redis), BullMQ workers, and MinIO/S3 are untouched and not ticketed** — this is a persistence-layer swap, not the broader Firebase migration that was cancelled (see `docs/archive/`).

**Frontend (`apps/client`) impact:** by design, zero — every `.controller.ts`/`.mapper.ts` boundary is preserved, so the JSON shape each endpoint returns doesn't change, and no `apps/client` source file is expected to need an edit. This is *not* the same guarantee the cancelled Firebase plan could make (that plan changed the Talent Pool cursor format and the auth token flow client-side) — here the risk is narrower but not zero: `Decimal` fields don't automatically round-trip to a JSON `number` the way a Mongoose float did, and there's no compiler error if that conversion is missed. See **Phase 10** below for the frontend verification/regression tickets this risk requires — verification tickets, since no code changes are expected, but nothing here should be marked done without someone actually clicking through the app.

**Conventions:** checkpoint and commit locally after each phase; push to `origin/main` only on explicit request (same cadence every prior phase in `memory.txt` has used). Test files referenced below are confirmed to exist: `apps/server/src/__tests__/{auth,enrollment,attendance,citadel,score}.test.ts`.

---

## Phase 0 — Prisma & infra setup — ✅ DONE (2026-09-07)

- [x] **T0.1** `infra/docker-compose.yml`: **correction during execution** — did NOT replace `mongo:7`; added `postgres:16` alongside it (Mongo still serves every not-yet-migrated module through Phase 8). Host port **5433**, not 5432 — this machine already has an unrelated project's Postgres container bound to 5432. Added `infra/postgres-init/01-create-test-db.sql` (runs once via Postgres's own `docker-entrypoint-initdb.d` convention) to create a second `forgeloom_test` database alongside `forgeloom_dev`, mirroring the existing Mongo test/dev split.
- [x] **T0.2** Added `prisma` (devDependency) + `@prisma/client` (dependency) to `apps/server/package.json`; `mongoose` untouched.
- [x] **T0.3** `apps/server/prisma/schema.prisma` created — full 44-model schema from `docs/postgres-database-design.md` §1, byte-verified via `awk` extraction (no transcription drift).
- [x] **T0.4** `apps/server/src/config/env.ts`: **correction** — added `databaseUrl: required('DATABASE_URL')` but did **not** remove `mongoUri` (see design-doc-level correction below). Removing it now would break every not-yet-migrated module's Mongo connection at boot.
- [x] **T0.5** `apps/server/src/config/prisma.ts` created as specified (`connectPrisma`/`disconnectPrisma` wrappers); wired into `apps/server/src/server.ts` alongside (not instead of) `connectDb()`.
- [x] **T0.6** `apps/server/.env.example` updated. `.env.local` and `.env.test` did not exist at all in this checkout — created both from scratch with dev-only placeholder secrets (JWT/S3 following the established `dev-only-secret-change-me` convention; Razorpay uses an explicit placeholder since no real test-mode key is available in this session — payment flows won't work until real keys are supplied, but nothing in Phase 0/1 touches payments).
- [x] **T0.7** `prisma migrate dev --name init` run against `forgeloom_dev`; `prisma migrate deploy` run against `forgeloom_test`. Both databases confirmed to have all 44 tables via `\dt`.
- **Checkpoint — met**: `prisma generate` succeeded, migration applied cleanly, `npm run typecheck`/`npm run build` both clean across all 3 workspaces with Mongoose still fully in place and the Prisma client also importable.

**Design-doc-level correction found during execution (see `docs/postgres-database-design.md` for the permanent record):** the schema doc's `cuid()` primary-key choice was justified for the *final* Phase 8 data migration, but doing the cutover live, phase by phase, means both databases run side by side for a while — and every Mongoose foreign-key field (`Team.trainerId`, `Enrollment.studentId`, etc.) is a strict `Schema.Types.ObjectId`. A Prisma `cuid()` is not valid ObjectId hex, so a user created after the Phase 1 cutover can never be referenced by a still-Mongo module until that module also migrates (or Phase 8 runs). Confirmed with the user directly (three options presented); chose to **accept this gap as expected dev-stage behavior** rather than switch ID formats or pre-migrate identity data. Phase 1 below implements accordingly, with the gap showing up exactly where predicted (empty `workload`/`programs` for new accounts) and disclosed inline in code comments at each site.

---

## Phase 1 — Identity module group — ✅ DONE (2026-09-07)

Files: `apps/server/src/modules/auth/*.ts` (`auth.service.ts`, `auth.mapper.ts`, `auth.controller.ts`, `profileFactory.ts`, `collegeProvisioning.ts`), `apps/server/src/modules/communityMembers/{communityMember.service.ts,communityMember.mapper.ts}`, `apps/server/src/modules/colleges/{college.service.ts,college.mapper.ts}`, `apps/server/src/modules/hrProfile/{hrProfile.service.ts,hrProfile.mapper.ts}`, `apps/server/src/modules/talentPool/{talentPool.service.ts,talentPool.mapper.ts}`, plus `apps/server/src/scripts/seed.ts` (not originally ticketed for this phase — see below).

- [x] **T1.1 — correction**: did **not** delete any Mongoose model files. `User.ts` and the 11 profile models are referenced by dozens of not-yet-migrated files across every other module (almost everything refs `User`) — deleting them now would break the whole server's compile, not just auth. Actual deletion stays Phase 9's job, once literally nothing imports them. All imports in the 5 migrated modules were swapped to `prisma.*` as ticketed; the old model files simply became unused by these specific files.
- [x] **T1.2** `profileFactory.ts` rewritten exactly as ticketed.
- [x] **T1.3** `communityMember.service.ts`'s `addMember` rewritten to `prisma.communityMember.upsert(...)` on the composite key, exactly as ticketed.
- [x] **T1.4 — partial correction**: `m.assignedStudents.length` → `prisma.studentProfile.count({ where: { mentorId: m.id } })` exactly as ticketed (both sides already Prisma-backed as of this phase). `t.assignedTeams.length` could **not** become `prisma.team.count()` as ticketed — `Team` isn't migrated until Phase 3, so no Team data exists in Postgres yet. Kept as a guarded Mongo `TeamModel.countDocuments({trainerId})` read, skipped entirely (returns 0, not a thrown CastError) when the trainer's id isn't valid Mongo ObjectId hex — i.e. for any trainer registered after this cutover. Revisit this function once Phase 3 lands.
- [x] **T1.5** `talentPool.service.ts` rewritten. The free-text query (name-or-any-skill substring match) has no equivalent in Prisma's type-safe query builder for `String[]` columns — implemented via a fully parameterized `prisma.$queryRaw`/`Prisma.sql` composition (`ILIKE` + `unnest(skills)`) to preserve the original Mongo regex search's behavior exactly, rather than degrading it. Flagged in code as the spot the design doc's future tsvector/pg_trgm upgrade will eventually replace.
- [x] **Unticketed but required**: `apps/server/src/scripts/seed.ts` fully rewritten to Prisma — it directly calls `profileFactory.ts`/`collegeProvisioning.ts`, which are now Prisma-only, so it could not have kept working otherwise. This is effectively Phase 9's T9.5 done early, but scoped only to this script's existing identity/college seeding (no course/citadel seeding exists in it today).
- [x] **Unticketed but required**: `apps/server/src/__tests__/globalSetup.ts` extended with a scoped Postgres truncate (the 15 Phase-1 tables only, hardcoded list) alongside the existing Mongo drop — a deliberately narrow preview of Phase 7's real generalized version. `apps/server/src/__tests__/auth.test.ts` updated to suspend/reinstate via `prisma.user.update` instead of `UserModel.updateOne` (the account it manipulates now lives in Postgres).
- [x] **Disclosed regression, expected and documented**: `attendance.test.ts` and `enrollment.test.ts` are now `describe.skip`-ed with an inline explanation. Both create their test user via the shared Mongo-only `createTestUser` helper, then log in through the real HTTP endpoint — which is Postgres-only as of this phase, so that user is never found. Fixing this for real requires Phase 2 (Course/Enrollment/Attendance move to Prisma too, so the same user works everywhere again) — attempting a workaround now would just be re-implementing Phase 2 early. `citadel.test.ts`/`score.test.ts` were unaffected (they never log in via HTTP).
- **Checkpoint — met**: `auth.test.ts` passes (9/9) against Postgres, run twice consecutively to confirm the truncate guardrail. Full suite: 15 passed, 5 skipped (disclosed above), 0 failed. Live end-to-end verified over real HTTP against a running dev server (not just tests): seeded all 16 dev accounts fresh via the Prisma-backed seed script; logged in as `student1`/`college1`/`hr1`/`community1`; confirmed `GET /colleges` lists both real Postgres colleges; confirmed `college1`'s faculty/programs endpoints return correct-but-empty-as-expected data (0 workload, 0 programs — the accepted gap manifesting exactly as predicted, not an error); confirmed HR profile GET/PATCH round-trips a real update; confirmed HR directory joins the right email; confirmed Talent Pool search returns both seeded students with correctly-joined college names; confirmed a Community Leader can invite an existing account and list members back; confirmed a Student gets blocked from `/admin/users`.

---

## Phase 2 — Courses/Enrollment/Sessions module group — ✅ DONE (2026-09-07)

Files: `apps/server/src/modules/courses/*.ts`, `catalog/*.ts`, `enrollments/*.ts`, `sessions/*.ts`, `progress/courseProgress.service.ts`, `videoProgress/*.ts`, `assessments/*.ts`, `certificates/*.ts`.

- [x] **T2.1 — correction, same as Phase 1**: did not delete `Course.ts`/`Enrollment.ts`/etc. — `apps/server/src/modules/admin/analytics.service.ts` (Phase 6) still imports and reads them directly, and would fail to compile otherwise. Deletion stays Phase 9's job. All 8 migrated modules' own imports were swapped to `prisma.*`.
- [x] **T2.2** `course.service.ts` syllabus handling ported exactly as ticketed — `createCourse` uses a nested `syllabus: { create: [...] }` write, `updateCourse`'s syllabus branch does `prisma.syllabusDay.deleteMany` + nested `create` inside a `$transaction`, preserving wholesale-replace-on-update semantics.
- [x] **T2.3** Decimal→number conversions applied: `course.mapper.ts` (`price`), `enrollment.mapper.ts` (`course.price`, `paymentAmount`), and at the Razorpay call site in `enrollment.service.ts` (`course.price.toNumber()` before `Math.round(...*100)`). Live-verified over real HTTP: a course created with price `499.50` round-trips as the JSON number `499.5`, not a string or object — the exact regression this ticket existed to prevent.
- [x] **T2.4** `session.service.ts`'s `markAttendance` ported to `prisma.attendanceRecord.upsert({ where: { sessionId_studentId: {...} }, ... })` exactly as ticketed.
- [x] **T2.5** `videoProgress.service.ts` ported to `prisma.videoProgress.upsert({ where: { studentId_courseId_dayNumber: {...} } })` exactly as ticketed.
- [x] **T2.6 — correction**: grepped `11000` across the whole codebase before writing this — there was no existing Mongoose duplicate-key catch anywhere to replace (the ticket assumed one existed; it didn't). `certificate.service.ts` keeps its original pre-check pattern (`findUnique` before `create`) unchanged in shape, just on Prisma now. No `P2002` handling was added since there's nothing here to replace it.
- [x] **Unticketed but required**: `college.service.ts`'s `getCollegePrograms` — previously a disclosed Phase 1 gap (read `StudentProfile` from Prisma but `Enrollment`/`Course` from Mongo, so new-era students always showed 0 programs) — rewritten to read Enrollment/Course from Prisma too, since both moved this phase. Closes that gap for real.
- [x] **Unticketed but required**: `notification.service.ts`'s `createNotification` gained a guard (`mongoose.isValidObjectId(userId)`, silently skip if false) — Notification isn't migrated until Phase 5, and Phase 2 code (`session.service.ts` on cancel, `certificate.service.ts` on issue) now calls it with Postgres-native student ids that would otherwise throw a Mongoose CastError. Centralized once here rather than guarded at every call site.
- [x] **Unticketed but required**: `apps/server/src/__tests__/helpers.ts` gained `createTestUserPg` (Prisma-backed test user creation) alongside the existing Mongo-backed `createTestUser` — the latter stays for `citadel.test.ts`/`score.test.ts`, which never log in over HTTP and still need Mongo-compatible ids for still-Mongo Team/Sprint documents. `attendance.test.ts` and `enrollment.test.ts` fully rewritten onto `createTestUserPg` + `prisma.*` calls throughout and un-skipped.
- **Checkpoint — met**: `attendance.test.ts` and `enrollment.test.ts` pass against Postgres (previously skipped in Phase 1 for exactly this reason). Full suite: 5 files, 20/20 passing, run twice consecutively. Live end-to-end over real HTTP against a running dev server: created and published a course (`price: 499.50` round-tripped correctly as a number), browsed the catalog, confirmed enrollment creation fails gracefully with a 502 (not a crash) against the placeholder Razorpay key from Phase 0, manually activated an enrollment to test past the payment gate, posted video progress (95% → `completed: true`, confirming the 90% threshold), pulled the course-progress rollup (50%, 1/2 modules), issued a real certificate (real PDF generated and uploaded to MinIO, real presigned download URL, real public verify endpoint returning correct data), and confirmed re-issuing against the now-`completed` enrollment is correctly rejected.

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

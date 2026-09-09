# Forge Admin Hierarchy, College Onboarding & Bulk Roster Management — Ticket Breakdown

Companion to the approved plan (originally written to the Claude Code plan file; reproduced here for durability). Tracks phased implementation the same way `docs/prisma-migration-tickets.md` tracked the Postgres migration — checkboxes, disclosure notes on corrections found during execution, nothing marked done until actually verified live.

## Context

Today, every account on Forge Loom is created through one public, unauthenticated endpoint: `POST /api/auth/register`. For the four college-scoped roles (Student, Mentor, Trainer, College Admin), anyone can self-register — and a self-registering College Admin instantly founds a brand-new college with no approval step. There is no admin-driven onboarding, no bulk student-roster import, no admin-invited mentor/trainer accounts, and no per-college "batch" concept linking students to a cohort.

This initiative replaces that with a top-down, FORGE-operated onboarding model: a single Forge Admin (the existing seeded `forge_admin` account) who can create peer Forge Admins and who *onboards* colleges — creating the College record and its College Admin account together. That College Admin then runs their own college end-to-end: batches, courses, mentor/trainer invites, and CSV bulk student upload with auto-generated passwords + one-click welcome emails. All admin-provisioned accounts are forced to change their password on first login.

**Locked product decisions** (confirmed with the user before any code was written):
1. The "per-college Forge Admin" **is** the existing `CollegeAdmin` role — reused as-is, not a new role.
2. College Admin **can** create new courses scoped to their own college (real schema change — courses were a single global CourseAdmin-only catalog).
3. Public self-registration is **removed** for the four college-scoped roles only (Student, Mentor, Trainer, CollegeAdmin). The other six roles (Speaker, Hr, Sponsor, CommunityLeader, MediaPartner, Member) keep self-registering, untouched.
4. Stays at the **org/roster layer**. Does **not** build the deeper Citadel operations content from the reference rulebook PDFs (physical zone booking, mentor scoring rubrics, merit-gate entry scoring) — those were shared for context only, not a build request. Existing Team/Sprint/ProblemStatement Citadel features are unchanged.

**Open risks flagged, not yet fully resolved** (revisit if they become real):
- `rollNumber` uniqueness is scoped `(collegeId, rollNumber)`. If any college legitimately reissues the same roll number across different batches/years, this needs to widen to `(collegeId, cohortId, rollNumber)`.
- A College Admin's courses apply college-wide, not per-batch (no `Course.cohortId`). Confirmed assumption, not yet stress-tested against a real "a course belongs to one specific batch" requirement.
- CSV bulk upload assumed **partial success** (create valid rows, report invalid ones per-row) rather than all-or-nothing — needs final confirmation once the upload UI is actually being used.
- Duplicate email across colleges: `User.email` is globally unique, so a bulk upload row will hard-fail if that email exists anywhere — confirm skip-with-warning vs. whole-batch hard error.
- If SMTP is down mid-bulk-upload, accounts exist but can't log in until the queued retry succeeds — confirm whether the result table should show the plaintext temp password once, immediately, as a manual fallback.

---

## Phase 1 — Schema + infra foundation ✅ DONE (2026-09-08)

- [x] **T1.1** `User.mustChangePassword Boolean @default(false)` — additive, set by admin-provisioned account creation (not built yet), cleared by the Phase 2 change-password endpoint.
- [x] **T1.2** Batch = the existing `Cohort` model, reused verbatim (no schema rename — "Batch" is UI copy only, not built yet). Linked to students: `StudentProfile.cohortId` (nullable, `SetNull` on cohort delete so archiving a batch never takes its students with it) + `Cohort.students` reverse relation.
- [x] **T1.3** `StudentProfile.rollNumber` (nullable) with `@@unique([collegeId, rollNumber])` — Postgres treats NULLs as distinct, so existing/self-registered students with no roll number don't collide with each other.
- [x] **T1.4** `Course.collegeId` (nullable) added — unused this phase; `Course.createdBy` still points at `CourseAdminProfile.id` until Phase 3's FK repoint lands. `College.courses` reverse relation added.
- [x] **T1.5** New `utils/generatePassword.ts` (`generateTempPassword`, `crypto.randomInt`-based 8-digit, not `Math.random`).
- [x] **T1.6** New `nodemailer` dependency + `config/mail.ts` (singleton transporter, mirrors the existing `config/s3.ts` pattern) + new `mail: {...}` block in `config/env.ts` (SMTP host/port/user/pass/from) — placeholder credentials added to `.env.local`/`.env.test`/`.env.example`, following the same graceful-placeholder precedent already established for Razorpay.
- [x] **T1.7** New `jobs/welcomeEmailQueue.ts` + `welcomeEmailWorker.ts`, mirroring the existing `scoreQueue.ts`/`scoreWorker.ts` BullMQ pattern exactly (async, not sent synchronously in a request handler — a 300-row CSV would otherwise mean 300 blocking SMTP calls). Includes retry/backoff (3 attempts, exponential) and a send-rate limiter (5/sec, tune once a real provider is configured). Job payload carries `email`/`displayName` directly rather than re-deriving them from profile tables — **found during implementation**: `MentorProfile`/`TrainerProfile` have no stored display-name field at all (`profileFactory.ts` silently discards `displayName` for those two roles), so the worker cannot reliably look a name back up from the DB for those roles. Registered in `server.ts` alongside the existing `startCitadelWorker()`/`startScoreWorker()` calls.
- **Corrections found during execution, disclosed**:
  - `prisma migrate dev` refused to run in this non-interactive shell (needs a TTY to confirm a warning about the new unique constraint). Worked around with the standard non-interactive migration path: `prisma migrate diff` (schema-datasource → schema-datamodel) to generate the SQL, hand-created the migration folder, applied via `prisma migrate deploy` (both `forgeloom_dev` and `forgeloom_test`) — same result as `migrate dev`, just without the interactive prompt.
  - This shell's `localhost` DNS resolution was silently hanging (confirmed via a raw Node TCP connect test — resolves to the IPv6 loopback, which this Docker Desktop port-publish apparently isn't reachable through in this environment). Local, gitignored `.env.local`/`.env.test` now point `DATABASE_URL`/`REDIS_URL`/`S3_ENDPOINT` at `127.0.0.1` instead of `localhost` to work around it. `.env.example` left as `localhost` (documentation/template for other machines, where this may not apply).
  - A stray leftover server process (PID 13364, not from this session's own launch) was already holding port 4000 — killed it specifically (not its process tree, learning from an earlier incident this session) before the real dev-server smoke test could run.
- **Checkpoint — met.** `npm run typecheck`/`build` clean across all 3 workspaces, root `eslint` clean on every new/changed file, `npx vitest run` green (5 files/20 tests) twice consecutively. Live-verified: dev server boots cleanly with the new worker wired in (self-recovers from `tsx watch`'s normal restart race, not a bug), `student1@forgeloom.dev` login still works unchanged. Injected two new test accounts directly (temporary one-off script, deleted after running) to manually verify the new fields against real logins ahead of any UI: **`student3@forgeloom.dev` / `69951064`** (College 1, new "Batch Test 2026" cohort, roll number `FIT-2026-001`, `mustChangePassword: true`) and **`mentor3@forgeloom.dev` / `60282532`** (College 1, `mustChangePassword: true`). Both log in successfully today; neither will look any different in the UI yet since nothing reads `cohortId`/`rollNumber`/`mustChangePassword` until Phases 2+.

---

## Phase 2 — Password-change capability ✅ DONE (2026-09-09)

- [x] **T2.1** New `POST /auth/change-password` (authenticated, any role) — `{ currentPassword, newPassword }`, verifies via `comparePassword`, `hashPassword`s the new one, clears `mustChangePassword`, bumps `refreshTokenVersion` (matches the existing logout version-bump security pattern — invalidates other sessions still on the old password's tokens).
- [x] **T2.2** `PublicUser` (shared-types) gains `mustChangePassword: boolean`, threaded through `/me`, login, and register responses.
- [x] **T2.3** New `pages/auth/ForcedPasswordChangePage.tsx`; wire into `auth/RequireAuth.tsx` — add a `user?.mustChangePassword` redirect branch alongside the existing unauthenticated-redirect. Applies to every role, not just Student.
- [x] **T2.4** `authApi.ts` gains a change-password request function; `AuthContext.tsx` gains a `changePassword` method that updates `user.mustChangePassword` locally on success (so `RequireAuth` stops redirecting without a full re-fetch).
- **Checkpoint — met.** `refreshTokenVersion` is bumped for the first time anywhere in the codebase (previously stored/compared but never incremented) — invalidates every other session's refresh token and reissues fresh tokens for the caller's own session, since its refresh token is orphaned by the same bump. Live-verified against `student3@forgeloom.dev`/`69951064` (a Phase 1 test account with `mustChangePassword: true`): wrong current password → 401; correct change → `mustChangePassword: false` in the response, old password rejected afterward, new password works. `mentor3@forgeloom.dev` was left untouched (`60282532`, still `mustChangePassword: true`) as a control. `npm run typecheck`/`build`/lint clean, `npx vitest run` green twice.

---

## Phase 3 — ⚠ `Course.createdBy` repoint ✅ DONE (2026-09-09)

- [x] **T3.1** Migration step 1 (additive): add nullable `Course.createdByUserId`, no FK yet. Deploy, verify zero behavior change.
- [x] **T3.2** One-off backfill script (same shape/discipline as the deleted `migrateMongoToPostgres.ts` — read-only against source, verified against a scratch/dev copy first, not run blind against live data): for every `Course`, resolve `CourseAdminProfile.findUnique({ id: course.createdBy }).userId` → set `createdByUserId`. Assert every row backfills; throw (don't silently skip) on any that don't resolve.
- [x] **T3.3** Migration step 3: make `createdByUserId` required, add the FK to `User(id)`, drop the old `createdBy` column/FK to `CourseAdminProfile`, rename into place.
- [x] **T3.4** Application code: `course.service.ts`, `courseAccess.ts`, `course.mapper.ts` — their `CourseAdminProfile` lookups collapse into direct `User.id` comparisons (a simplification, not just a rename; `courseAccess.ts`'s ownership check no longer needs an extra profile-table query — `isCourseAdminOwner` went from `async` with a DB lookup to a plain synchronous field comparison).
- **Corrections found during execution, disclosed**:
  - The step-3 migration correctly refused to run against `forgeloom_test` on the first attempt (`column "createdBy" contains null values`) — 5 stale `Course` rows were left over from an earlier `vitest run` (globalSetup truncates tables at the *start* of a run, not the end, so the previous run's fixtures were still sitting there unbackfilled). Recovered via `prisma migrate resolve --rolled-back`, ran the backfill script against `forgeloom_test` too, retried — succeeded. Not forced through; the failure was a legitimate catch of stale data.
  - `enrollment.test.ts` and `attendance.test.ts` directly constructed `Course` fixture rows using `createdBy: adminProfile.id` (the old `CourseAdminProfile.id`) — no longer a valid FK target after the repoint. Fixed all 3 occurrences to `createdBy: adminUser.id`.
- **Checkpoint — met.** Row counts matched before/after the backfill on both databases. `npm run typecheck`/`build`/lint clean, `npx vitest run` green twice (20/20) after the fixture fix. Live-verified: `course_admin1@forgeloom.dev`'s `GET /api/courses/mine` still returns all 3 existing courses correctly; `student1@forgeloom.dev`'s `GET /api/catalog` unaffected.

---

## Phase 4 — Forge Admin creates Forge Admin + College onboarding ✅ DONE (2026-09-09)

- [x] **T4.1** New `POST /admin/forge-admins`, `GET /admin/forge-admins` (ForgeAdmin-only) — reuses the shared `createAdminManagedAccount` provisioning service (built this phase, in `modules/admin/accountProvisioning.service.ts`): generates + hashes an 8-digit temp password, creates the `User` with `mustChangePassword: true`, calls the existing `createProfileForRole` (no-op for ForgeAdmin, unchanged), enqueues a welcome email.
- [x] **T4.2** `POST /colleges` repurposed (confirmed zero-blast-radius: grepped, nothing currently calls this endpoint) into a transactional onboarding call — `College` + `User(role=college_admin)` + `CollegeProfile` created together in one `$transaction`.
- [x] **T4.3** New `GET /admin/colleges` — count + list onboarded colleges with admin contact, student/batch counts (`college.service.ts`'s `getAdminCollegeSummaries`, exposed through `adminRouter` since it's Forge Admin's cross-college oversight view, not the public college directory).
- [x] **T4.4** Frontend: `pages/admin/CollegesPage.tsx` (stat + list + "Onboard New College" modal), `pages/admin/ForgeAdminsPage.tsx`, both wired into `layout/roleNav.ts`'s `[Role.ForgeAdmin]` entry and `App.tsx`'s `Role.ForgeAdmin` route section.
- **Judgment call, disclosed**: both onboarding endpoints (`POST /colleges`, `POST /admin/forge-admins`) return the plaintext `tempPassword` once in the response body, shown once in the success modal alongside the admin's email — not persisted or re-fetchable after. This resolves one of the plan's open risks ("show the temp password once as a manual fallback if SMTP is slow/down") in favor of showing it, since the welcome email is only queued (best-effort) and the admin creating the account has no other way to hand over working credentials immediately. Never logged server-side.
- **Checkpoint — met.** Verified live end-to-end via HTTP against the real dev stack (`admin1@forgeloom.dev`): created a second Forge Admin (`admin2@forgeloom.dev`), confirmed it appears in the list; onboarded a real test college (`Phase 4 Test College`) with a fresh College Admin (`collegeadmin2@forgeloom.dev`), confirmed the College/User/CollegeProfile all landed correctly in `GET /admin/colleges` (student/batch counts, admin contact); confirmed the new College Admin can log in with the returned temp password and `mustChangePassword: true`/`collegeId` are both set correctly; confirmed a duplicate email is rejected with 409 on both endpoints; confirmed a non-Forge-Admin token gets 403 on `GET /admin/colleges`. `npm run typecheck`/`build`/lint clean across all 3 workspaces, `npx vitest run` green twice (20/20, unaffected by this phase).

---

## Phase 5 — ⚠ Remove self-registration for the 4 college-scoped roles ✅ DONE (2026-09-09)

- [x] **T5.1** Reject Student/Mentor/Trainer/CollegeAdmin specifically at the `/auth/register` boundary (validation-layer change) while the other 6 roles keep working through the same endpoint unchanged. **Implementation note**: done by narrowing `SELF_REGISTERABLE_ROLES` itself (shared-types) to also exclude `COLLEGE_SCOPED_ROLES`, rather than adding a separate check — `registerSchema`'s `z.enum(SELF_REGISTERABLE_ROLES)` then rejects the 4 roles automatically with a clear "Invalid enum value" listing exactly the 6 still-valid options, and `RegisterPage.tsx`'s dropdown (which already just maps over the same constant) stops offering them for free.
- [x] **T5.2** Folded the college-founding logic into one place: `college.service.ts` gained `createCollegeWithAdmin` (College + College Admin User + CollegeProfile in one `$transaction`, parameterized on `passwordHash`/`mustChangePassword` so callers control those); `onboardCollege` (Phase 4) now calls it, generating its own temp password. The old `modules/auth/collegeProvisioning.ts` (`resolveCollegeIdForRegistration`) is deleted — after T5.1, `registerUser` never receives a college-scoped role, so its entire body was dead code.
- [x] **T5.3** `scripts/seed.ts`'s `seedCollegeAdmin` now calls `createCollegeWithAdmin` directly with its own known `SEED_PASSWORD` hash and `mustChangePassword: false`, instead of `resolveCollegeIdForRegistration` + a separate `createProfileForRole` call.
- [x] **T5.4** `RegisterPage.tsx` simplified — `needsCollegePicker`, the college-picker `<select>`, the `colleges`/`collegeId` state, and the college-fetch `useEffect` are all removed (dead now that no self-registerable role is college-scoped); `RegisterPayload`/`registerSchema` both drop the `collegeId` field entirely.
- **Checkpoint — met.** Live-verified against the real dev stack: `POST /auth/register` with `role: "student"` and `role: "college_admin"` both get a clean `400` naming the 6 valid roles (`speaker | hr | sponsor | community_leader | media_partner | member`); `role: "hr"` still succeeds with `201` and `mustChangePassword: false`. `npm run seed` re-run against the existing dev DB completes cleanly (all 16 accounts hit the `skip` path, confirming the refactored `seedCollegeAdmin` doesn't crash on the pre-existing rows) — the `createCollegeWithAdmin` "create" branch itself was already live-exercised via Phase 4's `onboardCollege` smoke test, since both now share the exact same function. `npm run typecheck`/`build`/lint clean across all 3 workspaces, `npx vitest run` green twice (20/20, no test changes needed — the existing `auth.test.ts` already only exercised `Role.Hr`).

---

## Phase 6 — College Admin roster + batch management ✅ DONE (2026-09-09)

- [x] **T6.1** New module `modules/college/roster.{controller,service,mapper,validation,routes}.ts` — `POST /college/students`, `/mentors`, `/trainers` (single admin-created account, `collegeId` forced server-side from `req.user.collegeId`, reuses `createAdminManagedAccount`). Also added `GET /college/students` (not originally ticketed, added because `StudentsPage.tsx`/T6.3's batch-move UI need something to list and act on) — returns each student's email/name/rollNumber/batch, scoped to the caller's own college.
- [x] **T6.2** Widened `cohortRouter.post('/')` from `authorize(Role.ForgeAdmin)` to also allow `Role.CollegeAdmin` — `createCohortSchema.collegeId` is now optional (Forge Admin still supplies it explicitly; College Admin gets it forced from `req.user.collegeId` in the controller, ignoring anything sent in the body) and `cohort.service.ts`'s `createCohort` now takes the resolved `collegeId` as an explicit parameter rather than trusting it from the input object.
- [x] **T6.3** New `PATCH /college/students/:id/batch` — validates the target student and (if non-null) the target cohort both belong to the caller's own college before moving; `cohortId: null` explicitly un-batches a student.
- [x] **T6.4** Frontend: `pages/college/BatchesPage.tsx`, `pages/college/StudentsPage.tsx` (single-add modal + inline per-row batch-select dropdown wired to the PATCH endpoint; no CSV yet), `pages/college/FacultyPage.tsx` (extends the existing read-only faculty list with separate mentor/trainer invite modals). New nav items added to `roleNav.ts`'s `[Role.CollegeAdmin]` entry and `App.tsx`'s College Admin route section.
- [x] **T6.5** New shared UI primitive `components/ui/DataTable.tsx` (dumb columns/rows table — a `render` function per column, so a status column is just one that returns a `<Badge>`, not a special-cased prop). **Note**: Phase 4's `CollegesPage.tsx`/`ForgeAdminsPage.tsx` predate this component (built one phase earlier) and still use plain divs for their lists — not retrofitted to `DataTable` here, since that would be unrequested rework outside this phase's scope; flagging so it's a known, deliberate inconsistency rather than an oversight.
- **Checkpoint — met.** Live-verified against the real dev stack as `college1@forgeloom.dev`: listed existing students (correctly showed `student3`'s Phase 1 batch/roll-number data); created a real batch (`POST /cohorts` as a College Admin, previously ForgeAdmin-only); created a real student and mentor via the roster endpoints; moved the new student into the new batch via the PATCH endpoint and confirmed the list reflected it; confirmed the new student logs in with `mustChangePassword: true`. Confirmed cross-college isolation (college2's admin sees only their own student, never college1's) and the authorization boundary (a Student token gets `403` on `POST /college/students`). `npm run seed` re-verified: `college1@forgeloom.dev` still logs in with `mustChangePassword: false`, confirming Phase 5's seed fix holds. `npm run typecheck`/`build`/lint clean across all 3 workspaces, `npx vitest run` green twice (20/20, unaffected by this phase).

---

## Phase 7 — CSV bulk upload + welcome email dispatch

- [ ] **T7.1** New `POST /college/students/bulk` — validates all rows first (zod array schema: name/batchId/rollNumber/email), creates what's valid, returns a per-row result (`created` / `error` + reason) — partial success (flagged as an open risk above, confirm before/during this phase).
- [ ] **T7.2** New `POST /college/students/bulk/send-welcome-emails` — explicit second step, takes the `userId`s from the just-completed bulk-create response, enqueues emails for exactly those (not automatic — gives the admin a chance to review the result table first).
- [ ] **T7.3** New shared UI primitive `components/ui/FileDropInput.tsx` + `lib/parseCsv.ts` (client-side CSV parsing via `papaparse`, not hand-rolled — real-world Excel-exported CSVs have quoting/escaping edge cases worth not re-solving). CSV parsing/validation happens client-side before any network call; the bulk-upload endpoint accepts a validated JSON array, not multipart (the API client is JSON-only today, and there's no real benefit to adding multipart handling for a small CSV).
- [ ] **T7.4** `StudentsPage.tsx` gains the bulk-upload section (drop zone → client validation → upload → `DataTable` of per-row results → "Send Welcome Emails" button gated on a successful upload).
- **Checkpoint**: load-test with a realistic 100–500 row batch. Confirm partial-success behavior (a file with 2 deliberately-bad rows creates the valid ones and reports the bad ones clearly), confirm the async email queue doesn't block the upload response, confirm the rate limiter keeps sends under the configured cap.

---

## Phase 8 — College Admin course creation

- [ ] **T8.1** Widen `POST /courses` to accept `Role.CollegeAdmin` in addition to `Role.CourseAdmin` — CollegeAdmin variant forces `collegeId`/`createdBy` from the session; CourseAdmin variant unchanged (`collegeId = null`, stays in the global catalog).
- [ ] **T8.2** Catalog visibility filtering: a college-scoped course (`collegeId != null`) is visible only to that college's own members + ForgeAdmin, never other colleges' students even if published. Widen the `GET /courses`/`GET /catalog` `where` clause with `OR: [{ collegeId: null }, { collegeId: viewer.collegeId }]` for college-scoped viewers.
- [ ] **T8.3** `pages/college/CoursesPage.tsx` — reuses the existing `pages/course-admin/CourseEditorPage.tsx` create-course form pattern.
- **Depends on Phase 3** (the `Course.createdBy` FK repoint must be live first, since CollegeAdmin has no `CourseAdminProfile` row to point at).
- **Checkpoint**: a College Admin creates a course, confirms it's invisible to a student at a *different* college but visible/enrollable to their own college's students; confirm the existing global CourseAdmin catalog flow is completely unaffected.

---

## Phase 9 — Forge Admin per-college drill-in + polish

- [ ] **T9.1** New `pages/admin/CollegeDrillInPage.tsx` (`/admin/colleges/:id`) — read-only cross-college view, reusing College Admin's own data hooks parameterized by an optional `collegeId` override.
- [ ] **T9.2** Backend: every roster/batch/course endpoint from Phases 6-8 accepts an optional `:collegeId` override for ForgeAdmin callers, routed correctly through the existing `scopeToCollege` middleware (which already has a ForgeAdmin bypass built in — `apps/server/src/middleware/scopeToCollege.ts`) rather than accidentally 403'ing ForgeAdmin via a missing-collegeId check (ForgeAdmin's own `User.collegeId` is null).
- [ ] **T9.3** Optional polish, not required: Trainer-side batch surfacing (derivable from existing `Course.collegeId`/`CourseSession` joins, no schema change needed), Events flow persistence cleanup (the College Admin dashboard's inline "host event" form is currently non-persisted client-side only — worth fixing here since it's adjacent, but scope-creep vs. must-have).
- **Checkpoint**: a Forge Admin can view (not edit unless the underlying role also permits it) any onboarded college's batches/courses/roster from one central place; no new data-integrity surface introduced.

---

## Cross-cutting reminders carried from the Prisma migration's own established discipline

- Push to `origin/main` only on explicit request — commit locally after each phase in the meantime.
- Full verification every phase: `typecheck`/`build`/lint clean across workspaces, `npx vitest run` green (run twice), live HTTP smoke test against the real Docker stack — not just typechecking.
- Disclose every correction/judgment call found during execution, in this doc and in `memory.txt` — never silently patch over a wrong assumption from planning.

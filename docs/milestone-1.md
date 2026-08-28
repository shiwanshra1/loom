# Forge Loom — Master Build Roadmap (10 Phases)
### For the Claude Code agent working in this repo. Read this fully before writing any code.

---

## 0. Before you start — orientation

**Read these first, in this order, if they aren't already loaded in your context:**
1. `memory.txt` — the running log of everything already built in this repo. Trust it over your own assumptions about repo state.
2. `docs/forge-loom-architecture.md` — the original system architecture (data model, auth, scaling, Citadel state machine, score engine).
3. `docs/forge-loom-screen-to-data-binding.md` — how the already-built visual screens map to data.
4. `docs/forge-loom-wireframes.md` — text specs for the roles that don't have visual designs.

**What already exists in this repo (per `memory.txt`), so you don't rebuild it:**
- npm-workspaces monorepo: `packages/shared-types`, `apps/server` (Express + TS), `apps/client` (React + TS + Vite + Tailwind v4 + React Router v6 + TanStack Query), `infra/docker-compose.yml` (Mongo/Redis/MinIO).
- Real, working **auth system**: JWT access tokens + Redis-backed rotating refresh tokens, `authenticate` → `authorize` → `scopeToCollege` middleware chain, register/login/refresh/logout/me endpoints, 11 role profile schemas already in Mongoose.
- All **11 existing roles** (student, mentor, trainer, speaker, hr, sponsor, college_admin, community_leader, media_partner, member, forge_admin) have real login and a real, click-through dashboard shell in the frontend. **Student and Mentor** have proper multi-page list+detail flows built on typed mock-data hooks (`features/{role}/{types,mockData,hooks}.ts`). The **other 9 roles** have one consolidated dashboard page each, also on mock data, with HR's Talent Pool being the one exception already built with real-feeling search/filter/pagination (still against mock data).
- Seed script creates one test account per role (`{role}1@forgeloom.dev` / `test1234`).
- Local dev stack is verified working end-to-end (Docker Mongo/Redis/MinIO + API + client, real login tested).
- Repo is pushed to `https://github.com/shiwanshra1/loom.git`, branch `main`.

**What none of that has yet:** any real backend for courses, colleges, cohorts, teams, attendance, Citadel, scoring, certifications, bookings, notifications, or search. Every dashboard beyond auth is currently reading from local mock arrays. **That is what this roadmap builds.**

**Standing engineering conventions to keep following (established in prior phases — don't deviate without a reason):**
- Backend: Mongoose + TypeScript models, one file per collection under `apps/server/src/models/`. Route handlers grouped by module under `apps/server/src/modules/`. Background jobs under `apps/server/src/jobs/` (BullMQ).
- Frontend: one folder per role/feature under `apps/client/src/features/{name}/` containing `types.ts`, `hooks.ts` (TanStack Query), and page components. Converting a page from mock to real data means changing the `queryFn` inside `hooks.ts` — **not** rewriting the page component, unless the real data shape genuinely requires a different UI.
- Shared UI primitives already exist: `ProgressBar`, `ProgressDonut`, `Badge`, `Tabs`, `StatCard`, `SimpleLineChart`. Reuse them; only add a new primitive if nothing existing fits.
- After every phase: run `npm run typecheck`, `eslint .`, full `npm run build`, and a smoke test (curl or otherwise) of new/changed routes — this has been the verification bar for every phase so far, keep it.
- **After every phase, update `memory.txt`** following its existing format: Requested / Delivered / Decisions made without asking (disclosed) / Open questions.
- When something in this roadmap or the underlying docs is ambiguous or conflicting, **disclose the decision you made rather than silently picking one**, exactly as done in every phase so far. Don't block on asking unless the ambiguity is large enough that guessing wrong would mean real rework.

**Priority context driving this roadmap:** Of the (soon-to-be) 12 roles, active build priority is **Student, Trainer, College Admin, and a new 12th role, Course Admin**. The other roles stay exactly as they are (fully click-through on mock data) until Phase 6 onward. Nothing is being removed — priority order only.

---

## Phase 1 — Course Admin: New Role, Course & Syllabus Backend

**Goal:** Stand up the 12th role and give it a real backend for creating courses with a day-mapped syllabus. Nothing downstream (catalog, enrollment, attendance) can be built until courses are real, structured entities — this phase is the foundation everything else in the priority set sits on.

### Backend

**New role:** `course_admin` — add to the `Role` enum in `packages/shared-types`, add a `CourseAdminProfile` Mongoose model (minimal: `userId`, `name`, `department`), add to the auth module's role-based registration logic (decide, and disclose, whether this role is public-registerable or admin-provisioned only — recommend the latter, same treatment as `forge_admin`, since course creation is a trusted operation).

**Updated `courses` collection** (previously a bare stub referenced by Student mock data — this phase makes it real):
```
courses: {
  title: string
  description: string
  createdBy: ObjectId (ref CourseAdminProfile)
  deliveryMode: "online" | "offline"
  durationHours: number
  durationDays: number
  price: number
  currency: string (default "INR")
  status: "draft" | "published" | "archived"
  syllabus: [{
    dayNumber: number
    title: string
    description: string
    videoRef: ObjectId | null   // populated only for online courses, points into a `courseVideos` sub-array or collection (see Phase 4)
  }]
  createdAt / updatedAt
}
```
Keep `syllabus` embedded (not a separate collection) — it's small, bounded (days ≤ a few hundred), and always read/written as a whole with its parent course, which is exactly the case embedding is right for per the architecture doc's indexing principles.

**Endpoints** (all under `authorize("course_admin")` except the public listing ones):
- `POST /courses` — create a course in `draft` status
- `PATCH /courses/:id` — update course details/syllabus
- `PATCH /courses/:id/status` — draft → published → archived
- `GET /courses/mine` — Course Admin's own created courses
- `GET /courses` — **public/authenticated listing** (any logged-in role can call this; used by Phase 2's catalog) — published courses only, paginated
- `GET /courses/:id` — single course detail, published-only for non-admins

### Frontend

- New role added to `roleNav`/`roleHome` config, new route tree `/course-admin/*`.
- **Course list page** (`/course-admin`): table of the admin's own courses (draft/published/archived tabs), "+ New Course" action.
- **Course editor** (`/course-admin/courses/:id/edit`, and a "new" variant): form for title/description/price/duration/delivery mode, plus a **syllabus builder** — an ordered list editor where each row is one day (day number, title, description). This is the most novel piece of UI in this phase; keep it simple (add row / reorder / delete row), no drag-and-drop library needed for v1.
- **Publish action**: explicit button, moves `draft → published`.
- Add `features/course-admin/{types,hooks}.ts` following the established pattern — this can go straight to real API calls since the backend is built in this same phase, no mock-data intermediate step needed here.

### Definition of Done
- A seeded `course_admin1@forgeloom.dev` account can log in, create a course with a multi-day syllabus, and publish it.
- `GET /courses` (as any other role) returns that published course.
- typecheck / lint / build / smoke test all clean, per standing convention.

---

## Phase 2 — Course Catalog, Enrollment & Commerce (Payment Stubbed)

**Goal:** Students can browse published courses and "purchase" them (payment stubbed, Razorpay slots in later without restructuring), which creates a real enrollment that unlocks the course in their dashboard — replacing the current mock `enrolledCourses` data.

### Backend

**New collection `enrollments`:**
```
enrollments: {
  studentId: ObjectId (ref User)
  courseId: ObjectId (ref courses)
  status: "pending_payment" | "active" | "completed" | "refunded"
  paymentRef: string | null       // stub now, real Razorpay payment/order id later
  paymentAmount: number
  enrolledAt: Date
  completedAt: Date | null
}
```

**Endpoints:**
- `GET /catalog` — published courses, filterable by delivery mode, for the Student-facing browse view (thin wrapper over Phase 1's `GET /courses`, but framed for the student audience — e.g. excludes admin-only fields)
- `POST /enrollments` — body: `courseId`. Creates an enrollment in `pending_payment`, then **immediately transitions it to `active`** via the stubbed payment step (a single function, `processPayment(enrollment)`, that always succeeds for now — isolate this function specifically so swapping in real Razorpay later is a one-function change, not a flow rewrite).
- `GET /enrollments/mine` — the logged-in student's enrollments, joined with course details — this is what replaces the Student dashboard's mock `enrolledCourses`.

### Frontend

- **New page**: `/student/catalog` — browsable course list (cards: title, price, duration, delivery mode badge), "Enroll" / "Buy Now" action per card.
- **Checkout step**: even though payment is stubbed, build a real (if minimal) checkout screen/modal — course summary, price, a "Confirm Purchase" button — so the UX seam for Razorpay is a drop-in replacement of this one screen's submit handler, not new UI later.
- **Update `features/student/hooks.ts`**: swap the mock `enrolledCourses` query to call `GET /enrollments/mine`. The existing Home and Courses pages should need little to no visual change — just a real data source.
- Add nav entry for the catalog (`Courses` section gets a "Browse" sub-view, or a distinct nav item — your call, disclose which).

### Definition of Done
- A seeded student account can browse the catalog, "purchase" a course, and immediately see it appear in `/student/courses` and `/student` home, sourced from real data.
- Re-purchasing an already-enrolled course is blocked or clearly handled (your call how — disclose it).

---

## Phase 3 — Unified Attendance & Session Scheduling System (Program-Wide)

**Goal:** One attendance mechanism used everywhere — offline classes, live online sessions, and (later, Phase 8) mentor bookings — matching the `attendanceRecords` model from the original architecture doc, not a bolted-on offline-only feature.

### Backend

**New collection `courseSessions`** (a scheduled occurrence of a course — one per calendar day from the syllabus, materialized when a cohort/batch of students enrolls, or generated on enrollment for a self-paced start date — decide and disclose the exact triggering rule):
```
courseSessions: {
  courseId: ObjectId (ref courses)
  dayNumber: number              // maps back to courses.syllabus[].dayNumber
  scheduledDate: Date
  mode: "offline" | "live_online" | "self_paced"   // self_paced sessions don't take attendance — see Phase 4
  status: "scheduled" | "completed" | "cancelled"
  cancelReason: string | null
  trainerId: ObjectId (ref User) | null
}
```

**Updated/confirmed `attendanceRecords` collection** (from the original architecture doc — this phase is what actually builds it):
```
attendanceRecords: {
  sessionId: ObjectId (ref courseSessions)
  studentId: ObjectId (ref User)
  status: "present" | "absent" | "excused"
  markedAt: Date
  markedBy: ObjectId (ref User)   // the Trainer
}
```
Compound index `(sessionId, studentId)` unique — one record per student per session. Compound index `(studentId, markedAt)` for the student's own history view (per the architecture doc's indexing principles, §6).

**Endpoints:**
- `GET /courses/:id/sessions` — a course's full session calendar
- `PATCH /sessions/:id` — Trainer marks a session `cancelled` with a required `cancelReason`, or `completed`
- `POST /sessions/:id/attendance` — Trainer submits attendance for a session, body: array of `{ studentId, status }`, bulk-writes `attendanceRecords`
- `GET /students/:id/attendance?courseId=` — a student's attendance history for a course (used by both the student's own view and the Trainer's roster view)

### Frontend

- **Trainer**: a new "Take Attendance" view per course session — roster with present/absent/excused toggles per student, a "Cancel this session" action with a required reason field. This likely becomes a new tab or drill-in on the existing Trainer course-cards view rather than a fully new page — extend what's there.
- **Student**: attendance history becomes part of the existing (currently mock) Assignments/Attendance area described in the wireframes — read-only calendar/list of past sessions and their status.
- Both sides should visually distinguish `cancelled` from `absent` — a cancelled class must never look like a missed one.

### Definition of Done
- A Trainer can mark a real session as completed with per-student attendance, or cancel it with a reason.
- The affected student sees the correct status reflected on their own attendance view.
- No student can be marked present/absent on a session for a course they aren't enrolled in (enforce via the `enrollments` collection from Phase 2).

---

## Phase 4 — Online Course Delivery: YouTube Video Player & Watch Progress

**Goal:** Online courses play unlisted YouTube videos embedded in-app, with our own watch-progress tracking layered on top (YouTube doesn't expose this to us after the fact). Informational only for now — no completion gating.

### Backend

**Extend `courses.syllabus[].videoRef`** into a real field: `youtubeVideoId: string` directly on each syllabus day (simpler than a separate `courseVideos` collection, since a video belongs to exactly one syllabus day and is never queried independently of its course).

**New collection `videoProgress`:**
```
videoProgress: {
  studentId: ObjectId (ref User)
  courseId: ObjectId (ref courses)
  dayNumber: number             // which syllabus day / video
  lastPositionSeconds: number
  durationSeconds: number
  percentWatched: number        // cached, recomputed on each progress update
  completed: boolean            // e.g. percentWatched >= 90, threshold your call, disclose it
  updatedAt: Date
}
```
Compound index `(studentId, courseId, dayNumber)` unique.

**Endpoints:**
- `POST /video-progress` — body: `{ courseId, dayNumber, positionSeconds, durationSeconds }`, upserts the record, recomputes `percentWatched`/`completed`. Called periodically from the player (e.g. every 10–15s of playback and on pause/unmount) — **not on every single timeupdate event**, to avoid hammering the API at scale.
- `GET /video-progress?courseId=` — a student's progress across every video in a course, used to render the per-video and overall progress bars.

### Frontend

- **Video player component**: wraps the YouTube IFrame Player API (`https://www.youtube.com/iframe_api`), loads the given `youtubeVideoId`, and periodically reports position to `POST /video-progress` as above.
- **Student course-detail view**: per syllabus day, show the embedded player when that day's content is video-based, with a progress bar underneath sourced from `videoProgress`. No gating — every day's video is playable regardless of prior progress, per the earlier decision.
- Note in code/comments: videos **must** be uploaded as Unlisted, not Private, or embedding will fail for students — this is a content-ops requirement, not something the code can work around.

### Definition of Done
- A student can play an embedded unlisted YouTube video inside the course view, progress persists across a page reload (fetched from `videoProgress`, not just player state), and the progress bar reflects real watched percentage.

---

## Phase 5 — Progress/KPI Dashboards & Unified Course Calendar

**Goal:** The GFG-style progress view, and a calendar that maps a course's syllabus onto real dates for both Student and Trainer — pulling together Phases 1–4 into the actual dashboards the priority roles will use daily. Also introduces exam/assessment scheduling, since "next examination" needs a real source.

### Backend

**New collection `assessments`** (lightweight — full grading/scoring integration is Phase 8's score engine, this phase just needs them schedulable and visible):
```
assessments: {
  courseId: ObjectId (ref courses)
  title: string
  type: "quiz" | "exam" | "assignment"
  scheduledDate: Date
}
```

**Endpoints:**
- `POST /courses/:id/assessments`, `GET /courses/:id/assessments` — Course Admin/Trainer creates and lists them
- `GET /students/:id/course-progress?courseId=` — a single computed endpoint that returns everything a KPI view needs in one call: overall % complete (from `attendanceRecords` for offline sessions, `videoProgress` for online videos), modules done vs. remaining, next upcoming session, next upcoming assessment. Compute this server-side rather than making the frontend stitch together three separate queries — this is exactly the kind of rollup the architecture doc's indexing section warns against recomputing live at scale, so if this becomes a bottleneck later, cache it the same way `builderScore` is cached elsewhere — but for now a direct computed read is fine given per-student, per-course query volume.

### Frontend

- **Course calendar** (Student and Trainer, same underlying component with different permissions): month or list view combining `courseSessions` and `assessments` for a given course, each day showing its syllabus topic, session status, and any scheduled assessment.
- **KPI dashboard** (Student's course-detail view, and Trainer's per-course roster view): overall progress ring/bar, modules complete count, next session, next assessment — sourced from the single rollup endpoint above. This is the "GeeksforGeeks-style" view referenced — a clear, single-glance progress summary, not a dense analytics page (that's Phase 10).

### Definition of Done
- Opening a course as a Student shows one coherent view: calendar with real dates and topics, a progress KPI block, and (per delivery mode) either the video player or the attendance history — all real data, nothing mocked.
- The Trainer's equivalent view for the same course, for a given student, shows consistent numbers — no drift between the two sides' calculations, since both hit the same rollup endpoint.

---

## Phase 6 — Core Academic Backbone: Colleges, Cohorts, Teams, College Admin Backend

**Goal:** With the priority-role course/attendance stack real, extend real backend to College Admin (the third priority portal) and the shared structures (`colleges`, `cohorts`, `teams`) the remaining roles and Citadel depend on. This is the original architecture doc's Phase 2, resumed now that the higher-priority course-specific work is done.

### Backend

- `colleges`, `cohorts` collections exactly as specced in the architecture doc (§5.2) — institutional partner records, cohort phase tracking (Activation/Bootcamp/Citadel).
- `teams` collection (§5.2) — needed here as a shared structure even though full Citadel logic is Phase 7, since Trainer's existing "teams connection" UI and College Admin's faculty/student views reference team membership.
- Retrofit `collegeId` scoping (already present as a field per `memory.txt`'s Phase 1 notes) so it's actually enforced end-to-end: a Trainer/College Admin's queries for students, courses, and sessions are filtered by their `collegeId` via the existing `scopeToCollege` middleware, not just carrying the field unused.
- **Endpoints**: standard CRUD for colleges/cohorts (Forge Admin-managed) + `teams` (College Admin/Trainer-managed) + College Admin-scoped versions of the student roster, faculty overview, and enrollment queries already stubbed in the Phase D mock dashboard.

### Frontend

- **College Admin** (`/college`): convert the existing mock-data dashboard (stat cards, programs, faculty, placement chart, host-event form) to real data, scoped to that admin's own college.
- **Trainer**: "Teams connection" (already flagged as existing but pointing at mock data) becomes real.

### Definition of Done
- A College Admin sees only their own college's real students/faculty/courses, correctly scoped — verify by seeding two colleges and confirming no cross-college data leaks.

---

## Phase 7 — Citadel Engine: Sprints, Problem Statements, Investor Unlock

**Goal:** Build the real backend for the Citadel subsystem — currently the Student dashboard's Citadel hub/Sprint Cycles/Problem Statement pages exist and look right, but run on mock data. This phase makes them real, including the automated 3-sprint investor-unlock rule.

### Backend

Exactly per the architecture doc §5.3 and the binding doc's schema additions:
- `problemStatements` (with `deliverables[]`), `sprints` (with `tasks[]`), `milestoneSubmissions`, `investorAccessGrants`, `interestExpressions`, `bookmarks`.
- The **state machine job**: a BullMQ worker triggered on any sprint reaching `status: complete`, checking whether all 3 cycles for that team are now complete, and if so writing `investorAccessGrants` and firing notifications (notifications collection itself is Phase 8 — for now, a console/log stand-in is acceptable, disclose it as such).
- Endpoints for listing/filtering problem statements, expressing interest, bookmarking, viewing/submitting sprint milestones — per the binding doc's §6–§7 detail.

### Frontend

- Swap Student's Citadel hub, Sprint Cycles, and Problem Statement pages from mock to real data — these pages already exist and match the visual designs, so this should be close to a pure data-layer swap.
- Build the previously-deferred **Progress Report** and **Feedback** pages (flagged as deferred in Phase B) now that there's real `milestoneSubmissions` data to show.
- Mentor's team/sprint review UI similarly swapped to real data.

### Definition of Done
- A team completing its 3rd sprint automatically produces an `investorAccessGrants` record with no manual step, verified via the job actually running against real data, not just unit logic.

---

## Phase 8 — Score Engine, Certifications, Bookings & Notifications

**Goal:** The async, event-sourced scoring system from the original architecture (§9), QR certificate issuance, real bookings (replacing the mock "Mentor Sessions" data on both Student and Mentor sides), and a real notifications collection feeding every "bell icon" and "Recent Notifications" panel currently on mock arrays.

### Backend

- `scoreEvents` (append-only) + the BullMQ worker recomputing `builderScore` per the architecture doc's formula (Events 20% / Project 40% / Mentor 30% / Team 10%) — plus, per the earlier locked decision, a **separate, non-scoring** rollup for `currentStreak`/`xp` on `studentProfiles`, since those are cosmetic-only and must never feed `builderScore`.
- Certificate issuance flow exactly per architecture §8: signed token generation, QR code, PDF (stored in MinIO/S3), and the public unauthenticated, rate-limited `GET /verify/:token`.
- `bookings` collection (with `agenda[]`, `note`, `meetingLink` per the binding doc) — replaces the mock data behind Student's "Mentor Sessions" and Mentor's "Sessions" pages on both sides.
- `notifications` collection — real writes on the events that already exist elsewhere in the system (new booking, session cancelled, assignment graded, milestone reviewed, investor access granted, etc.), plus the read/unread endpoints already assumed by the existing (currently mock) notification bell UI.

### Frontend

- Swap Student/Mentor "Mentor Sessions"/"Sessions" pages to real `bookings` data — the UI already exists, this is a data-layer swap plus wiring the "Schedule Session" form (already built against mock state in Mentor's Phase C work) to a real `POST /bookings`.
- Swap every notification bell/panel across all roles to real `notifications` data.
- Student "Certifications" page (currently unbuilt/mock per wireframes) becomes real: list of earned certificates, QR thumbnail, download/verify links.

### Definition of Done
- Completing a milestone, having a session cancelled, or crossing a scoring threshold produces a real notification the affected user actually sees.
- A certificate, once issued, is verifiable at its public link with no login.

---

## Phase 9 — Talent Pool Search & Remaining Cross-Role Backend Operations

**Goal:** Bring the remaining 8 non-priority roles' backends up to the same "real, not mock" bar, in the order the original architecture's Phase 5 implied — HR's Talent Pool first since it's the most structurally distinct (search/pagination), then the rest.

### Backend

- HR Talent Pool: real search against `studentProfiles` (skills/domain/score filtering) — plain Mongo queries locally are fine per the migration doc, Atlas Search is a Phase 10/cloud-migration concern, not a local one.
- Sponsor: real `bookings`-based "book a meet" (reuses Phase 8's collection).
- Community Leader: real event hosting (reuses `events`/`eventRegistrations`, which should be introduced here if not already present from Citadel's featured-event usage).
- Media Partner: real access-request/approval flow.
- Members: real feed/event registration.
- Speaker: real session/resource data.

### Frontend

Each of the 9 roles' single consolidated Phase D dashboard pages get their mock-data hooks swapped for real ones — same pattern as every prior phase, minimal UI rewrite expected since these pages were explicitly built to already look and behave correctly against mock data.

### Definition of Done

Every one of the 12 roles now runs on real data end to end, with no `mockData.ts` files left serving production dashboard content anywhere in the app.

---

## Phase 10 — Analytics, Testing, Placement/Internship Stub, Scale & Cloud Migration

**Goal:** Close the loop on the full student-journey vision (onboarding → learning → assignments → assessments → performance → certification → placement), add the test coverage that's been explicitly flagged as a gap since Phase 1, and execute the local-to-cloud migration per the existing migration doc.

### Backend

- **Analytics rollups**: cross-cutting dashboards (per role, and a Forge Admin national view) built on top of everything above — course completion rates, attendance trends, score distributions, Citadel funnel (problem statement interest → team formed → sprints completed → investor access). Build these as read-model aggregation endpoints, cached where the architecture doc's indexing principles call for it (anything summing across many documents on every page load).
- **Placement/internship tracking — schema stub only, not a full workflow**: introduce a minimal `placements` collection (`studentId`, `companyId` ref `hrProfiles`, `status: applied|interviewing|offered|placed`, `role`, `date`) so the data model has a real home for this part of the journey, without building the full HR-facing workflow UI in this pass — that's a future scope decision, flagged here rather than silently built or silently dropped.
- **Automated tests**: the gap flagged since Phase 1. At minimum: auth flow, enrollment/payment-stub flow, attendance marking, the Citadel 3-sprint unlock job, and the score-recompute job — these are the pieces where a silent regression would be worst.

### Frontend

- Per-role and cross-role analytics views (reuse `SimpleLineChart`/`StatCard`/etc. — this is a data problem, not a new-component problem).

### Cloud migration

Execute exactly what `docs/forge-loom-local-to-cloud-migration.md` already specifies: MongoDB Atlas cluster, Atlas Search index for the Talent Pool (upgrading Phase 9's plain-Mongo search), managed Redis, S3/DigitalOcean Spaces replacing local MinIO, real Razorpay swapped into Phase 2's stubbed `processPayment` function, and the pre-launch checklist at the end of that document.

### Definition of Done
- The pre-launch checklist in the migration doc is fully checked off.
- The app runs identically against Atlas/managed Redis/real S3 as it did locally, with no code changes beyond environment variables — confirming the env-var discipline held throughout every prior phase.

---

## Appendix — Full role list after this roadmap (12 total)

student · mentor · trainer · speaker · hr · sponsor · college_admin · community_leader · media_partner · member · forge_admin · **course_admin** (new, Phase 1)

## Appendix — New/updated collections introduced by this roadmap, in the order they appear

`CourseAdminProfile` (P1) → `courses` updated (P1) → `enrollments` (P2) → `courseSessions` (P3) → `attendanceRecords` built (P3) → `videoProgress` (P4) → `assessments` (P5) → `colleges`/`cohorts`/`teams` (P6) → `problemStatements`/`sprints`/`milestoneSubmissions`/`investorAccessGrants`/`interestExpressions`/`bookmarks` (P7) → `scoreEvents`/`certificateRecords`/`bookings`/`notifications` (P8) → `events`/`eventRegistrations` if not already present (P9) → `placements` (P10, stub only)

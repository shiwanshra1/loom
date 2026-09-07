> **SUPERSEDED — 2026-09-01.** This document describes a MongoDB→Firebase/Firestore
> migration plan that was cancelled before any code was written. Forge Loom's
> persistence layer is instead migrating from MongoDB to PostgreSQL via Prisma.
> See `docs/postgres-database-design.md` and `docs/prisma-migration-tickets.md`.

# Forge Loom — Firestore Database Design

Companion to `docs/superpowers/specs/2026-08-29-firebase-migration-design.md` (the approved architecture decisions) and `memory.txt` (the 10-phase build history). That doc set the direction — Express stays, Firestore replaces MongoDB, Firebase Auth replaces custom JWT — but stopped short of a collection-by-collection schema. This document is that schema, derived from the **actual current Mongoose models** in `apps/server/src/models/*.ts` (34 files, verified against the code on 2026-09-01), not from the original architecture doc's higher-level tables, which have drifted from what got built across 10 phases.

Every collection below has a **direct existing-code source** — nothing here is speculative except where explicitly marked "NEW" or "CHANGE".

---

## 1. Design principles for the Mongo → Firestore port

1. **No joins.** Every place the current code relies on an implicit join (e.g. reading a `Course` and separately resolving its `trainerId` to a `User`) becomes two explicit reads or a denormalized field. Firestore has no `.populate()`.
2. **Compound-unique Mongo indexes become deterministic document IDs.** Where Mongoose enforces `{fieldA, fieldB}` uniqueness via a compound index, Firestore enforces the same thing by making the document ID `${fieldA}_${fieldB}` — a write to an existing ID overwrites rather than duplicates, and a `create`-semantics helper must check-then-write or use `create()` (which fails on existing doc) instead of `set()`.
3. **The `users` identity key changes from a Mongo `ObjectId` to a Firebase Auth `uid`.** This is the single biggest migration risk (see §7) — every one of the ~25 fields across other collections that currently stores a Mongo `User` `ObjectId` (e.g. `Enrollment.studentId`, `Team.mentorId`, `Notification.userId`) must be remapped to the corresponding Firebase Auth `uid` during the one-time migration script, not just type-relabeled.
4. **Bounded embedded arrays stay embedded; unbounded ones become subcollections.** Firestore documents cap at 1MiB and arrays you frequently append to create hot-document write contention. Each embedded array below is evaluated individually — most stay embedded, one (`CommunityLeaderProfile.members[]`) is flagged for conversion.
5. **Firestore is server-only in this architecture.** Per the locked-in decision, the client only ever talks to Firebase Auth directly; all Firestore reads/writes go through the Express server via the Admin SDK, which bypasses Security Rules entirely. So Firestore Security Rules should be **default-deny for all client SDK access** (§8) — they exist as a defense-in-depth backstop, not as the access-control layer (Express's `authenticate`/`authorize`/`scopeToCollege` middleware remains that layer, unchanged in shape).
6. **Timestamps.** Mongoose's `{timestamps: true}` (`createdAt`/`updatedAt`) is not automatic in Firestore — every write path that currently relies on Mongoose auto-stamping must explicitly set `Timestamp.now()` (create) or update `updatedAt` (update) in the repository layer. Seven collections already only track a manual `createdAt` in Mongo (append-only style) and need no `updatedAt` equivalent: `accessRequests`, `bookmarks`, `communityPosts`, `eventRegistrations`, `interestExpressions`, `notifications`, `scoreEvents`.

---

## 2. Collection catalog

Field types: Firestore native types are used directly — `string`, `number`, `boolean`, `Timestamp`, `array`, `map`. A `ref<Collection>` notation means "a string holding the target document's ID" (Firestore has a native `DocumentReference` type too, but this codebase's repositories are simpler to reason about — and to unit-test — treating refs as plain ID strings resolved manually, matching how the Mongoose layer already treats `ObjectId` refs as opaque IDs rather than leaning on `.populate()` almost anywhere).

### 2.1 Identity & Profiles

#### `users/{uid}` — *(was `User`, keyed by Mongo `_id`; now keyed by Firebase Auth `uid`)*
| Field | Type | Notes |
|---|---|---|
| `email` | string | Mirrors Firebase Auth's own record; kept here too since every other collection's queries need it without a second Auth Admin API call |
| `role` | string (enum) | `student\|mentor\|trainer\|speaker\|hr\|sponsor\|college_admin\|community_leader\|media_partner\|member\|forge_admin\|course_admin` |
| `status` | string (enum) | `active\|pending_verification\|suspended` |
| `collegeId` | ref\<colleges\> \| null | |
| `mfaEnabled` | boolean | default `false` |
| `lastLoginAt` | Timestamp \| null | |
| `createdAt` / `updatedAt` | Timestamp | |
| ~~`passwordHash`~~ | — | **removed** — Firebase Auth owns credentials |
| ~~`refreshTokenVersion`~~ | — | **removed** — Firebase Auth owns token lifecycle, no server-side rotation bookkeeping needed |

**Indexes:** single-field on `role` (already automatic in Firestore for equality; only needed as composite if combined with a range/orderBy — see §5). Email uniqueness is enforced by Firebase Auth itself, not by Firestore.

#### `studentProfiles/{uid}` *(was `StudentProfile`, deterministic ID = the student's own `uid`, replacing the old `userId` unique-index pattern)*
`collegeId: ref<colleges>|null`, `name: string`, `course: string|null`, `mentorId: ref<mentorProfiles>|null`, `builderScore: number` (default 0), `skills: array<string>`, `domain: string|null`, `linkedIn: string|null`, `currentStreak: number`, `xp: number`, `streakHistory: array<boolean>`, `createdAt`/`updatedAt`.

**Indexes:** composite `(collegeId, domain, builderScore desc)` — this is the Talent Pool query and the single most important composite index in the whole schema (see §5).

#### `mentorProfiles/{uid}`, `trainerProfiles/{uid}`, `speakerProfiles/{uid}`, `hrProfiles/{uid}`, `sponsorProfiles/{uid}`, `collegeProfiles/{uid}`, `communityLeaderProfiles/{uid}`, `mediaPartnerProfiles/{uid}`, `memberProfiles/{uid}`, `courseAdminProfiles/{uid}`
All 10 follow the same pattern as `studentProfiles`: doc ID = the profile owner's `uid` (this **replaces** every current `userId, unique` index — in Firestore the ID itself is the uniqueness constraint, so there is nothing extra to enforce). Field lists are unchanged 1:1 from the corresponding Mongoose model (see the ground-truth extraction in this doc's companion audit) except that every `ref<User>` array (`MentorProfile.assignedStudents`, `TrainerProfile.assignedTeams`, `SpeakerProfile.pastSessions`, `CommunityLeaderProfile.volunteerNetwork`) becomes `array<string>` of the referenced doc's ID.

**`communityLeaderProfiles.members[]` — CHANGE, not a mechanical port.** Mongo embeds `members: {userId, role}[]` directly on the profile document. A community leader's member roster has no natural cap (could reach hundreds), and every invite is an array-append to one shared document — a write-contention hotspot Mongo doesn't have (MongoDB's `$push` is a targeted array op; Firestore's array-union still requires reading/rewriting the whole document under the hood for anything beyond simple `arrayUnion`, and a 1MiB doc cap exists). **Recommendation: convert to a subcollection** `communityLeaderProfiles/{uid}/members/{memberUid}` with fields `{role, addedAt}`. This is a genuine schema change from Mongo — disclosed here, not silently ported — and needs its own migration-script logic (§7) to fan out the embedded array into subdocuments.

---

### 2.2 Courses, Enrollment, Sessions

#### `colleges/{id}` *(was `College`)*
`name: string`, `location: string|null`, `partnerTier: string` (enum `bronze|silver|gold`, default `bronze`), `createdAt`/`updatedAt`.

#### `courses/{id}` *(was `Course`)*
`title`, `description: string|null`, `createdBy: ref<courseAdminProfiles>`, `deliveryMode: 'online'|'offline'`, `durationHours: number`, `durationDays: number`, `price: number`, `currency: string` (default `INR`), `status: 'draft'|'published'|'archived'`, `trainerId: ref<users>|null`, `createdAt`/`updatedAt`.
`syllabus: array<map>` — **stays embedded** (bounded: one entry per course day, realistically under ~100): `{dayNumber: number, title: string, description: string|null, youtubeVideoId: string|null}`.

**Indexes:** composite `(status, createdAt desc)` — the published-catalog listing query.

#### `courseSessions/{courseId}_{dayNumber}` *(was `CourseSession`; deterministic ID replaces the unique compound index on `(courseId, dayNumber)`)*
`courseId: ref<courses>`, `dayNumber: number`, `scheduledDate: Timestamp`, `mode: 'offline'|'live_online'|'self_paced'`, `status: 'scheduled'|'completed'|'cancelled'`, `cancelReason: string|null`, `trainerId: ref<users>|null`, `createdAt`/`updatedAt`.

#### `enrollments/{id}` *(was `Enrollment`)*
`studentId: ref<users>`, `courseId: ref<courses>`, `status: 'pending_payment'|'active'|'completed'|'refunded'`, `razorpayOrderId: string|null`, `paymentRef: string|null`, `paymentAmount: number`, `enrolledAt: Timestamp`, `completedAt: Timestamp|null`, `createdAt`/`updatedAt`.

**Indexes:** composite `(studentId, createdAt desc)` — `GET /enrollments/mine`.

#### `attendanceRecords/{sessionId}_{studentId}` *(was `AttendanceRecord`; deterministic ID replaces the unique compound index)*
`sessionId: ref<courseSessions>`, `studentId: ref<users>`, `status: 'present'|'absent'|'excused'`, `markedAt: Timestamp`, `markedBy: ref<users>`, `createdAt`/`updatedAt`.

**Indexes:** composite `(studentId, markedAt desc)` — a student's own attendance history.

#### `videoProgress/{studentId}_{courseId}_{dayNumber}` *(was `VideoProgress`; deterministic ID replaces the unique compound index)*
`studentId: ref<users>`, `courseId: ref<courses>`, `dayNumber: number`, `lastPositionSeconds: number`, `durationSeconds: number`, `percentWatched: number` (0–100), `completed: boolean`, `createdAt`/`updatedAt`.

#### `assessments/{id}` *(was `Assessment`)*
`courseId: ref<courses>`, `title`, `type: 'quiz'|'exam'|'assignment'`, `scheduledDate: Timestamp`, `createdAt`/`updatedAt`.

#### `certificates/{enrollmentId}` *(was `Certificate`; deterministic ID replaces the unique index on `enrollmentId` — one certificate per enrollment is now structurally impossible to violate)*
`studentId: ref<users>`, `courseId: ref<courses>`, `enrollmentId: ref<enrollments>` *(redundant with the doc ID itself, kept for symmetry with the Mongo shape and because it's read back client-facing)*, `courseTitle: string` (denormalized snapshot, unchanged from Mongo), `issuingBody: string`, `token: string` (still the source of truth for the public verify lookup — see below), `pdfKey: string` (Firebase Storage object path, replacing the MinIO/S3 key), `issuedAt: Timestamp`, `createdAt`/`updatedAt`.

**The public `GET /certificates/verify/:token` endpoint cannot use the doc ID for its lookup** (the doc ID is `enrollmentId`, the public token is a separate random value) — it needs a query `where('token', '==', token)`, which requires `token` to stay a plain indexed field (Firestore auto-indexes single fields for equality, so no extra composite index is needed here).

---

### 2.3 Citadel (Cohorts, Teams, Problem Statements, Sprints)

#### `cohorts/{id}` *(was `Cohort`)*
`collegeId: ref<colleges>`, `name`, `startDate: Timestamp`, `endDate: Timestamp`, `phase: 'activation'|'bootcamp'|'citadel'`, `createdAt`/`updatedAt`.

#### `teams/{id}` *(was `Team`)*
`name`, `collegeId: ref<colleges>`, `memberStudentIds: array<string>` (refs `users`), `mentorId: ref<users>|null`, `trainerId: ref<users>|null`, `problemStatementId: ref<problemStatements>|null`, `createdAt`/`updatedAt`.
> Note carried over from the Mongo audit: the current Mongoose schema declares `problemStatementId` *without* a `ref` option (every other FK-shaped field does declare one) — a minor existing inconsistency, irrelevant in Firestore since there's no schema-level `ref` mechanism to omit, but worth knowing it's not a deliberate Mongo design choice to preserve.

#### `problemStatements/{id}` *(was `ProblemStatement`)*
`title`, `description`, `overview: string|null`, `source: 'industry'|'government'|'internal'`, `domain`, `tags: array<string>`, `teamSize: number`, `durationWeeks: number`, `difficulty: 'easy'|'medium'|'hard'`, `status: 'open'|'closed'`, `featured: boolean`, `postedBy: ref<users>|null`, `createdAt`/`updatedAt`.
`deliverables: array<map>` — **stays embedded** (bounded, small, a handful of checklist items): `{title: string, done: boolean}`.

**Indexes:** single-field `status` (equality only — fine as auto-index unless combined with an orderBy, which the current `GET /problem-statements` list doesn't do).

#### `sprints/{teamId}_{cycleNumber}` *(was `Sprint`; deterministic ID replaces the unique compound index on `(teamId, cycleNumber)`)*
`teamId: ref<teams>`, `cycleNumber: number`, `status: 'not_started'|'in_progress'|'submitted'|'reviewed'|'complete'`, `startDate: Timestamp`, `endDate: Timestamp`, `progressPercent: number`, `createdAt`/`updatedAt`.
`tasks: array<map>` — **stays embedded** (bounded per sprint cycle): `{title: string, status: 'pending'|'in_progress'|'completed', dueDate: Timestamp}`.

#### `milestoneSubmissions/{id}` *(was `MilestoneSubmission` — versioned/append-only, auto ID, never overwritten)*
`sprintId: ref<sprints>`, `teamId: ref<teams>`, `artifactUrls: array<string>`, `demoDate: Timestamp|null`, `createdAt`/`updatedAt`.
`mentorFeedback: array<map>` — **stays embedded** (bounded, one entry per feedback round on one submission): `{mentorId: ref<users>, comment: string, rating: number|null, createdAt: Timestamp}`.

**Indexes:** composite `(sprintId, createdAt desc)` — submission history for a sprint.

#### `investorAccessGrants/{teamId}` *(was `InvestorAccessGrant`; deterministic ID = `teamId` replaces the unique index on `teamId`, and doubles as a natural existence-check for "has this team already been granted access" without a query)*
`grantedAt: Timestamp`, `reason: string`, `createdAt`/`updatedAt`.

#### `bookmarks/{userId}_{problemStatementId}`, `interestExpressions/{userId}_{problemStatementId}` *(deterministic IDs replace both unique compound indexes)*
Each: `userId: ref<users>`, `problemStatementId: ref<problemStatements>`, `createdAt` (no `updatedAt` — append-only in Mongo today, same in Firestore).

---

### 2.4 Scoring

#### `scoreEvents/{id}` *(was `ScoreEvent` — append-only, auto ID, no HTTP route today but actively written by `sprint.service.ts`/`scoreEvent.service.ts` and consumed by the score-recompute worker)*
`studentId: ref<users>`, `category: 'events'|'project'|'mentor'|'team'`, `points: number` (signed), `reason: string`, `sourceRef: string|null`, `createdAt` (no `updatedAt`).

**Indexes:** composite `(studentId, category)` — the recompute worker's own read pattern (sum/average per category per student).

> `events` and `team` categories are real infrastructure with genuinely zero events today (per the existing disclosed design) — carries over unchanged into Firestore; nothing about the migration itself feeds them.

---

### 2.5 Certificates, Bookings, Notifications *(certificates covered in §2.2 alongside Course/Enrollment)*

#### `bookings/{id}` *(was `Booking`)*
`requesterId: ref<users>`, `mentorId: ref<users>` *(field name kept from Mongo for continuity even though Phase 9 generalized its meaning to "the other party" — renaming it would touch every call site for a cosmetic gain)*, `title`, `scheduledAt: Timestamp`, `durationMinutes: number` (default 30), `mode: string` (default `'Google Meet'`), `status: 'upcoming'|'completed'|'cancelled'`, `agenda: array<string>`, `note: string|null`, `meetingLink: string|null`, `createdAt`/`updatedAt`.

**Indexes:** composite `(requesterId, scheduledAt desc)` and composite `(mentorId, scheduledAt desc)` — both directions of `GET /bookings/mine`'s `$or` query. Firestore has no native `$or` across two different fields in one query the way Mongo does — `listMyBookings` becomes **two queries merged in the service layer** (one per field), not a single Firestore query. Flagged explicitly as a service-layer logic change, not just a schema mapping (see the corresponding ticket in the tickets doc).

#### `notifications/{id}` *(was `Notification` — append-only, no `updatedAt`)*
`userId: ref<users>`, `type: 'booking_created'|'booking_cancelled'|'milestone_reviewed'|'investor_access_granted'|'session_cancelled'|'certificate_issued'`, `title`, `body: string|null`, `read: boolean` (default `false`), `createdAt`.

**Indexes:** composite `(userId, createdAt desc)` — the bell dropdown's own list query.

---

### 2.6 Community, Events, Talent Pool

#### `communityPosts/{id}` *(was `CommunityPost` — append-only, no `updatedAt`)*
`authorId: ref<users>`, `content: string`, `createdAt`.

**Indexes:** single-field `createdAt desc` (Firestore auto-indexes for a single-field orderBy).

#### `events/{id}` *(was `Event`)*
`title`, `description: string|null`, `type: 'hackathon'|'seminar'|'workshop'|'other'`, `hostedBy: ref<users>`, `collegeId: ref<colleges>|null`, `venue: string|null`, `scheduledAt: Timestamp`, `agenda: array<string>`, `featured: boolean`, `createdAt`/`updatedAt`.

#### `eventRegistrations/{eventId}_{userId}` *(deterministic ID replaces the unique compound index)*
`eventId: ref<events>`, `userId: ref<users>`, `registeredAt: Timestamp` (no `updatedAt`).

#### `accessRequests/{requesterId}_{eventId}` *(deterministic ID replaces the unique compound index)*
`requesterId: ref<users>`, `eventId: ref<events>`, `status: 'pending'|'approved'|'denied'`, `requestedAt: Timestamp`, `decidedAt: Timestamp|null` (no `updatedAt`).

#### `speakerTopics/{id}` *(was `SpeakerTopic`)*
`speakerId: ref<users>`, `title`, `description: string|null`, `status: 'proposed'|'booked'`, `scheduledAt: Timestamp|null`, `venue: string|null`, `createdAt`/`updatedAt`.

#### Talent Pool — no dedicated collection
Unchanged in Firestore: `GET /talent-pool` queries `studentProfiles` directly (see §2.1's composite index). The one real behavior change is **pagination** — Mongo's opaque base64 `{score, id}` cursor is replaced by Firestore's native `startAfter(lastDocSnapshot)` cursor, which needs the query's own last-returned `DocumentSnapshot` (or the field values it sorted on) threaded through the API's cursor token instead of a hand-rolled encoding.

---

### 2.7 Admin / Analytics / Placement

No dedicated Admin collection today (Mongo aggregates across `User`/`StudentProfile`/`Enrollment`/`Cohort`/`College` on the fly) — same approach carries over, see §6 for what changes about *how* those aggregates are computed.

#### `placements/{id}` *(was `Placement` — schema-only stub, zero current reads/writes, zero routes)*
`studentId: ref<users>`, `companyId: ref<hrProfiles>`, `status: 'applied'|'interviewing'|'offered'|'placed'`, `role: string`, `date: Timestamp`, `createdAt`/`updatedAt`.

**Recommendation:** carry the collection definition forward for schema completeness (a future phase will need it), but **do not build a migration path for it** in the one-time data-migration script — there is no Mongo data to migrate (the collection has never been written to), so migrating it would just be creating an empty Firestore collection, which happens automatically on first real write anyway.

---

## 3. Firebase Storage layout (replaces MinIO/S3)

Current: MinIO bucket `forgeloom-dev`, one object per certificate PDF, key referenced by `Certificate.pdfKey`.

Firebase Storage equivalent: bucket `loom-8fa90.firebasestorage.app` (already named in the migration design doc), path convention `certificates/{studentId}/{enrollmentId}.pdf` — deterministic and human-auditable, mirroring the deterministic-ID philosophy used throughout the Firestore schema. Presigned download URLs come from `getSignedUrl()` on the Admin SDK's `Storage` module, replacing `@aws-sdk/s3-request-presigner`.

---

## 4. Firestore Security Rules posture

Per §1.5: the client SDK never touches Firestore or Storage directly in this architecture — it only uses `firebase/auth` for sign-in and ID-token retrieval; every Firestore/Storage read and write goes through the Express server via the Admin SDK (which ignores Security Rules). Recommended `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Same default-deny posture for `storage.rules`. This isn't a stub to fill in later — it's the intended end state, since Express+Admin-SDK is deliberately the only writer per the locked-in architecture decision. If a future phase ever adds direct client Firestore/Storage access, that phase must design real rules at that time; don't pre-build unused rule complexity now.

---

## 5. Composite indexes required (`firestore.indexes.json`)

| Collection | Fields | Query it serves |
|---|---|---|
| `studentProfiles` | `collegeId` ASC, `domain` ASC, `builderScore` DESC | Talent Pool search/pagination |
| `courses` | `status` ASC, `createdAt` DESC | Published catalog listing |
| `enrollments` | `studentId` ASC, `createdAt` DESC | `GET /enrollments/mine` |
| `attendanceRecords` | `studentId` ASC, `markedAt` DESC | Student attendance history |
| `milestoneSubmissions` | `sprintId` ASC, `createdAt` DESC | Submission history for a sprint |
| `bookings` | `requesterId` ASC, `scheduledAt` DESC | `GET /bookings/mine` (requester side) |
| `bookings` | `mentorId` ASC, `scheduledAt` DESC | `GET /bookings/mine` (other-party side) |
| `notifications` | `userId` ASC, `createdAt` DESC | Notification bell dropdown |
| `scoreEvents` | `studentId` ASC, `category` ASC | Score-recompute worker's per-category read |

Everything else in the schema is served by single-field equality/orderBy, which Firestore indexes automatically — no explicit entry needed.

---

## 6. Aggregation/analytics — the one open behavioral gap

Already disclosed in the migration design doc, restated here with the concrete current queries it affects (`apps/server/src/modules/admin/`):

- `GET /admin/national-stats`'s `totalColleges`/`totalStudents`/`venturesLaunched` are pure counts → Firestore's `count()` aggregation query is a direct, efficient replacement.
- `GET /admin/analytics`'s **builderScore 5-bucket distribution** and **7-day attendance-rate trend** have no Firestore aggregation-pipeline equivalent (no `$bucket`/`$group` analog). These must read the relevant documents (`studentProfiles` for the distribution; `attendanceRecords` filtered to the last 7 days for the trend) into the server and bucket them in code. At current target scale (5k–50k users total, not 50k students-with-attendance-per-day) this is a full-collection-scan-adjacent read, not a per-request table scan of the whole database, so it's acceptable — but it's a genuine cost/latency regression from Mongo's server-side aggregation, worth re-checking if the user base grows well past the original target.

---

## 7. Migration-script risk: the identity-key remapping

This is the highest-risk mechanical step in the entire migration, worth its own section:

1. Every Mongo `User._id` becomes a **new, different** Firebase Auth `uid` once `admin.auth().createUser()` runs for that account (Firebase does not let you choose an arbitrary UID matching an existing Mongo ObjectId in the general case — it can, via `uid:` param on `createUser`, but only if that exact string has never been used as a UID before, which is true here since this is a fresh Firebase project, so **this is actually usable**: pass the existing Mongo `_id.toString()` as the `uid` param to preserve every foreign key across the whole dataset without a remapping table at all).
2. **Recommendation:** explicitly pass `uid: mongoUser._id.toString()` to every `createUser()` call in the migration script. This turns "remap ~25 foreign-key fields across 20+ collections" into "no-op — the IDs are already identical," collapsing the single biggest migration risk into a one-line decision, provided it's made *before* any accounts are created in the Firebase project (retrofitting it after other phases have already created users with auto-generated UIDs would reintroduce the remapping problem for whichever accounts came first).
3. If that approach is ever rejected (e.g. a future requirement disallows attacker-predictable/sequential-looking UIDs), the fallback is a remapping table (`Map<mongoObjectId, firebaseUid>`) built during user migration and consulted for every subsequent collection's FK fields — strictly more work, kept here only as a documented fallback, not the recommended path.

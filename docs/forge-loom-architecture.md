# Forge Loom — System Architecture
### The Execution Backbone for the FORGE Program (Winnovation)

Stack: **PostgreSQL + Express + React + Node.js, all in TypeScript (PERN)**
Target scale: **5,000 – 50,000 concurrent users**
Model: **One codebase, role-based dashboards** (single React app, single Express API)

---

## 1. Design Principles

1. **One identity system, many experiences.** Every stakeholder logs into the same app, but the moment auth resolves, the app renders a completely different dashboard shell for their role. Role is a first-class field on the user record, not a bolt-on permission flag.
2. **Write-heavy ≠ read-heavy.** Attendance, sprint activity, and feedback are logged constantly (write-heavy, append-style). The Talent Pool search (HR filtering by skill/score/domain) is read-heavy and needs to stay fast even at 50k profiles. These get different data and indexing treatment — never make the write path also do expensive read work.
3. **The Score Engine is computed, not typed in.** No one manually sets a student's score. It's derived from four weighted inputs (Events 20%, Project 40%, Mentor 30%, Team 10%) and recalculated asynchronously whenever an input changes — never synchronously inside a request/response cycle.
4. **Citadel is a state machine bolted onto Student/Mentor data, not a separate app.** Sprint cycle progression, the 3-sprint investor-unlock milestone, and demo-day gating are modeled explicitly as states + transitions so the frontend never has to infer status from scattered fields.
5. **Everything traceable, nothing synchronous that doesn't need to be.** Certificate generation, notification fan-out, report exports, and score recomputation all go through a job queue. The API's job is to accept the request fast and confirm — not to do the heavy lifting inline.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Fast dev loop, works cleanly with Bolt |
| Routing | React Router v6, role-guarded routes | One app, role-based layout shells |
| State/data fetching | TanStack Query (React Query) | Caching, background refetch — important at scale so dashboards don't hammer the API |
| UI | Tailwind + a component library (shadcn/ui or similar) | Speed of build, consistent design tokens across 11 role dashboards |
| Backend | Node.js + Express + TypeScript | Matches your stack choice, huge ecosystem, easy to scale horizontally |
| Database | PostgreSQL via Prisma (strict, generated TS types from a single `schema.prisma`) | Real relational integrity (FKs, unique/compound constraints enforced by the DB, not just the app layer), mature managed-hosting ecosystem |
| Cache / Session store / Queue broker | Redis | Session caching, rate limiting, BullMQ backing store |
| Job Queue | BullMQ | Score recalculation, certificate generation, notification fan-out, report exports |
| Search (Talent Pool, course search) | Postgres full-text search (`tsvector`/`pg_trgm`) at current scale; graduate to Elasticsearch/Meilisearch only if query volume genuinely demands it | Faceted filtering by skill/domain/score without hammering primary DB, no extra infra needed until scale actually requires it |
| File/Media storage | S3-compatible object storage (AWS S3 / Cloudflare R2) | Resumes, resource uploads, certificate PDFs, event media |
| Auth | JWT (short-lived access token + rotating refresh token), bcrypt/argon2 for passwords | Stateless auth scales horizontally without sticky sessions |
| Real-time (notifications, live sprint boards) | Socket.IO with Redis adapter | Needed once you're running multiple Node instances behind a load balancer |
| Deployment | Containerized (Docker), horizontally scaled behind a load balancer (e.g. on Render/Railway/AWS ECS) | Required to actually hit 50k concurrent users |

---

## 3. High-Level Architecture

```
                        ┌───────────────────────────┐
                        │        Client (SPA)      │
                        │  React + TS, role shells │
                        └──────────────┬────────────┘
                                     │ HTTPS / WSS
                        ┌──────────────┼────────────┐
                        │     Load Balancer / CDN    │
                        └──────────────┬────────────┘
                                     │
                ┌──────────────────────┼─────────────────────┐
                │                    │                    │
        ┌────────┼───────┐    ┌────────┼────────┐   ┌────────┼────────┐
        │  API Node #1  │    │  API Node #2    │   │  API Node #N    │
        │ Express + TS  │    │ Express + TS    │   │ Express + TS    │
        │ (stateless)   │    │ (stateless)     │   │ (stateless)     │
        └────────┬────────┘    └────────┬────────┘   └────────┬────────┘
                │                     │                    │
     ┌──────────┬┼──────────────────────┼─────────────────────┼───────────┐
     │          │                     │                    │           │
┌─────┼─────┐ ┌───┼─────┐        ┌────────┼───────┐     ┌────────┼───────┐  ┌───┼───────┐
│Postgres │ │ Redis  │        │ BullMQ Workers│     │ Postgres FTS /│  │  S3    │
│ (managed│ │(cache, │        │ (score calc,  │     │ Elasticsearch │  │(files, │
│ read    │ │session,│        │ certs, notifs,│     │ (talent pool, │  │ certs, │
│replicas)│ │ pub/sub│        │ report export)│     │ course search)│  │resumes)│
└─────────┘ └────────┘        └───────────────┘     └───────────────┘  └────────┘
```

**Why this shape scales to 50k users:**
- API layer is stateless — add more Node instances behind the load balancer with zero code change.
- Postgres read replicas absorb the read-heavy dashboard/profile traffic; writes go to primary.
- Redis takes session lookups and rate-limit counters off Postgres entirely.
- Search is offloaded from Postgres's primary query engine so HR's "filter 50,000 builder profiles by skill+score+domain" doesn't compete with attendance writes.
- Anything slow (PDF certs, bulk notification sends, CSV roster imports) is a background job — the user gets an instant "processing" response, not a hung request.

---

## 4. Authentication & Role-Based Access

### 4.1 Identity model
One `users` table holds core identity (email, password hash, role, status, MFA flag). Each role then has its **own profile table**, one-to-one with `users` via `userId`, with role-specific fields. This avoids a single bloated "God table" with 40 nullable columns, and keeps each role's queries fast and focused — and unlike a document store, Postgres enforces the one-to-one relationship itself via a unique FK, not just app-level convention.

```
users
 ├─ _id
 ├─ email (unique, indexed)
 ├─ passwordHash
 ├─ role: enum [student, mentor, trainer, speaker, hr, sponsor,
 │          college_admin, community_leader, media_partner, member, forge_admin]
 ├─ status: enum [active, pending_verification, suspended]
 ├─ collegeId (ref, for college-scoped roles)
 ├─ createdAt / lastLoginAt
 └─ refreshTokenVersion (int, incremented to invalidate all sessions on logout-all/breach)
```

### 4.2 Token strategy
- **Access token**: JWT, 15 min expiry, contains `userId`, `role`, `collegeId` — this is what makes role-based route rendering instant on the frontend without a DB hit per request.
- **Refresh token**: httpOnly secure cookie, 7–30 day expiry, rotated on every use, stored hashed in Redis keyed by `userId` + `refreshTokenVersion` so a single compromised token or a password reset can invalidate all sessions instantly.
- No server-side session table for access tokens — this is what lets you scale API nodes horizontally without sticky sessions.

### 4.3 Authorization
- Express middleware chain: `authenticate` (verifies JWT) → `authorize(...allowedRoles)` (checks role) → `scopeToCollege` (for college-scoped roles like College Admin, Trainer, Mentor — ensures a mentor at College A can never query College B's students).
- Every table that holds role-scoped data carries a `collegeId` (or `cohortId`) column, and it is **always** part of the query filter for non-admin roles — enforced at the middleware/repository layer, not left to individual route handlers to remember.
- Forge Admin (Winnovation internal) is a superuser role that bypasses college scoping — needed for national-level reporting across the whole network.

---

## 5. Core Data Model (PostgreSQL Tables via Prisma)

This is deliberately split into **profile data** (slow-changing, read-heavy) and **activity data** (fast-changing, write-heavy, often time-series-shaped). For the full, current, field-by-field Prisma schema (all 34+ tables, every relation/index/constraint), see `docs/postgres-database-design.md` — the tables below are the original high-level design intent this system was planned around.

### 5.1 Identity & Profiles
| Table | Key columns | Notes |
|---|---|---|
| `users` | email, passwordHash, role, collegeId (FK), status | Auth root |
| `student_profiles` | userId (FK, unique), name, college, course, mentorId (FK), builderScore, skills (array), domain, linkedIn | `(collegeId, domain, builderScore)` composite index for Talent Pool search |
| `mentor_profiles` | userId (FK, unique), expertise (array), bio | |
| `trainer_profiles` | userId (FK, unique), expertise (array) | |
| `speaker_profiles` | userId (FK, unique), topics (array), bio | |
| `hr_profiles` | userId (FK, unique), companyName, industry, companyDetails | |
| `sponsor_profiles` | userId (FK, unique), orgName, sponsorshipTier | |
| `college_profiles` | userId (FK, unique), collegeName, accreditationInfo | One per institutional partner |
| `community_leader_profiles` | userId (FK, unique), orgName | |
| `media_partner_profiles` | userId (FK, unique), outlet, accessLevel | |
| `member_profiles` | userId (FK, unique), interests (array) | Lightweight — feed/events only |

### 5.2 Program & Academic Structure
| Table | Key columns | Notes |
|---|---|---|
| `colleges` | name, location, partnerTier | |
| `cohorts` | collegeId (FK), startDate, endDate, phase (activation/bootcamp/citadel) | Drives which tabs/features are active for a student |
| `courses` | title, durationHours/Days, trainerId (FK) | Enrollment is its own table (`enrollments`), not an array column, so it scales past the row-size limits an embedded list would hit |
| `teams` | name, collegeId (FK), mentorId (FK), trainerId (FK), problemStatementId (FK) | Citadel + course-level teams; membership lives in a join table (`team_members`), not an array column |

### 5.3 Citadel (Sprint Execution Engine)
| Table | Key columns | Notes |
|---|---|---|
| `problem_statements` | title, source (industry/gov), domain, difficulty, postedBy (FK) | HR/Industry-posted |
| `sprints` | teamId (FK), cycleNumber (1–3+), status enum, startDate, endDate | See state machine in §7 |
| `milestone_submissions` | sprintId (FK), teamId (FK), artifactUrls (array), demoDate | Versioned — keep submission history, don't overwrite; feedback lives in a child table (`milestone_feedback`) |
| `investor_access_grants` | teamId (FK, unique), grantedAt, reason ("3 sprint cycles complete") | Created automatically when the Citadel state machine hits the unlock condition |

### 5.4 Activity / Time-Series (write-heavy — see §6 for indexing)
| Table | Key columns | Notes |
|---|---|---|
| `attendance_records` | studentId (FK), sessionId (FK), markedAt, status | High volume — composite index on `(studentId, markedAt)` |
| `score_events` | studentId (FK), category (event/project/mentor/team), points, sourceRef, createdAt | Append-only log; `builderScore` on the profile is a derived, cached rollup |
| `milestone_feedback` | milestoneSubmissionId (FK), mentorId (FK), rating, comment | |
| `notifications` | userId (FK), type, body, read (bool), createdAt | No TTL/auto-expire mechanism in Postgres the way Mongo has TTL indexes — a periodic cleanup job (or partition-by-month + drop-old-partitions) is the equivalent if the table grows large enough to need pruning |

### 5.5 Certifications
| Table | Key columns | Notes |
|---|---|---|
| `certificates` | studentId (FK), courseId (FK), enrollmentId (FK, unique), token (unique), pdfKey, issuedAt | `token` is a cryptographically random, unguessable value — verification endpoint is public and rate-limited |

### 5.6 Events & Engagement
| Table | Key columns | Notes |
|---|---|---|
| `events` | title, type (hackathon/seminar/workshop), hostedBy (FK), collegeId (FK), scheduledAt | |
| `event_registrations` | eventId (FK), userId (FK) | Composite PK `(eventId, userId)` enforces one registration per user per event at the DB level |
| `bookings` | requesterId (FK), mentorId (FK, "other party"), scheduledAt, status | "Book a Meet" / "Book a Session" flows |

---

## 6. Indexing & Search Strategy

This is the part that most LMS builds get wrong and pay for later at scale — so it's worth being explicit:

1. **Composite indexes on every scoped query.** e.g. `student_profiles`: index on `(collegeId, domain, builderScore)` so HR/mentors filtering within scope stay fast. `attendance_records`: index on `(studentId, markedAt)`. Postgres composite indexes are declared directly in `schema.prisma` via `@@index`/`@@unique` — see `docs/postgres-database-design.md` §5 for the full list.
2. **Talent Pool search is a plain indexed query at current scale, with a documented upgrade path.** HR's "filter by skill + domain + score range, full-text search bio" runs directly against the `(collegeId, domain, builderScore)` index today. Once free-text search over `skills`/`bio` genuinely needs to be fast at high volume, add Postgres native full-text search (`tsvector` columns + a GIN index, or `pg_trgm` for fuzzy skill matching) before reaching for a separate search cluster — only graduate to Elasticsearch/Meilisearch if query volume outgrows what Postgres FTS can do in-process.
3. **Append-only tables (`score_events`, `attendance_records`, `notifications`) should never be queried for aggregate values in the request path.** The `builderScore` column on `student_profiles` is a cached rollup, recomputed by a BullMQ worker whenever a new `score_event` lands. Reading a profile is always O(1) — you never sum a log table live during a page load.
4. **No TTL indexes in Postgres** (that's a MongoDB-specific feature) — if `notifications` ever grows large enough to need pruning, the equivalent is a scheduled cleanup job (`DELETE ... WHERE read = true AND createdAt < now() - interval`) or table partitioning by month with old partitions dropped. Short-lived tokens still live in Redis, not Postgres, keeping hot tables small regardless.
5. **Pagination everywhere, cursor-based not offset-based**, for any list that can grow past a few hundred items (student rosters, event lists, notification feeds) — offset pagination (`skip/limit`, or Prisma's `skip`/`take`) degrades badly past page ~50 at this scale; prefer a `WHERE id > :cursor ORDER BY id LIMIT :n` keyset pattern instead.

---

## 7. Citadel State Machine

```
 [Activation Phase] → [Bootcamp Selection] → [Bootcamp Week] → [Citadel Entry]
                                                                       │
                                                                       ▼
                                                         ┌───────────────────────┐
                                                         │   Sprint Cycle 1     │
                                                         │ build→demo→feedback  │
                                                         └──────────┬───────────┘
                                                                    ▼
                                                         ┌───────────────────────┐
                                                         │   Sprint Cycle 2     │
                                                         └──────────┬───────────┘
                                                                    ▼
                                                         ┌───────────────────────┐
                                                         │   Sprint Cycle 3     │
                                                         └──────────┬───────────┘
                                                                    ▼
                                                    ┌────────────────────────────────┐
                                                    │  investorAccessGrants created  │
                                                    │  → Demo Day → Investor Access  │
                                                    └────────────────────────────────┘
```
Each `sprints` row has a `status` enum: `not_started → in_progress → submitted → reviewed → complete`. A BullMQ job listens for `sprint.complete` events; once a team's 3rd sprint hits `complete`, it automatically writes an `investor_access_grants` row and fires notifications to the team, mentor, and relevant industry/investor accounts. This is exactly why the milestone note ("once all 3 sprint cycles are completed... investors will start arriving") becomes a system-enforced rule instead of someone manually deciding when to notify investors.

---

## 8. Certification & QR Verification Flow

1. Trainer/College creates a `certificationCourse` (name, duration, issuing body) — either manually or via CSV bulk upload of a student roster.
2. On issuance, a BullMQ job generates: a signed unique token → a public verification URL (`forgeloom.app/verify/:token`) → a QR code encoding that URL → a PDF certificate (stored in S3).
3. The public verify endpoint is **unauthenticated but rate-limited**, and returns only non-sensitive confirmation data (name, course, issue date, validity) — never the student's full profile.
4. `certificates` rows are immutable once issued; revocation (if ever needed) is a status flag, not a delete, to preserve audit history.

---

## 9. Score Engine (Async, Event-Sourced)

- Every scoring input (attendance marked, project milestone reviewed, mentor rating submitted, team contribution logged) writes a `scoreEvent` — never updates the score directly.
- A BullMQ worker recomputes `builderScore = 0.2×events + 0.4×project + 0.3×mentor + 0.1×team` whenever a relevant event lands, and caches the result on `studentProfiles.builderScore`.
- This gives you a full audit trail (why does this student have this score? — replay the events) while keeping every read of a profile instant.

---

## 10. Role → Dashboard Mapping (for the frontend route guard)

| Role | Landing dashboard | Key modules |
|---|---|---|
| Student | `/student` | Dashboard, Citadel, Mentor Assigned, Assignments, Certifications |
| Mentor | `/mentor` | Assigned Students, Course Cards, Scheduling, Feedback |
| Trainer | `/trainer` | Assigned Students, Teams, Assignments, Tests, Attendance |
| Speaker | `/speaker` | Sessions, Agenda, Resources, Feedback |
| HR | `/hr` | Post Opportunity, Talent Search, Builder Profile Viewer, Enroll |
| Sponsor | `/sponsor` | Upcoming Events, Book a Meet |
| College Admin | `/college` | Programs, Enrollment, Faculty, Placement Stats, Reports |
| Community Leader | `/community` | Host Event, Invite Members, Assign Volunteers |
| Media Partner | `/media` | Event/Calendar Access Requests, History |
| Member | `/member` | Feed, Events, Calendar |
| Forge Admin | `/admin` | Cross-college reporting, user management, national dashboards |

---

## 11. Suggested Folder Structure

```
forge-loom/
├── apps/
│   ├── client/                # React + TS SPA
│   │   ├── src/
│   │   │   ├── roles/         # one folder per role dashboard shell
│   │   │   ├── components/    # shared UI
│   │   │   ├── hooks/
│   │   │   ├── api/           # React Query hooks per resource
│   │   │   └── routes/
│   └── server/                # Express + TS API
│       ├── prisma/            # schema.prisma + generated migrations
│       ├── src/
│       │   ├── modules/       # auth, students, citadel, hr, certifications, ...
│       │   ├── middleware/    # authenticate, authorize, scopeToCollege
│       │   ├── jobs/          # BullMQ workers (score, certs, notifications)
│       │   └── config/        # prisma client singleton, env, redis, s3
├── packages/
│   └── shared-types/          # shared TS types/interfaces (User, Role enums, DTOs)
└── infra/                     # Docker, deployment configs
```

---

## 12. Build Roadmap (Phased)

1. **Phase 1 — Foundation**: Auth (JWT+RBAC), user/profile models for all 11 roles, base routing shells.
2. **Phase 2 — Core Academic**: Colleges, cohorts, courses, teams, attendance, basic dashboards for Student/Mentor/Trainer.
3. **Phase 3 — Citadel**: Problem statements, sprint state machine, milestone submissions, investor-access automation.
4. **Phase 4 — Score Engine + Certifications**: Event-sourced scoring, QR certificate issuance/verification.
5. **Phase 5 — Talent Pool + HR/Sponsor/College dashboards**: Search indexing, filtering, booking flows, reporting exports.
6. **Phase 6 — Scale hardening**: Load testing to 50k concurrent, caching tune-up, queue monitoring, read-replica routing.

---

*This document is meant to be a living spec — as the Citadel/Certification/scoring rules get more detailed, update §7–9 accordingly before implementation.*

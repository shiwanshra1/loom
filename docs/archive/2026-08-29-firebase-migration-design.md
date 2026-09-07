> **SUPERSEDED — 2026-09-01.** This document describes a MongoDB→Firebase/Firestore
> migration plan that was cancelled before any code was written. Forge Loom's
> persistence layer is instead migrating from MongoDB to PostgreSQL via Prisma.
> See `docs/postgres-database-design.md` and `docs/prisma-migration-tickets.md`.

# Forge Loom — MongoDB → Firebase Migration Design

## Context

Forge Loom's backend (10 phases, per `docs/milestone-1.md` and `memory.txt`) is currently: Express + MongoDB/Mongoose (~20 collections), custom JWT auth with Redis-backed rotating refresh tokens, BullMQ+Redis for two background workers (Citadel investor-unlock, score recomputation), MinIO/S3 for certificate PDFs, and real Razorpay payments. The user wants the backend moved "totally to Firebase," explicitly including login/logout.

## Decisions locked in (via user Q&A)

1. **Keep the Express server.** Not a full serverless rewrite. Only the data layer, auth layer, and file storage are replaced — the ~10 phases of business logic (score formula, Citadel state machine, attendance rules, enrollment/payment flow, etc.) are re-plumbed onto new backends, not re-derived.
2. **Database:** MongoDB/Mongoose → **Firestore**, accessed server-side via the `firebase-admin` SDK.
3. **Auth:** Custom JWT + Redis refresh tokens → **Firebase Authentication** (Email/Password provider). Client SDK (`firebase/auth`) handles sign-in/sign-out and token refresh in the browser; Express verifies the Firebase ID token server-side via Admin SDK on every request.
4. **Background jobs:** BullMQ + Redis **stay as-is**. Redis's role narrows to pure job-queue duty now that refresh tokens no longer live there.
5. **File storage:** MinIO/S3 → **Firebase Storage**, via `firebase-admin`'s storage module. MinIO removed from `docker-compose.yml`.
6. **Existing dev data:** A one-time **migration script** moves current local MongoDB data (accounts, courses, enrollments, sprints, etc.) into Firestore, preserving IDs/relationships rather than reseeding from scratch.
7. **Firebase project:** `loom-8fa90` (already exists; user provided the client `firebaseConfig`).

## Architecture after migration

**Client (`apps/client`):** Adds `firebase/auth`, initialized with the provided `firebaseConfig`. `AuthContext` is rewritten around `onAuthStateChanged` / `signInWithEmailAndPassword` / `signOut` / `getIdToken()`, replacing the current in-memory-access-token + httpOnly-refresh-cookie flow. `apiClient.ts`'s request wrapper attaches the live Firebase ID token as a Bearer header instead of managing its own refresh-and-retry logic (the Firebase SDK auto-refreshes ID tokens client-side, so the custom 401-retry interceptor goes away).

**Server (`apps/server`):** Initializes `firebase-admin` from a service account credential (env-var-driven path, never committed — same discipline as `.env.local` for Razorpay). New `authenticate` middleware verifies the Bearer ID token via `admin.auth().verifyIdToken()`, replacing the current JWT-verify + Redis-lookup logic. All `/auth/refresh` and `/auth/logout`-token-revocation plumbing is deleted — Firebase Auth owns that lifecycle now. Registration still creates a **profile document** per role (unchanged concept), but the underlying `User` identity record moves to `admin.auth().createUser()` plus a small Firestore `users/{uid}` doc for app-specific fields (role, collegeId, status) that Firebase Auth itself doesn't store.

**Data layer:** Each Mongoose model becomes a Firestore collection plus a thin repository module exposing the same-shaped functions the service layer already calls (`findById`, `create`, `updateStatus`, etc.), so the service/controller layers built across all 10 phases need minimal rework — only the persistence call sites change, not the business rules.

- **Compound uniqueness** (e.g. attendance's `(sessionId, studentId)`, sessions' `(courseId, dayNumber)`) is enforced via **deterministic document IDs** (`${sessionId}_${studentId}`) instead of Mongo compound unique indexes.
- **Cursor pagination** (Talent Pool) moves to Firestore's native `startAfter()` cursor, replacing the current base64 `{score, id}` cursor encoding.
- **Analytics aggregations** (Phase 10 admin dashboard): count-based stats use Firestore's `count()` aggregation query; the builderScore distribution buckets and the 7-day attendance trend don't have a direct Firestore aggregation-pipeline equivalent and will be computed by reading the relevant documents into the server and bucketing in code. This is a genuine behavior/scale difference from Mongo's aggregation pipeline, disclosed here rather than glossed over — acceptable at current data volumes, worth revisiting if the user base grows far beyond the original 5k–50k target.

**Storage:** Certificate PDFs upload to the `loom-8fa90.firebasestorage.app` bucket via `firebase-admin`'s storage module; presigned-URL issuance uses Storage's signed-URL API in place of the S3 presigner.

**Local dev:** The Firebase **Local Emulator Suite** (Firestore + Auth + Storage emulators) replaces the Mongo container in `infra/docker-compose.yml`. Redis stays (BullMQ). The Phase 10 `vitest`/`supertest` suite is repointed at the emulator instead of the real `forgeloom_test` Mongo database, keeping the same "never touches real data" guarantee the current test setup has.

## What's still needed from the user before real (non-emulator) testing can happen

- A **service account JSON key** for the Admin SDK (Firebase Console → Project Settings → Service Accounts → "Generate new private key"). This can't be generated by an agent — it requires the user's own console access. Deps/scaffolding/emulator-based work can proceed without it; live Firestore/Auth/Storage calls against the real cloud project need it.
- Confirmation that **Firestore (Native mode)** and **Authentication → Email/Password** are enabled in the console (one-click if not).

## Phased execution plan

Mirroring how `milestone-1.md` was executed — one phase at a time, checkpoint + local commit after each, push to `origin/main` only on explicit request:

1. **Foundation** — `firebase-admin` + `firebase` client deps, Admin SDK init, Firestore/Auth/Storage emulators wired into `docker-compose.yml`, env var scaffolding (`.env.example` updated, secrets never committed).
2. **Auth cutover** — Firebase Authentication end-to-end: register/login/logout/`me`, role+collegeId living in a `users/{uid}` Firestore doc, `authenticate` middleware rewritten, old JWT/Redis-refresh code removed.
3. **Core data migration** — Users/Profiles, Colleges/Cohorts/Teams, Courses/Enrollments/Sessions/Attendance/VideoProgress moved to Firestore repositories.
4. **Citadel + Score Engine + Certifications + Bookings + Notifications** moved to Firestore (+ Firebase Storage for certs).
5. **Talent Pool, Events/Community/Speaker/Sponsor/Media/HR modules** moved to Firestore, including the cursor-pagination rework.
6. **Admin analytics + automated tests** repointed at Firestore/the emulator.
7. **One-time Mongo → Firestore data migration script**, cutover, cleanup (remove `mongoose`/MongoDB deps, MinIO, update `docs/`).

Each phase gets the same verification rigor as the original build: typecheck/lint/build clean, and a live end-to-end exercise of the affected flows against the emulator (or real project, once the service account key is available).

## Open risk, disclosed upfront

This touches essentially every module built across all 10 original phases. It is the largest single change made to this codebase to date. Executing it phase-by-phase with checkpoints (as above) is meant to keep that risk contained and reviewable rather than one giant unreviewable diff.

# Forge Loom — Wireframe & Screen Specification
### Companion to `forge-loom-architecture.md` — hand both to the coding agent together

This document describes every screen as **regions, components, data bindings, and actions** rather than pixels. It's written so a coding agent can build the actual layout (in Tailwind/shadcn, per the architecture doc's stack) without needing an image to copy — the structure is unambiguous, the visual styling is the agent's/your call.

---

## 0. Global Shell (applies to every role)

All 11 roles share one layout frame. Only the sidebar nav items and the content region change per role.

```
┌─────────────────────────────────────────────┐
│ Topbar: [Logo] [Role label]      [Notif][Avatar] │
├───────────┬──────────────────────────────────┤
│ Sidebar   │ Content region                     │
│ (nav      │ (role-specific — see sections      │
│  items    │  1–11 below)                       │
│  per role)│                                     │
│           │                                     │
└───────────┴──────────────────────────────────┘
```

- **Topbar**: logo, current role label (a Forge Admin or College Admin may have a role/cohort switcher here), a notification bell (badge count from `notifications` collection, unread only), avatar/profile menu (Profile, Settings, Log out).
- **Sidebar**: vertical nav list, one item per module for that role (see below). Active item highlighted. Route path pattern: `/{role}/{module}`.
- **Content region**: renders the active module. Every module listed below should be its own route + component, not a single monolithic dashboard page.
- **Responsive rule**: sidebar collapses to a hamburger-triggered drawer under 768px width; content region becomes single-column.

---

## 1. Student Dashboard (`/student`)

**Sidebar items**: Dashboard, Citadel, Mentor, Assignments, Certifications, Notifications

### 1.1 Dashboard (landing view)
- **Personal details header**: name, photo, college, course — read from `studentProfiles`, edit action opens a profile-edit modal.
- **Stat cards row** (3–4 cards): Builder score (from `studentProfiles.builderScore`), active course count, attendance %, upcoming session count. Each card: label + large number, no chart needed here.
- **Courses list**: card per enrolled course — name, trainer, progress bar. Click → course detail view (modules, materials, progress).
- **Trackers**: a compact progress view across active trackers (course completion, sprint milestones) — list rows with a progress bar each.
- **Upcoming events / calendar**: list of next 3–5 events (from `events` + `eventRegistrations`), each row: title, date, "Add to calendar" action.
- **Last events**: recently completed events, read-only history list.
- **Mentor assigned**: card with mentor name, photo, LinkedIn link, "Book a session" button (opens booking flow against `bookings`).

### 1.2 Citadel tab
- **Sprint cycle tracker**: horizontal stepper, 3 steps (Sprint 1/2/3), current step highlighted, status per step (not started / in progress / submitted / reviewed / complete) — bound to `sprints.status`.
- **Problem statement panel**: title, domain, difficulty, source org — from `problemStatements` linked via `teams.problemStatementId`.
- **Progress report**: text/log view of milestone submission history for the current sprint (`milestoneSubmissions`), newest first.
- **Upcoming mentor sessions**: list, same shape as dashboard's upcoming events but scoped to Citadel/mentor bookings.
- **Comments/feedback**: threaded feedback list under each milestone submission (`milestoneSubmissions.mentorFeedback[]`).
- **Milestone banner**: a persistent banner element that only renders once `investorAccessGrants` exists for the student's team — "Investor access unlocked" state.
- **Notification strip**: Citadel-specific notifications (review scheduled, feedback received).

### 1.3 Assignments
- **Assignment list**: table/list — assignment name, course, due date, status (not submitted / submitted / graded).
- **Upload assignment**: file upload action per row, uploads to S3, writes a reference to the assignment record.
- **Marks view**: once graded, shows score + trainer comment.
- **Test after module**: same list pattern for trainer-set tests, customizable per trainer.
- **Attendance**: read-only calendar/list view of the student's own attendance records.

### 1.4 Certifications
- List of earned certificates: course name, issue date, a QR code thumbnail, "Download PDF" and "View public verification page" actions.

---

## 2. Mentor Dashboard (`/mentor`)

**Sidebar items**: Assigned Students, Course Cards, Schedule, Feedback, Reports

- **Assigned students list**: table — name, course, current score, last activity date. Row click → student profile detail (read-only view of that student's dashboard data, scoped by `scopeToCollege`/assignment).
- **Student profile detail (drill-in)**: progress bar per course, calendar of upcoming sessions with that student, feedback history.
- **Course cards**: grid of cards per course the mentor is attached to — progress summary, calendar, upcoming session.
- **Schedule a session**: form — student/team picker, date/time, topic. Writes to `bookings`.
- **Teams assigned**: list of Citadel teams under this mentor, each row links into that team's sprint/milestone view (same shape as Student's Citadel tab, but editable — mentor can leave feedback and mark milestones reviewed).
- **Feedback**: form to submit feedback tied to a session or milestone.
- **Announcements**: post/broadcast panel to assigned students.
- **Reports**: exportable summary (CSV/PDF) of assigned students' attendance and scores over a date range.

---

## 3. Trainer Dashboard (`/trainer`)

Same shape as Mentor (Assigned Students, Student Profiles, Course Cards, Attendance, Announcements, Book a Session), **plus**:
- **Assignment management**: create assignment (name, description, due date, attach files), view submissions, grade with a marks input + comment field.
- **Test after module**: builder for creating a test tied to a course module — question list, pass threshold. Customizable per trainer, per the source material.
- **Teams connection**: link to Teams/Citadel view if the trainer is also assigned to a Citadel team.

---

## 4. Speaker Dashboard (`/speaker`)

**Sidebar items**: Sessions, Resources, Feedback, Notices

- **Sessions list**: upcoming/past sessions — title, date, venue/agenda detail (expand row for full agenda).
- **Upload resource**: file upload attached to a session (slides, reading material) — S3.
- **Feedback**: view feedback received per session; "Personalized feedback" — a free-text panel for feedback on individual attendees.
- **Booked sessions**: calendar view of sessions booked by colleges/HR.
- **Post topics**: form to propose new session topics for colleges to book.
- **Connect HR**: a directory/contact list of HR accounts, "Request intro" action.

---

## 5. HR Dashboard (`/hr`)

**Sidebar items**: Dashboard, Talent Pool, Post Opportunity, Company Profile, History

- **Company profile**: company name, industry, description, history — editable form (`hrProfiles`).
- **Dashboard**: upcoming events/sessions HR is registered for, "Enroll" action for new events.
- **Post opportunity**: form — role/problem statement description, domain filter tags, evaluation criteria. Writes to `problemStatements` or a jobs-specific collection.
- **Talent pool (the important one — build this screen with pagination + search from day one)**:
  - Search bar (full text, hits the Atlas Search index, not a raw Mongo query).
  - Filter row: domain dropdown, skill multi-select, score range slider.
  - Result list: cards or rows — name, domain/skills tags, score, "View profile" action.
  - Result count + cursor-based pagination ("Load more", not numbered pages, once lists exceed ~50 items).
  - **View profile (drill-in)**: full Builder Profile — projects, scores, mentor feedback, execution history. "Shortlist" and "Send message" actions.

---

## 6. Sponsor Dashboard (`/sponsor`)

**Sidebar items**: Upcoming Events, Colleges, History

- **Upcoming events list**: events across partner colleges, filterable by college.
- **Colleges directory**: list of partner colleges with summary stats (student count, active cohort phase).
- **Book a meet**: form — college/contact picker, proposed time slots. Writes to `bookings`.

---

## 7. College (Institutional Admin) Dashboard (`/college`)

**Sidebar items**: Programs, Students, Faculty, Reports, Events

- **All programs / active courses**: list/table of programs and courses running at this college.
- **Students enrolled**: table with search/filter, links into individual student profiles (read-only, admin view).
- **Faculty overview**: table of mentors/trainers at this college, workload summary.
- **Placement stats**: summary cards + a simple bar chart (placements by domain/cohort).
- **Student reports / Faculty reports**: exportable report generation panel — date range picker, format (PDF/CSV), "Generate" action → async job → download link when ready.
- **Calendar / host an event**: shared calendar view + "Host event" form (type, date, venue).
- **Forge team portfolio / Trainer portfolio**: read-only directory view of the embedded Forge team and trainers assigned to this campus.
- **Request reports**: a request queue for ad-hoc report types not covered by the standard exports.

---

## 8. Community Leader / Partner Dashboard (`/community`)

**Sidebar items**: Host Event, Members, Notifications, Feed

- **Host an event**: form with an event-type selector (Hackathon / Seminar / Workshop / Other), details, venue.
- **Add community members**: invite flow (email/link invite), assign roles within the community (Lead / Volunteer / Public).
- **Feed**: simple chronological post feed for community updates.

---

## 9. Media Partner Dashboard (`/media`)

**Sidebar items**: Events, Calendar, History

- **Events**: list of events with a "Request access" action (creates a pending request record, notifies the hosting college/community leader for approval).
- **Calendar**: same request-access pattern applied to calendar visibility.
- **History**: past access requests and their approval status.

---

## 10. Members Dashboard (`/member`)

**Sidebar items**: Feed, Events, Calendar

Lightweight by design — this is the broadest, lowest-privilege role:
- **Feed**: chronological updates.
- **Events**: browsable list with a "Register" action (simple form).
- **Calendar**: personal calendar of registered events.

---

## 11. Forge Admin Dashboard (`/admin`)

Not in the original source material by name, but required by the architecture doc's superuser role — needed for cross-college oversight:
- **Cross-college reporting**: aggregate stats across all colleges/cohorts.
- **User management**: search/filter all users, change role/status, force-logout (bump `refreshTokenVersion`).
- **Cohort/phase management**: move a cohort from Activation → Bootcamp → Citadel phase.
- **National dashboards**: the metrics referenced in the Founder/Industry materials — ventures per cohort, employability lift, etc.

---

## 12. Certifications Flow (cross-cutting, not a single role's tab)

This isn't a dashboard — it's a flow triggered from College/Trainer screens and consumed publicly:

1. **Create/select course**: name, purpose, duration, issuing body.
2. **Add roster**: manual entry or CSV upload (name + course + duration columns at minimum).
3. **Issue**: triggers the background job described in the architecture doc — generates signed token, QR code, PDF.
4. **Public verification page** (`/verify/:token`, no login required): shows name, course, issue date, validity status only. Rate-limited, no other profile data exposed.

---

## Notes for the coding agent

- Build the **Global Shell** once as a layout component; every role dashboard is a set of routes rendered inside it — don't duplicate the sidebar/topbar per role.
- Every list/table screen described above (Talent Pool, Students Enrolled, Assigned Students, Events) should use cursor-based pagination and a loading/empty state from the start, not just the happy path — several of these will hold thousands of rows in production.
- Modules marked with a drill-in ("row click → detail view") should be separate routes (`/hr/talent-pool/:studentId`), not modals, so they're linkable and bookmarkable.
- Treat this document as the acceptance criteria for "does this screen have what it needs" — it is not a visual design spec. Visual styling, spacing, and component choice are open for you/the agent to decide within the frontend-design conventions already in your stack.

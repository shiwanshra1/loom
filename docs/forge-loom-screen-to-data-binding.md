# Forge Loom — Screen-to-Data Binding Spec
### Maps the existing visual designs to `forge-loom-architecture.md`'s data model
### Hand this + the architecture doc + the visual designs to the coding agent together — this is the file that tells it how to wire the pretty screens up

The visuals already exist. What's below is not a redesign — it's the contract between each screen and the backend: which collection each number/list comes from, which endpoint each button calls, and what the loading/empty/paginated states should be. Field names match the Mongoose collections in the architecture doc so the agent can wire directly against them.

---

## 0. Reconciled navigation (canonical)

**Student sidebar**: Home · Courses · Calendar · Tracker · Citadel · Mentor · Achievements · Communities · Opportunities · Resources · Settings

**Citadel is a section, not a separate app** — within it: Sprint Cycles, Problem Statement, Mentor Sessions, Progress Report, Feedback. This matches the "Citadel-first" screens you generated (those are effectively this section rendered as if it were the whole nav).

**Mentor sidebar**: Dashboard · Students · Teams · Sessions · Courses · Assignments · Reports · Notifications

The "Mentor Overview" screen with My Mentees / Upcoming Session (the version with the mountain illustration and quote) is the **Dashboard** landing view of the same role — not a separate role.

---

## 1. Student — Home

| Element on screen | Source | Notes |
|---|---|---|
| "Good morning/Welcome back, {name}" | `studentProfiles.name` (join `users`) | Greeting text keyed off local time of day |
| Stat row: Courses Enrolled, Tasks Completed, Current Streak, XP Earned | `studentProfiles` (enrolledCourses.length), `scoreEvents` (count of category=task, completed), a new `streakDays` field, `scoreEvents` sum for XP | XP/streak aren't in the original architecture doc's schema — add `studentProfiles.currentStreak` and `studentProfiles.xp` as cached rollups, same pattern as `builderScore` |
| My Courses list (progress bars) | `courses` joined through `studentProfiles.enrolledCourses[]`, with `progressPercent` per enrollment | Each row links to `/student/courses/:courseId` |
| Upcoming Events list | `events` + `eventRegistrations` where `userId` = current user, sorted by date ascending, limit 3–5 | "View Calendar" links to `/student/calendar` |
| Mentor Assigned card (photo, rating, social links) | `mentorProfiles` joined via `studentProfiles.mentorId` | Rating is an aggregate — average of `feedbackEntries.rating` where `toUserId` = mentor |
| Citadel promo panel (castle illustration + featured event) | `events` where `type = "citadel_summit"` or similar tag, `featured = true` | This is a static promotional slot, not per-user data — one query for "the current featured event" |

**States**: empty state for "My Courses" if `enrolledCourses` is empty ("Browse courses to get started" + CTA). Stat cards should render `0`/`–` rather than blank while `studentProfiles` is loading, not a skeleton flash on every value independently.

---

## 2. Student — Courses

| Element | Source | Notes |
|---|---|---|
| Tab filters (All / In Progress / Completed / Upcoming / Dropped) | Client-side filter on `enrollmentStatus` field per course enrollment, or server-side query param `?status=` once course counts grow past a page | Start client-side; move to server-side filtering once a student's course list can exceed ~50 |
| Course row (name, level, updated date, progress %) | `courses` + enrollment sub-document | "Updated" = `courses.updatedAt` |
| "+ Enroll in Course" | Opens course catalog, `POST /courses/:id/enroll` | Writes an enrollment sub-document to `studentProfiles`, does **not** create a new course |
| Course Progress Overview donut + stat list | Aggregate of the student's own enrollments — computed client-side from the same list, not a separate query | Avoids a redundant backend call for numbers already in hand |
| Recent Activity list | `scoreEvents` where `userId` = current user, category in (lesson_complete, assignment_submit, quiz_score), sorted desc, limit 5 | This is the same event log that feeds the score engine — reused as an activity feed, not a separate collection |

---

## 3. Student — Calendar

| Element | Source | Notes |
|---|---|---|
| Month grid with dot indicators | `events` + `eventRegistrations` + `bookings` for the visible month range, grouped by day | Query by date range, not by loading all events and filtering client-side — this list grows unbounded over a program's lifetime |
| Upcoming Schedule list (left panel) | Same source, next 4–5 items sorted ascending from now | |
| Day detail panel (selected date's full schedule) | Same source, filtered to the clicked date | Triggered on date click, not pre-fetched for every day |
| "Add to Calendar" | Client-side .ics file generation, or a calendar-provider OAuth integration if you want live sync (defer this — .ics export is enough for v1) | |

---

## 4. Student — Tracker

| Element | Source | Notes |
|---|---|---|
| Overview stats (Tasks Completed, Time Learned, Weekly Goal %, XP Earned) | `scoreEvents` aggregated over the selected date range (the "May 22 – May 28" picker) | This is the one screen where a live aggregation over a date range is genuinely needed — run it as a scheduled/cached rollup per week rather than aggregating raw `scoreEvents` on every page load, once volume is high |
| Weekly Progress line chart | Same `scoreEvents`, bucketed by day | Cache this per user per week (e.g. Redis, 1-hour TTL) — recomputing a 7-day time series on every dashboard load doesn't scale to 50k users |
| Subject Progress list (per-course progress bars) | Same as Courses screen's per-enrollment progress | Reused component/query, not duplicated logic |
| Learning Streak (day dots) | `studentProfiles.currentStreak` + a `streakHistory` array of last 7 boolean/day values | Streak recompute is itself a small async job triggered on any `scoreEvent` write for that day |
| "Detailed Analytics" link | Deep-link into an expanded version of this same data — not a new data source | |

---

## 5. Student — Citadel hub (castle illustration screen)

| Element | Source | Notes |
|---|---|---|
| Sprint Progress Overview (42%, donut) | `sprints` for the student's team — `overallProgress` = weighted average of `cycleNumber` completion | Computed the same way as the individual Sprint Cycle detail below — this is a rollup across all 3 sprints |
| Stat row (Sprints Completed 2/3, Tasks Completed 68%, Days Remaining 24) | `sprints` (count where status=complete), `milestoneSubmissions` (task-level if you track sub-tasks), `sprints.endDate` minus today | If you don't track sub-tasks separately from milestones, "Tasks Completed %" can just mirror the current sprint's task completion (see §6) rather than needing a new field |
| Next Up card (Sprint Cycle 3, "Starts on 14 May") | `sprints` where `status = not_started`, next by `cycleNumber` | "View Details" routes to the Sprint Cycles detail view (§6) |
| Featured event panel (Citadel 2.0) | Same featured-event query as the Home screen (§1) | Reused component |

---

## 6. Student — Citadel — Sprint Cycles

**List view (left panel)**
| Element | Source |
|---|---|
| Tabs (All / Active / Completed / Upcoming) | Filter on `sprints.status` |
| Sprint card (name, phase, dates, status badge, %) | `sprints` for the student's `teamId`, one row per `cycleNumber` |

**Detail view (right panel, selected sprint)**
| Element | Source |
|---|---|
| "Current Sprint" badge + title + phase | `sprints` document fields |
| Stat row: Duration, Progress donut, Tasks Completed (8/14), Team Members | `sprints.startDate/endDate`, `sprints.progressPercent` (cached, recomputed on task/milestone update), count of `teams.members[]` |
| Sprint Tasks list with status + due date | This needs a `sprintTasks` sub-collection or embedded array on `sprints` — **not currently in the architecture doc's schema, add it**: `sprints.tasks: [{ title, status, dueDate }]` |
| Milestone Reminder banner | Static copy, conditionally shown based on `sprints.status = in_progress` and days-remaining threshold | |

**Action**: "View All Tasks" → same data, expanded/unfiltered view, not a new query.

---

## 7. Student — Citadel — Problem Statement

**List view**
| Element | Source |
|---|---|
| Tabs (All / My Problems / Shortlisted / Completed) | `problemStatements` filtered by: all open ones / ones tied to the student's `teamId` / ones the student bookmarked (`bookmarkedBy[]` array) / ones with status=complete |
| Problem card (icon, title, description, domain tag, team size, updated date) | `problemStatements` fields directly |

**Detail view**
| Element | Source |
|---|---|
| Featured badge, icon, title, tags | `problemStatements` fields |
| Problem Overview paragraph | `problemStatements.description` |
| Stat row: Team Size, Expected Duration, Difficulty, Status | `problemStatements` fields |
| Key Deliverables checklist | `problemStatements.deliverables: [{ title, done }]` — **add this array to the schema** |
| "I'm Interested" button | `POST /problem-statements/:id/interest` — writes to a lightweight `interestExpressions` collection (userId, problemStatementId, timestamp), does not auto-assign a team |
| Bookmark icon (top right) | Toggles `problemStatements.bookmarkedBy[]` for this user (or a separate `bookmarks` collection if you'd rather not grow arrays on a shared document — **preferred**, since many students bookmarking the same problem statement would otherwise mean concurrent writes to one array on one document) |

---

## 8. Student — Citadel — Mentor Sessions

This is the **student-side booking view** — distinct from the Mentor role's own session management (§10).

**List view**
| Element | Source |
|---|---|
| Tabs (Upcoming / Past / All Mentors) | `bookings` filtered by `requesterId` = student, status/date; "All Mentors" is a `mentorProfiles` directory view instead |
| Session card (date, title, mentor, time, mode) | `bookings` joined with `mentorProfiles` |

**Detail view**
| Element | Source |
|---|---|
| "Upcoming Session" badge, title, description | `bookings` fields |
| Stat row: date, time, mode, session type | `bookings` fields |
| Mentor card (photo, role, bio, LinkedIn/email icons) | `mentorProfiles` |
| Session Agenda checklist | `bookings.agenda: [string]` — add this field |
| Note box | `bookings.note` (free text, mentor-set) |
| "Reschedule" | Opens the booking form pre-filled, `PATCH /bookings/:id` |
| "Join Session" | Opens `bookings.meetingLink` (Google Meet/Zoom URL) in a new tab |

---

## 9. Student — Events (non-Citadel, e.g. Hackathon Kickoff)

Same shape as the Citadel Mentor Sessions/Problem Statement list+detail pattern, but sourced from the general `events` collection rather than Citadel-specific ones:

| Element | Source |
|---|---|
| Tabs + Filter | `events` filtered by `status` (upcoming/ongoing/completed) and a filter panel (type, date range) |
| Event card | `events` fields |
| Detail panel: What to Expect checklist | `events.agenda: [string]` — add this field, same pattern as the sprint/session agenda arrays above |
| "Register Now" | `POST /events/:id/register` — writes `eventRegistrations` |
| "Share Event" | Client-side share sheet / copy-link, no backend call needed |

---

## 10. Mentor — Dashboard

| Element | Source |
|---|---|
| "Welcome back, {name}" | `mentorProfiles` / `users` |
| Stat row: Students Assigned, Teams Mentoring, Sessions Today, Pending Assignments | `mentorProfiles.assignedStudents.length`, count of `teams` where `mentorId` = self, `bookings` where date=today, count of ungraded submissions assigned to this mentor |
| Today's Sessions list | `bookings` where `mentorId` = self and date = today |
| My Teams (Team Alpha/Beta/Gamma + progress bars) | `teams` where `mentorId` = self, progress = each team's current sprint `progressPercent` |
| Quick Actions (Schedule Session / Book a Room / Create Announcement / Upload Resource) | Each opens its respective form/modal — `POST /bookings`, `POST /announcements`, `POST /resources` |
| Students Requiring Attention (right panel, "2 Overdue" etc.) | Query: students under this mentor with overdue `milestoneSubmissions` or overdue assignments — this is a derived list, worth its own lightweight endpoint (`GET /mentor/at-risk-students`) rather than computing client-side from a full roster |
| Progress Snapshot donut (On Track / At Risk / Not Started) | Aggregate of assigned students' status buckets — same categorization used for the "at risk" list above, cache per mentor, short TTL |
| Recent Notifications | `notifications` where `userId` = self, unread-first |

---

## 11. Mentor — Mentor Overview variant (mountain illustration screen)

This is the same Dashboard route, described in §10 — the "8 Active Mentees / 5 Upcoming Sessions / 12 Sessions Completed / 4.8 Average Rating" version is just an alternate stat-card set. If you want both, treat it as a toggle between "team view" and "mentee view" on the same dashboard rather than two routes — otherwise you'll maintain two dashboards that drift out of sync over time. Average Mentee Rating = mean of `feedbackEntries.rating` where `toUserId` = this mentor.

---

## 12. Schema additions needed (not yet in `forge-loom-architecture.md`)

The visual designs surfaced a few fields the original data model didn't have. Add these before building the corresponding screens:

```
studentProfiles: + currentStreak (number), + xp (number), + streakHistory (array of booleans, last 7 days)
sprints:         + tasks: [{ title, status, dueDate }]
problemStatements: + deliverables: [{ title, done }]
bookings:        + agenda: [string], + note (string), + meetingLink (string)
events:          + agenda: [string], + featured (boolean)
new collection — interestExpressions: { userId, problemStatementId, createdAt }
new collection — bookmarks: { userId, problemStatementId, createdAt }
```

None of these change the architecture's overall shape (identity, scoping, indexing, score engine, Citadel state machine) — they're additive fields discovered by working backward from the actual screens.

---

## 13. What's still open

A few screens reference things the architecture doc deliberately left generic — worth a quick decision before the agent builds them:
- **Achievements / Communities / Resources / Opportunities** nav items appear in the sidebar but weren't detailed in the source planning material or the architecture doc. If you want these built in this pass, they need the same treatment as above (collections + field list) — otherwise stub them as "coming soon" routes for now.
- **XP and streaks** are gamification additions not in the original whiteboard plan — confirm you want them as real scoring inputs or purely cosmetic, since if they ever feed into `builderScore` they need to go through the same event-sourced pattern as everything else in §9 of the architecture doc.

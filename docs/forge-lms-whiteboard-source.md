# Forge LMS — Whiteboard Planning Session (Original Source)
### Transcribed from `Forge_LMS_Student_Tab.pdf` — this is the raw planning material that `forge-loom-architecture.md`, `forge-loom-wireframes.md`, and `forge-loom-screen-to-data-binding.md` were derived from. Treat this as ground truth when those later docs are silent or ambiguous.

---

## Student / College Tab

**Personal Details** — basic student profile information.

**Dashboard**
- Courses (names, etc.)
- Trackers
- Upcoming Events / Calendar
- Last Events
- Mentor Assigned
  - Details
    - LinkedIn
    - Instagram (maybe)
    - Socials

**Ranking / Leaderboards** — student ranking and leaderboard displays.

**Results / Certifications**
- Achievements
- Badges
- Certificates
- Skills
- Projects — linked with GitHub

**Communities** — community access/engagement section.

**Opportunities** — opportunities section (internships, jobs, events, etc.).

**Books**
- Recommended Reading
- Library / E-books
- Reading List / Progress

---

## Citadel Tab

- Sprint Cycle
- Upcoming Mentor Sessions
- Problem Statement
- Progress Report
- Upcoming Events
- Comments / Feedbacks
- Notification
- Mentors Assigned

**Milestone Note**: Once all 3 sprint cycles are completed and the project is ready, investors will start arriving.

---

## Mentor Tab

- Assigned Students
- Student Profiles
- Course Cards
  - Progress
  - Calendar
  - Upcoming Session
- Feedback
- Notification
- Reports
- Schedule a Session
- Teams Assigned
- Announcements
- Book a Session
- Assignment
  - Upload Assignment
  - Marks
  - Test After Module (by Trainer, customizable)
  - Connection with Teams
  - Attendance

---

## Trainer Tab

- Assigned Students
- Student Profiles
- Course Cards
  - Progress
  - Calendar
  - Upcoming Session
- Feedback
- Notification
- Reports
- Schedule a Session
- Teams Assigned
- Announcements
- Book a Session
- Attendance
- Students Enrolled / Enroll Student

---

## Speaker Tab

- Sessions
  - Agenda
    - Venue... Details
  - Upload Resource
  - Feedback
  - Personalized Feedback
  - Notices
  - Booked Sessions
  - Post Topics
  - Connect HR

---

## HR Tab

- Company Name
- Self Detail
- History
- Post Opportunity
  - Description of Hiring (Filter)
    - Search
      - Top Students
        - Click to Open Builder Profiles
    - Send
- Dashboard
  - Upcoming
  - Enroll

---

## Sponsor Tab

- Upcoming Events
  - Colleges
    - Book a Meet

---

## College Tab

- All Programs
- Active Courses
- Students Enrolled
- Faculty Overview
- Placement Stats
- Students Reports
- Faculty Reports
- Calendar Event
- Host an Event
- Forge Team Portfolio
- Trainer Portfolio
- Request Reports

---

## Community Leader / Community Partner Tab

- Host an Event
  - Hackathon
  - Seminar
  - Workshop
  - Similar Event
- Add Community Members (Invite) / Assign
  - Leads
    - Volunteers
    - Public
- Notification
- Feed

---

## Media Partners Tab

- Events
  - Request Access
- Calendar
  - Request Access
- History
- Notification

---

## Members Tab

- Feed
- Events
  - Register via Form
- Notification
- Calendar

---

## Certifications

- Login
  - Existing Courses
  - Add a Course
    - Basic Detail
      - Course Name / Purpose Name
      - Duration
      - Under
      - Upload CSV / Add Details
        - Page
          - Name + Course + Duration
            - QR Code

---

## Reconciliation notes (for whoever builds against this)

- **Ranking/Leaderboards** and **Books** are not present in `forge-loom-architecture.md`'s data model or `forge-loom-screen-to-data-binding.md`'s schema additions (§12) — they need collections/fields designed before their screens can be built. Not blocking for Phase 1 (identity/auth only, no UI).
- This resolves part of the binding doc's §13 open question: "Achievements" = the Results/Certifications group (Achievements, Badges, Certificates, Skills, GitHub-linked Projects), and "Opportunities"/"Communities" are their own standalone sections, not sub-items of something else. "Resources" in the canonical nav (binding doc §0) most likely maps to this Books tab, though that mapping isn't explicit in either source — worth confirming with the user.
- Certifications' "Under" field (in Add a Course → Basic Detail) is ambiguous — likely "issuing body" or "department/program this course falls under," matching `certificationCourses.issuingBody` in the architecture doc, but worth confirming rather than assuming.
- Every other tab (Mentor, Trainer, Speaker, HR, Sponsor, College, Community Leader, Media Partner, Members, Citadel) matches `forge-loom-wireframes.md` structurally — no new information beyond what's already captured there.

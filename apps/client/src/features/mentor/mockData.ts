import type {
  AssignedStudent,
  AtRiskStudent,
  MentorMenteeViewStats,
  MentorSession,
  MentorTeamViewStats,
  NotificationItem,
  ProgressSnapshot,
  StudentProfileDetail,
  TodaySession,
  UpcomingSessionHighlight,
} from './types';

// Mock/placeholder — Phase 2/3 backend (teams, sessions, feedback) doesn't
// exist yet. Swapping to real data later means changing each hook's queryFn.

export const MOCK_TEAM_VIEW_STATS: MentorTeamViewStats = {
  studentsAssigned: 24,
  teamsMentoring: 4,
  sessionsToday: 3,
  pendingAssignments: 12,
};

export const MOCK_MENTEE_VIEW_STATS: MentorMenteeViewStats = {
  activeMentees: 8,
  upcomingSessions: 5,
  sessionsCompleted: 12,
  averageRating: 4.8,
};

export const MOCK_TODAY_SESSIONS: TodaySession[] = [
  {
    id: 'today-1',
    title: 'Frontend Sprint Review',
    team: 'Team Alpha',
    timeLabel: '10:30 AM',
    mode: 'Google Meet',
    startingInLabel: 'In 1h 20m',
  },
  {
    id: 'today-2',
    title: 'Mentor Check-in',
    team: 'Team Beta',
    timeLabel: '2:00 PM',
    mode: 'Google Meet',
    startingInLabel: 'In 4h 50m',
  },
  {
    id: 'today-3',
    title: 'Project Guidance',
    team: 'Team Gamma',
    timeLabel: '4:30 PM',
    mode: 'Google Meet',
    startingInLabel: 'In 7h 20m',
  },
];

export const MOCK_AT_RISK_STUDENTS: AtRiskStudent[] = [
  {
    id: 'risk-1',
    name: 'Rahul Verma',
    team: 'Team Alpha',
    subject: 'UI/UX Design',
    overdueCount: 2,
  },
  {
    id: 'risk-2',
    name: 'Priya Singh',
    team: 'Team Beta',
    subject: 'Frontend Development',
    overdueCount: 1,
  },
  {
    id: 'risk-3',
    name: 'Ankit Patel',
    team: 'Team Gamma',
    subject: 'Backend Development',
    overdueCount: 1,
  },
];

export const MOCK_PROGRESS_SNAPSHOT: ProgressSnapshot = {
  onTrackPercent: 68,
  atRiskPercent: 20,
  notStartedPercent: 12,
};

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'note-1', title: 'New session scheduled with Team Alpha', timeLabel: 'Today, 9:15 AM' },
  { id: 'note-2', title: 'Rahul Verma submitted assignment', timeLabel: 'Today, 8:45 AM' },
  { id: 'note-3', title: 'Project proposal review due in 2 days', timeLabel: 'Yesterday, 6:30 PM' },
];

export const MOCK_UPCOMING_SESSION_HIGHLIGHT: UpcomingSessionHighlight = {
  title: 'Sprint Review & Guidance',
  team: 'Team Alpha',
  dateLabel: '22 May, Wed',
  timeLabel: '10:30 AM – 11:30 AM',
  mode: 'Google Meet',
  startingInLabel: 'In 2 hours',
};

export const MOCK_ASSIGNED_STUDENTS: AssignedStudent[] = [
  {
    id: 'student-rahul',
    name: 'Rahul Verma',
    team: 'Team Alpha',
    course: 'UI/UX Design',
    score: 78,
    lastActivityLabel: '2h ago',
    status: 'at_risk',
  },
  {
    id: 'student-priya',
    name: 'Priya Singh',
    team: 'Team Beta',
    course: 'Frontend Development',
    score: 82,
    lastActivityLabel: '5h ago',
    status: 'at_risk',
  },
  {
    id: 'student-ankit',
    name: 'Ankit Patel',
    team: 'Team Gamma',
    course: 'Backend Development',
    score: 74,
    lastActivityLabel: '1d ago',
    status: 'at_risk',
  },
  {
    id: 'student-neha',
    name: 'Neha Gupta',
    team: 'Team Alpha',
    course: 'UI/UX Design',
    score: 91,
    lastActivityLabel: '3h ago',
    status: 'on_track',
  },
  {
    id: 'student-rohan',
    name: 'Rohan Mehta',
    team: 'Team Beta',
    course: 'Frontend Development',
    score: 88,
    lastActivityLabel: '1h ago',
    status: 'on_track',
  },
  {
    id: 'student-simran',
    name: 'Simran Kaur',
    team: 'Team Gamma',
    course: 'Backend Development',
    score: 65,
    lastActivityLabel: '2d ago',
    status: 'not_started',
  },
];

export const MOCK_STUDENT_PROFILES: Record<string, StudentProfileDetail> = {
  'student-rahul': {
    id: 'student-rahul',
    name: 'Rahul Verma',
    team: 'Team Alpha',
    courses: [
      { name: 'UI/UX Design Fundamentals', progressPercent: 40 },
      { name: 'Full Stack Web Development', progressPercent: 60 },
    ],
    upcomingSessionLabel: 'Frontend Sprint Review — Today, 10:30 AM',
    feedbackHistory: [
      {
        dateLabel: '3 days ago',
        note: 'Good progress on wireframes, needs to catch up on the milestone submission.',
        rating: 3,
      },
      { dateLabel: '1 week ago', note: 'Strong understanding of design principles.', rating: 4 },
    ],
  },
  'student-priya': {
    id: 'student-priya',
    name: 'Priya Singh',
    team: 'Team Beta',
    courses: [{ name: 'Full Stack Web Development', progressPercent: 55 }],
    upcomingSessionLabel: 'Mentor Check-in — Today, 2:00 PM',
    feedbackHistory: [
      {
        dateLabel: '2 days ago',
        note: 'Missed the last milestone deadline — following up.',
        rating: 3,
      },
    ],
  },
  'student-ankit': {
    id: 'student-ankit',
    name: 'Ankit Patel',
    team: 'Team Gamma',
    courses: [{ name: 'Data Structures & Algorithms', progressPercent: 50 }],
    upcomingSessionLabel: 'Project Guidance — Today, 4:30 PM',
    feedbackHistory: [
      { dateLabel: '4 days ago', note: 'Backend API design needs another pass.', rating: 3 },
    ],
  },
  'student-neha': {
    id: 'student-neha',
    name: 'Neha Gupta',
    team: 'Team Alpha',
    courses: [{ name: 'UI/UX Design Fundamentals', progressPercent: 80 }],
    upcomingSessionLabel: 'Frontend Sprint Review — Today, 10:30 AM',
    feedbackHistory: [
      { dateLabel: '1 week ago', note: 'Excellent attention to detail.', rating: 5 },
    ],
  },
  'student-rohan': {
    id: 'student-rohan',
    name: 'Rohan Mehta',
    team: 'Team Beta',
    courses: [{ name: 'Full Stack Web Development', progressPercent: 85 }],
    upcomingSessionLabel: 'Mentor Check-in — Today, 2:00 PM',
    feedbackHistory: [
      { dateLabel: '5 days ago', note: 'Consistently ahead of schedule.', rating: 5 },
    ],
  },
  'student-simran': {
    id: 'student-simran',
    name: 'Simran Kaur',
    team: 'Team Gamma',
    courses: [{ name: 'Data Structures & Algorithms', progressPercent: 15 }],
    upcomingSessionLabel: 'Project Guidance — Today, 4:30 PM',
    feedbackHistory: [
      {
        dateLabel: '1 week ago',
        note: 'Hasn’t started the latest module — needs a check-in.',
        rating: 2,
      },
    ],
  },
};

export const MOCK_MENTOR_SESSIONS: MentorSession[] = [
  {
    id: 'mentor-session-1',
    title: 'Frontend Sprint Review',
    team: 'Team Alpha',
    dayLabel: '28',
    monthLabel: 'MAY',
    dateLabel: '28 May 2026',
    timeLabel: '10:30 AM – 11:30 AM',
    mode: 'Google Meet',
    status: 'Upcoming',
    agenda: ['Review sprint progress', 'Unblock pending tasks', 'Confirm demo readiness'],
  },
  {
    id: 'mentor-session-2',
    title: 'Mentor Check-in',
    team: 'Team Beta',
    dayLabel: '28',
    monthLabel: 'MAY',
    dateLabel: '28 May 2026',
    timeLabel: '2:00 PM – 3:00 PM',
    mode: 'Google Meet',
    status: 'Upcoming',
    agenda: ['General check-in', 'Address blockers'],
  },
  {
    id: 'mentor-session-3',
    title: 'Project Guidance',
    team: 'Team Gamma',
    dayLabel: '28',
    monthLabel: 'MAY',
    dateLabel: '28 May 2026',
    timeLabel: '4:30 PM – 5:30 PM',
    mode: 'Google Meet',
    status: 'Upcoming',
    agenda: ['Problem statement scoping', 'Research review'],
  },
  {
    id: 'mentor-session-4',
    title: 'Ideation Review',
    team: 'Team Gamma',
    dayLabel: '14',
    monthLabel: 'MAY',
    dateLabel: '14 May 2026',
    timeLabel: '11:00 AM – 12:00 PM',
    mode: 'Google Meet',
    status: 'Completed',
    agenda: ['Reviewed initial ideas', 'Assigned research tasks'],
  },
];

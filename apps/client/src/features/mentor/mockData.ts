import type {
  AssignedStudent,
  AtRiskStudent,
  MentorMenteeViewStats,
  MentorTeamViewStats,
  ProgressSnapshot,
  StudentProfileDetail,
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

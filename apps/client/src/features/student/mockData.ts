import type {
  ActivityItem,
  CalendarEntry,
  CourseSummary,
  EventItem,
  FeaturedEvent,
  LearningStreak,
  MentorSession,
  MentorSummary,
  StudentStats,
  UpcomingEvent,
  WeeklyProgress,
} from './types';

// All data on this page is mock/placeholder — Phase 2/3 of the backend
// (courses, Citadel, sessions) hasn't been built yet. Swapping this out for a
// real fetch later is a matter of changing the queryFn in hooks.ts, not the
// page components themselves.

export const MOCK_STATS: StudentStats = {
  coursesEnrolled: 6,
  tasksCompleted: 24,
  currentStreak: 7,
  xpEarned: 1250,
};

export const MOCK_COURSES: CourseSummary[] = [
  {
    id: 'course-fsw',
    name: 'Full Stack Web Development',
    level: 'Intermediate',
    status: 'in_progress',
    progressPercent: 75,
    updatedLabel: 'Updated 2 days ago',
    accentClassName: 'bg-blue-600',
  },
  {
    id: 'course-dsa',
    name: 'Data Structures & Algorithms',
    level: 'Intermediate',
    status: 'in_progress',
    progressPercent: 60,
    updatedLabel: 'Updated 5 days ago',
    accentClassName: 'bg-emerald-600',
  },
  {
    id: 'course-uiux',
    name: 'UI/UX Design Fundamentals',
    level: 'Beginner',
    status: 'in_progress',
    progressPercent: 40,
    updatedLabel: 'Updated 1 week ago',
    accentClassName: 'bg-violet-600',
  },
  {
    id: 'course-cyber',
    name: 'Cyber Security Basics',
    level: 'Beginner',
    status: 'in_progress',
    progressPercent: 20,
    updatedLabel: 'Updated 1 week ago',
    accentClassName: 'bg-orange-500',
  },
  {
    id: 'course-dbms',
    name: 'Database Management Systems',
    level: 'Beginner',
    status: 'upcoming',
    progressPercent: 0,
    updatedLabel: 'Starts on Jun 10, 2026',
    accentClassName: 'bg-teal-600',
  },
];

export const MOCK_UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: 'evt-1',
    title: 'Frontend Sprint Review',
    dateLabel: 'May 28',
    timeLabel: '10:00 AM – 11:30 AM',
    mode: 'Online',
  },
  {
    id: 'evt-2',
    title: 'Mentor Session',
    dateLabel: 'May 30',
    timeLabel: '2:00 PM – 3:00 PM',
    mode: 'Virtual Room 2',
  },
  {
    id: 'evt-3',
    title: 'UI/UX Workshop',
    dateLabel: 'Jun 2',
    timeLabel: '11:00 AM – 1:00 PM',
    mode: 'Seminar Hall',
  },
];

export const MOCK_MENTOR: MentorSummary = {
  name: 'Rohit Verma',
  title: 'Full Stack Developer @ Forge',
  rating: 4.9,
  reviewCount: 120,
  initials: 'RV',
};

export const MOCK_FEATURED_EVENT: FeaturedEvent = {
  tag: 'Featured Event',
  title: 'Citadel 2.0',
  tagline: 'Where Ideas Build Impact.',
  description:
    'Join us for an action-packed experience of innovation, collaboration and learning. Be a part of something bigger.',
  dateLabel: '5 Jun, 2026',
  timeLabel: '9:30 AM – 10:30 AM',
  venue: 'Auditorium, Main Block',
  participants: '500+ Participants',
};

export const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Completed Lesson 12',
    subtitle: 'Full Stack Web Development',
    timeAgo: '2h ago',
  },
  {
    id: 'act-2',
    title: 'Submitted Assignment',
    subtitle: 'Data Structures & Algorithms',
    timeAgo: '5h ago',
  },
  {
    id: 'act-3',
    title: 'Watched Lesson 8',
    subtitle: 'UI/UX Design Fundamentals',
    timeAgo: '1d ago',
  },
  {
    id: 'act-4',
    title: 'Scored 85% in Quiz',
    subtitle: 'Cyber Security Basics',
    timeAgo: '2d ago',
  },
];

export const MOCK_WEEKLY_PROGRESS: WeeklyProgress = {
  totalPercent: 65,
  changeLabel: '+12% from last week',
  points: [45, 62, 70, 66, 74, 80, 76],
  dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

export const MOCK_STREAK: LearningStreak = {
  days: 7,
  weekPattern: [true, true, true, true, true, true, false],
};

export const MOCK_MENTOR_SESSIONS: MentorSession[] = [
  {
    id: 'session-1',
    title: 'Project Review & Guidance',
    mentorName: 'Shubham Verma',
    mentorTitle: 'Senior Mentor · Full Stack Developer at TechNova',
    mentorBio: '8+ years of experience in product development and mentoring.',
    dateLabel: '29 May 2026',
    dayLabel: '29',
    monthLabel: 'MAY',
    timeLabel: '11:00 AM – 12:00 PM',
    mode: 'Google Meet',
    status: 'Upcoming',
    agenda: [
      'Review of current progress and deliverables',
      'Discuss implementation challenges',
      'Provide feedback and suggestions',
      'Plan next steps and milestones',
    ],
    note: 'Come prepared with your progress updates and questions.',
    meetingLink: '#',
  },
  {
    id: 'session-2',
    title: 'UI/UX Feedback Session',
    mentorName: 'Neha Singh',
    mentorTitle: 'Design Mentor · Product Designer',
    mentorBio: 'Specializes in design systems and usability reviews.',
    dateLabel: '3 Jun 2026',
    dayLabel: '03',
    monthLabel: 'JUN',
    timeLabel: '2:00 PM – 3:00 PM',
    mode: 'Virtual Room 2',
    status: 'Upcoming',
    agenda: [
      'Walk through current wireframes',
      'Discuss accessibility gaps',
      'Prioritize next iteration',
    ],
    note: 'Share your Figma link before the session starts.',
    meetingLink: '#',
  },
  {
    id: 'session-3',
    title: 'Sprint Planning Discussion',
    mentorName: 'Rohan Mehta',
    mentorTitle: 'Mentor · Backend Engineer',
    mentorBio: 'Focuses on architecture and API design reviews.',
    dateLabel: '7 Jun 2026',
    dayLabel: '07',
    monthLabel: 'JUN',
    timeLabel: '4:00 PM – 5:00 PM',
    mode: 'Google Meet',
    status: 'Upcoming',
    agenda: ['Review sprint backlog', 'Assign ownership for tasks', 'Flag blockers early'],
    note: '',
    meetingLink: '#',
  },
];

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'event-frontend-review',
    title: 'Frontend Sprint Review',
    dayLabel: '28',
    monthLabel: 'MAY',
    timeLabel: '10:00 AM – 11:30 AM',
    location: 'Online',
    status: 'upcoming',
    description: 'Weekly review of frontend sprint progress across all teams.',
    whatToExpect: ['Team demos', 'Mentor feedback', 'Q&A'],
    participants: '120+ Participants',
  },
  {
    id: 'event-mentor-session',
    title: 'Mentor Session',
    dayLabel: '30',
    monthLabel: 'MAY',
    timeLabel: '2:00 PM – 3:00 PM',
    location: 'Virtual Room 2',
    status: 'upcoming',
    description: 'Open mentor session for any team that wants extra guidance.',
    whatToExpect: ['Drop-in Q&A', 'Project guidance'],
    participants: '60+ Participants',
  },
  {
    id: 'event-uiux-workshop',
    title: 'UI/UX Workshop',
    dayLabel: '02',
    monthLabel: 'JUN',
    timeLabel: '11:00 AM – 1:00 PM',
    location: 'Seminar Hall',
    status: 'upcoming',
    description: 'Hands-on workshop covering design fundamentals and critique.',
    whatToExpect: ['Live design exercise', 'Portfolio tips'],
    participants: '80+ Participants',
  },
  {
    id: 'event-hackathon-kickoff',
    title: 'Hackathon Kickoff 2026',
    dayLabel: '05',
    monthLabel: 'JUN',
    timeLabel: '9:30 AM – 10:30 AM',
    location: 'Auditorium',
    status: 'upcoming',
    description:
      'Join us for the official kickoff of our biggest hackathon. Innovate, collaborate and build solutions that make an impact.',
    whatToExpect: [
      'Team formation & networking',
      'Problem statements overview',
      'Guidelines & judging criteria',
      'Q&A with mentors',
    ],
    participants: '500+ Participants',
  },
];

export const MOCK_CALENDAR_ENTRIES: CalendarEntry[] = [
  {
    id: 'cal-1',
    title: 'Frontend Sprint Review',
    subtitle: 'Full Stack Web Development',
    timeLabel: '10:00 AM – 11:30 AM',
    location: 'Online',
    date: '2026-05-28',
  },
  {
    id: 'cal-2',
    title: 'Mentor Session',
    subtitle: 'with Rohit Verma',
    timeLabel: '2:00 PM – 3:00 PM',
    location: 'Virtual Room 2',
    date: '2026-05-28',
  },
  {
    id: 'cal-3',
    title: 'Team Standup',
    subtitle: 'Team Alpha',
    timeLabel: '7:00 PM – 8:00 PM',
    location: 'Online',
    date: '2026-05-28',
  },
  {
    id: 'cal-4',
    title: 'UI/UX Workshop',
    subtitle: 'Organized by Design Club',
    timeLabel: '11:00 AM – 1:00 PM',
    location: 'Seminar Hall',
    date: '2026-06-02',
  },
  {
    id: 'cal-5',
    title: 'Hackathon Kickoff',
    subtitle: 'Internal Hackathon 2026',
    timeLabel: '9:30 AM – 10:30 AM',
    location: 'Auditorium',
    date: '2026-06-05',
  },
];

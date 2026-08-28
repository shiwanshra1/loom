export interface StudentStats {
  coursesEnrolled: number;
  tasksCompleted: number;
  currentStreak: number;
  xpEarned: number;
}

export type CourseStatus = 'in_progress' | 'completed' | 'upcoming' | 'dropped';

export interface CourseSummary {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: CourseStatus;
  progressPercent: number;
  updatedLabel: string;
  accentClassName: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  mode: string;
}

export interface MentorSummary {
  name: string;
  title: string;
  rating: number;
  reviewCount: number;
  initials: string;
}

export interface FeaturedEvent {
  tag: string;
  title: string;
  tagline: string;
  description: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  participants: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
}

export interface WeeklyProgress {
  totalPercent: number;
  changeLabel: string;
  points: number[];
  dayLabels: string[];
}

export interface LearningStreak {
  days: number;
  weekPattern: boolean[];
}

export interface SprintTask {
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  dueLabel: string;
}

export type SprintStatus = 'completed' | 'in_progress' | 'upcoming';

export interface Sprint {
  id: string;
  cycleNumber: number;
  title: string;
  phase: string;
  status: SprintStatus;
  // True only when the raw backend status is genuinely "in_progress" — the
  // display status above collapses in_progress/submitted/reviewed together,
  // but only in_progress actually accepts a new milestone submission.
  canSubmitMilestone: boolean;
  progressPercent: number;
  dateRangeLabel: string;
  tasks: SprintTask[];
  teamMembers: number;
}

export interface ProblemStatementDeliverable {
  title: string;
  done: boolean;
}

export type ProblemStatementTab = 'all' | 'mine' | 'shortlisted' | 'completed';

export interface ProblemStatement {
  id: string;
  title: string;
  description: string;
  overview: string;
  tags: string[];
  teamSize: number;
  durationLabel: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Open' | 'Closed';
  featured: boolean;
  bookmarked: boolean;
  isMine: boolean;
  isShortlisted: boolean;
  isCompleted: boolean;
  hasExpressedInterest: boolean;
  deliverables: ProblemStatementDeliverable[];
  updatedLabel: string;
}

export type MentorSessionTab = 'upcoming' | 'past';

export interface MentorSession {
  id: string;
  title: string;
  mentorName: string;
  mentorTitle: string;
  mentorBio: string;
  dateLabel: string;
  dayLabel: string;
  monthLabel: string;
  timeLabel: string;
  mode: string;
  status: 'Upcoming' | 'Completed';
  agenda: string[];
  note: string;
  meetingLink: string;
}

export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

export interface EventItem {
  id: string;
  title: string;
  dayLabel: string;
  monthLabel: string;
  timeLabel: string;
  location: string;
  status: EventStatus;
  description: string;
  whatToExpect: string[];
  participants: string;
}

export interface CalendarEntry {
  id: string;
  title: string;
  subtitle: string;
  timeLabel: string;
  location: string;
  date: string; // YYYY-MM-DD
}

export interface MentorTeamViewStats {
  studentsAssigned: number;
  teamsMentoring: number;
  sessionsToday: number;
  pendingAssignments: number;
}

export interface MentorMenteeViewStats {
  activeMentees: number;
  upcomingSessions: number;
  sessionsCompleted: number;
  averageRating: number;
}

export interface TodaySession {
  id: string;
  title: string;
  team: string;
  timeLabel: string;
  mode: string;
  startingInLabel: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  letter: string;
  memberCount: number;
  progressPercent: number;
}

export interface AtRiskStudent {
  id: string;
  name: string;
  team: string;
  subject: string;
  overdueCount: number;
}

export interface ProgressSnapshot {
  onTrackPercent: number;
  atRiskPercent: number;
  notStartedPercent: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  timeLabel: string;
}

export interface UpcomingSessionHighlight {
  title: string;
  team: string;
  dateLabel: string;
  timeLabel: string;
  mode: string;
  startingInLabel: string;
}

export type StudentStatus = 'on_track' | 'at_risk' | 'not_started';

export interface AssignedStudent {
  id: string;
  name: string;
  team: string;
  course: string;
  score: number;
  lastActivityLabel: string;
  status: StudentStatus;
}

export interface StudentCourseProgress {
  name: string;
  progressPercent: number;
}

export interface StudentFeedbackEntry {
  dateLabel: string;
  note: string;
  rating: number;
}

export interface StudentProfileDetail {
  id: string;
  name: string;
  team: string;
  courses: StudentCourseProgress[];
  upcomingSessionLabel: string;
  feedbackHistory: StudentFeedbackEntry[];
}

export interface TeamMember {
  name: string;
  role: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  letter: string;
  progressPercent: number;
  trainerName: string;
  problemStatementTitle: string;
  currentSprint: string;
  // Null once every cycle is complete, or if sprints haven't materialized yet.
  currentSprintId: string | null;
  currentSprintStatus: 'in_progress' | 'submitted' | 'reviewed' | null;
  members: TeamMember[];
}

export type MentorSessionStatus = 'Upcoming' | 'Completed';

export interface MentorSession {
  id: string;
  title: string;
  team: string;
  dayLabel: string;
  monthLabel: string;
  dateLabel: string;
  timeLabel: string;
  mode: string;
  status: MentorSessionStatus;
  agenda: string[];
}

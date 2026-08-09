import { useQuery } from '@tanstack/react-query';
import {
  MOCK_ASSIGNED_STUDENTS,
  MOCK_AT_RISK_STUDENTS,
  MOCK_MENTEE_VIEW_STATS,
  MOCK_MENTOR_SESSIONS,
  MOCK_NOTIFICATIONS,
  MOCK_PROGRESS_SNAPSHOT,
  MOCK_STUDENT_PROFILES,
  MOCK_TEAMS,
  MOCK_TEAM_DETAILS,
  MOCK_TEAM_VIEW_STATS,
  MOCK_TODAY_SESSIONS,
  MOCK_UPCOMING_SESSION_HIGHLIGHT,
} from './mockData';

// Thin useQuery wrappers around static mock data — same pattern as the
// Student feature. Swapping to the real API later means changing each
// queryFn, not the pages that consume these hooks.

export function useMentorTeamStats() {
  return useQuery({
    queryKey: ['mentor', 'team-stats'],
    queryFn: () => Promise.resolve(MOCK_TEAM_VIEW_STATS),
  });
}

export function useMentorMenteeStats() {
  return useQuery({
    queryKey: ['mentor', 'mentee-stats'],
    queryFn: () => Promise.resolve(MOCK_MENTEE_VIEW_STATS),
  });
}

export function useTodaySessions() {
  return useQuery({
    queryKey: ['mentor', 'today-sessions'],
    queryFn: () => Promise.resolve(MOCK_TODAY_SESSIONS),
  });
}

export function useMentorTeams() {
  return useQuery({ queryKey: ['mentor', 'teams'], queryFn: () => Promise.resolve(MOCK_TEAMS) });
}

export function useAtRiskStudents() {
  return useQuery({
    queryKey: ['mentor', 'at-risk'],
    queryFn: () => Promise.resolve(MOCK_AT_RISK_STUDENTS),
  });
}

export function useProgressSnapshot() {
  return useQuery({
    queryKey: ['mentor', 'progress-snapshot'],
    queryFn: () => Promise.resolve(MOCK_PROGRESS_SNAPSHOT),
  });
}

export function useMentorNotifications() {
  return useQuery({
    queryKey: ['mentor', 'notifications'],
    queryFn: () => Promise.resolve(MOCK_NOTIFICATIONS),
  });
}

export function useUpcomingSessionHighlight() {
  return useQuery({
    queryKey: ['mentor', 'upcoming-session-highlight'],
    queryFn: () => Promise.resolve(MOCK_UPCOMING_SESSION_HIGHLIGHT),
  });
}

export function useAssignedStudents() {
  return useQuery({
    queryKey: ['mentor', 'assigned-students'],
    queryFn: () => Promise.resolve(MOCK_ASSIGNED_STUDENTS),
  });
}

export function useStudentProfiles() {
  return useQuery({
    queryKey: ['mentor', 'student-profiles'],
    queryFn: () => Promise.resolve(MOCK_STUDENT_PROFILES),
  });
}

export function useTeamDetails() {
  return useQuery({
    queryKey: ['mentor', 'team-details'],
    queryFn: () => Promise.resolve(MOCK_TEAM_DETAILS),
  });
}

export function useMentorSessions() {
  return useQuery({
    queryKey: ['mentor', 'sessions'],
    queryFn: () => Promise.resolve(MOCK_MENTOR_SESSIONS),
  });
}

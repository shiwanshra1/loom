import { useQuery } from '@tanstack/react-query';
import {
  MOCK_CALENDAR_ENTRIES,
  MOCK_CITADEL_DAYS_REMAINING,
  MOCK_COURSES,
  MOCK_EVENTS,
  MOCK_FEATURED_EVENT,
  MOCK_MENTOR,
  MOCK_MENTOR_SESSIONS,
  MOCK_PROBLEM_STATEMENTS,
  MOCK_RECENT_ACTIVITY,
  MOCK_SPRINTS,
  MOCK_STATS,
  MOCK_STREAK,
  MOCK_UPCOMING_EVENTS,
  MOCK_WEEKLY_PROGRESS,
} from './mockData';

// Each hook below is a thin useQuery wrapper around static mock data — Phase
// 2/3 backend (courses, Citadel, sessions) doesn't exist yet. Swapping to the
// real API later means replacing each queryFn with an apiRequest() call; the
// pages consuming these hooks don't need to change.

export function useStudentStats() {
  return useQuery({ queryKey: ['student', 'stats'], queryFn: () => Promise.resolve(MOCK_STATS) });
}

export function useStudentCourses() {
  return useQuery({
    queryKey: ['student', 'courses'],
    queryFn: () => Promise.resolve(MOCK_COURSES),
  });
}

export function useStudentUpcomingEvents() {
  return useQuery({
    queryKey: ['student', 'upcoming-events'],
    queryFn: () => Promise.resolve(MOCK_UPCOMING_EVENTS),
  });
}

export function useStudentMentor() {
  return useQuery({ queryKey: ['student', 'mentor'], queryFn: () => Promise.resolve(MOCK_MENTOR) });
}

export function useFeaturedEvent() {
  return useQuery({
    queryKey: ['student', 'featured-event'],
    queryFn: () => Promise.resolve(MOCK_FEATURED_EVENT),
  });
}

export function useStudentActivity() {
  return useQuery({
    queryKey: ['student', 'activity'],
    queryFn: () => Promise.resolve(MOCK_RECENT_ACTIVITY),
  });
}

export function useWeeklyProgress() {
  return useQuery({
    queryKey: ['student', 'weekly-progress'],
    queryFn: () => Promise.resolve(MOCK_WEEKLY_PROGRESS),
  });
}

export function useLearningStreak() {
  return useQuery({ queryKey: ['student', 'streak'], queryFn: () => Promise.resolve(MOCK_STREAK) });
}

export function useSprints() {
  return useQuery({
    queryKey: ['student', 'sprints'],
    queryFn: () => Promise.resolve(MOCK_SPRINTS),
  });
}

export function useCitadelDaysRemaining() {
  return useQuery({
    queryKey: ['student', 'citadel-days-remaining'],
    queryFn: () => Promise.resolve(MOCK_CITADEL_DAYS_REMAINING),
  });
}

export function useProblemStatements() {
  return useQuery({
    queryKey: ['student', 'problem-statements'],
    queryFn: () => Promise.resolve(MOCK_PROBLEM_STATEMENTS),
  });
}

export function useMentorSessions() {
  return useQuery({
    queryKey: ['student', 'mentor-sessions'],
    queryFn: () => Promise.resolve(MOCK_MENTOR_SESSIONS),
  });
}

export function useEvents() {
  return useQuery({ queryKey: ['student', 'events'], queryFn: () => Promise.resolve(MOCK_EVENTS) });
}

export function useCalendarEntries() {
  return useQuery({
    queryKey: ['student', 'calendar-entries'],
    queryFn: () => Promise.resolve(MOCK_CALENDAR_ENTRIES),
  });
}

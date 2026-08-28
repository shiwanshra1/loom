import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AssessmentDto,
  AttendanceHistoryEntryDto,
  CourseDeliveryMode,
  CourseDto,
  CourseListPageDto,
  CourseProgressDto,
  EnrollmentDto,
  VideoProgressDto,
} from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';
import {
  MOCK_CALENDAR_ENTRIES,
  MOCK_CITADEL_DAYS_REMAINING,
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
import type { CourseStatus, CourseSummary } from './types';

// Each hook below is a thin useQuery wrapper around static mock data — Phase
// 3+ backend (Citadel, sessions, events) doesn't exist yet. Swapping to the
// real API later means replacing each queryFn with an apiRequest() call; the
// pages consuming these hooks don't need to change. `useStudentCourses` below
// is the one hook already swapped over, by Phase 2.

export function useStudentStats() {
  return useQuery({ queryKey: ['student', 'stats'], queryFn: () => Promise.resolve(MOCK_STATS) });
}

const ENROLLMENTS_KEY = ['student', 'enrollments'];

// No leveling/difficulty field exists on the real course model, and real
// watch/attendance progress isn't computed until Phase 3/4 — until then this
// maps an enrollment into the existing CourseSummary shape with the
// best-available stand-ins, disclosed in the Phase 2 report.
const CARD_ACCENTS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-orange-500',
  'bg-teal-600',
  'bg-pink-600',
];

function enrollmentStatusToCourseStatus(status: EnrollmentDto['status']): CourseStatus {
  switch (status) {
    case 'active':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'refunded':
      return 'dropped';
    case 'pending_payment':
    default:
      return 'upcoming';
  }
}

function toCourseSummary(enrollment: EnrollmentDto, index: number): CourseSummary {
  return {
    id: enrollment.courseId,
    name: enrollment.course.title,
    level: 'Beginner',
    status: enrollmentStatusToCourseStatus(enrollment.status),
    progressPercent: enrollment.status === 'completed' ? 100 : 0,
    updatedLabel: `Enrolled ${new Date(enrollment.enrolledAt).toLocaleDateString()}`,
    accentClassName: CARD_ACCENTS[index % CARD_ACCENTS.length] ?? 'bg-blue-600',
  };
}

export function useStudentCourses() {
  return useQuery({
    queryKey: ['student', 'courses'],
    queryFn: () =>
      apiRequest<{ enrollments: EnrollmentDto[] }>('/api/enrollments/mine').then((r) =>
        r.enrollments.map(toCourseSummary)
      ),
  });
}

export function useCatalog(deliveryMode?: CourseDeliveryMode) {
  return useQuery({
    queryKey: ['student', 'catalog', deliveryMode ?? 'all'],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' });
      if (deliveryMode) params.set('deliveryMode', deliveryMode);
      return apiRequest<CourseListPageDto>(`/api/catalog?${params.toString()}`);
    },
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ENROLLMENTS_KEY,
    queryFn: () =>
      apiRequest<{ enrollments: EnrollmentDto[] }>('/api/enrollments/mine').then(
        (r) => r.enrollments
      ),
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiRequest<{ enrollment: EnrollmentDto }>('/api/enrollments', {
        method: 'POST',
        body: { courseId },
      }).then((r) => r.enrollment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ENROLLMENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['student', 'courses'] });
    },
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

export function useCourseDetail(courseId: string | undefined) {
  return useQuery({
    queryKey: ['student', 'course', courseId],
    queryFn: () =>
      apiRequest<{ course: CourseDto }>(`/api/courses/${courseId}`).then((r) => r.course),
    enabled: Boolean(courseId),
  });
}

export function useCourseAttendance(studentId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['student', 'attendance', courseId],
    queryFn: () =>
      apiRequest<{ attendance: AttendanceHistoryEntryDto[] }>(
        `/api/students/${studentId}/attendance?courseId=${courseId}`
      ).then((r) => r.attendance),
    enabled: Boolean(studentId) && Boolean(courseId),
  });
}

export function useVideoProgress(courseId: string | undefined) {
  return useQuery({
    queryKey: ['student', 'video-progress', courseId],
    queryFn: () =>
      apiRequest<{ progress: VideoProgressDto[] }>(`/api/video-progress?courseId=${courseId}`).then(
        (r) => r.progress
      ),
    enabled: Boolean(courseId),
  });
}

export function useUpdateVideoProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      courseId: string;
      dayNumber: number;
      positionSeconds: number;
      durationSeconds: number;
    }) =>
      apiRequest<{ progress: VideoProgressDto }>('/api/video-progress', {
        method: 'POST',
        body: input,
      }).then((r) => r.progress),
    onSuccess: (progress) => {
      void queryClient.invalidateQueries({
        queryKey: ['student', 'video-progress', progress.courseId],
      });
    },
  });
}

export function useCourseProgress(studentId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['student', 'course-progress', courseId],
    queryFn: () =>
      apiRequest<{ progress: CourseProgressDto }>(
        `/api/students/${studentId}/course-progress?courseId=${courseId}`
      ).then((r) => r.progress),
    enabled: Boolean(studentId) && Boolean(courseId),
  });
}

export function useCourseAssessments(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course', 'assessments', courseId],
    queryFn: () =>
      apiRequest<{ assessments: AssessmentDto[] }>(`/api/courses/${courseId}/assessments`).then(
        (r) => r.assessments
      ),
    enabled: Boolean(courseId),
  });
}

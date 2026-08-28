import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AssessmentDto,
  AttendanceHistoryEntryDto,
  CourseDeliveryMode,
  CourseDto,
  CourseListPageDto,
  CourseProgressDto,
  EnrollmentDto,
  ProblemStatementDto,
  RazorpayCheckoutDto,
  TeamSprintsDto,
  VideoProgressDto,
} from '@forge-loom/shared-types';
import { apiRequest, ApiClientError } from '../../lib/apiClient';
import { openRazorpayCheckout } from '../../lib/razorpay';
import {
  MOCK_CALENDAR_ENTRIES,
  MOCK_EVENTS,
  MOCK_FEATURED_EVENT,
  MOCK_MENTOR,
  MOCK_MENTOR_SESSIONS,
  MOCK_RECENT_ACTIVITY,
  MOCK_STATS,
  MOCK_STREAK,
  MOCK_UPCOMING_EVENTS,
  MOCK_WEEKLY_PROGRESS,
} from './mockData';
import type { CourseStatus, CourseSummary, ProblemStatement, Sprint } from './types';

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

interface EnrollInput {
  courseId: string;
  courseTitle: string;
  userEmail?: string;
}

// Three real network round-trips, not one: create the enrollment + a
// Razorpay order, let the user actually pay via Checkout.js (test-mode cards
// only, per the account's current key), then verify the signature server-side
// before the enrollment is considered active. A dismissed/cancelled checkout
// rejects with RazorpayDismissedError rather than silently failing.
export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, courseTitle, userEmail }: EnrollInput) => {
      const created = await apiRequest<{
        enrollment: EnrollmentDto;
        razorpay: RazorpayCheckoutDto;
      }>('/api/enrollments', { method: 'POST', body: { courseId } });

      const payment = await openRazorpayCheckout({
        key: created.razorpay.keyId,
        amount: created.razorpay.amount,
        currency: created.razorpay.currency,
        order_id: created.razorpay.orderId,
        name: 'Forge Loom',
        description: courseTitle,
        prefill: userEmail ? { email: userEmail } : undefined,
      });

      const verified = await apiRequest<{ enrollment: EnrollmentDto }>(
        `/api/enrollments/${created.enrollment.id}/verify-payment`,
        {
          method: 'POST',
          body: {
            razorpayPaymentId: payment.razorpay_payment_id,
            razorpayOrderId: payment.razorpay_order_id,
            razorpaySignature: payment.razorpay_signature,
          },
        }
      );
      return verified.enrollment;
    },
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

// Citadel's real model only has 3 cycles (the 3-sprint investor-unlock rule)
// — the mock's 4th placeholder sprint/phase label doesn't carry over.
export const SPRINT_PHASE_LABELS = [
  'Ideation & Research',
  'Development & Prototyping',
  'Testing & Integration',
];

function sprintStatusToDisplay(
  status: TeamSprintsDto['sprints'][number]['status']
): Sprint['status'] {
  if (status === 'not_started') return 'upcoming';
  if (status === 'complete') return 'completed';
  return 'in_progress'; // in_progress | submitted | reviewed all read as "active" to the student
}

function formatDateRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

async function fetchMySprints(): Promise<TeamSprintsDto | null> {
  try {
    return await apiRequest<TeamSprintsDto>('/api/sprints/mine');
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null; // not on a Citadel team yet — a real, expected state
    }
    throw err;
  }
}

export function useSprints() {
  return useQuery({
    queryKey: ['student', 'sprints'],
    queryFn: async () => {
      const data = await fetchMySprints();
      if (!data) return [];
      return data.sprints.map((sprint): Sprint => ({
        id: sprint.id,
        cycleNumber: sprint.cycleNumber,
        title: `Sprint Cycle ${sprint.cycleNumber}`,
        phase: SPRINT_PHASE_LABELS[sprint.cycleNumber - 1] ?? `Cycle ${sprint.cycleNumber}`,
        status: sprintStatusToDisplay(sprint.status),
        canSubmitMilestone: sprint.status === 'in_progress',
        progressPercent: sprint.progressPercent,
        dateRangeLabel: formatDateRange(sprint.startDate, sprint.endDate),
        tasks: sprint.tasks.map((task) => ({
          title: task.title,
          status: task.status,
          dueLabel: new Date(task.dueDate).toLocaleDateString(),
        })),
        teamMembers: data.team.memberCount,
      }));
    },
  });
}

export function useCitadelDaysRemaining() {
  return useQuery({
    queryKey: ['student', 'citadel-days-remaining'],
    queryFn: async () => {
      const data = await fetchMySprints();
      const active = data?.sprints.find((sprint) => sprint.status !== 'complete');
      if (!active) return 0;
      const diffMs = new Date(active.endDate).getTime() - Date.now();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    },
  });
}

// Raw team+sprint+submission data for the Progress Report and Feedback pages
// — unlike useSprints() above, these are brand-new pages with no legacy
// display shape to preserve, so they consume the DTO directly.
const SPRINTS_KEY = ['student', 'sprints'];
const CITADEL_TEAM_KEY = ['student', 'citadel-team'];

export function useMyCitadelTeam() {
  return useQuery({
    queryKey: CITADEL_TEAM_KEY,
    queryFn: fetchMySprints,
  });
}

export function useSubmitMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sprintId,
      artifactUrls,
      demoDate,
    }: {
      sprintId: string;
      artifactUrls: string[];
      demoDate?: string;
    }) =>
      apiRequest(`/api/sprints/${sprintId}/submissions`, {
        method: 'POST',
        body: { artifactUrls, demoDate },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SPRINTS_KEY });
      void queryClient.invalidateQueries({ queryKey: CITADEL_TEAM_KEY });
    },
  });
}

function formatUpdatedLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Updated today';
  if (days === 1) return 'Updated 1d ago';
  if (days < 7) return `Updated ${days}d ago`;
  return `Updated ${Math.floor(days / 7)}w ago`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toProblemStatement(dto: ProblemStatementDto): ProblemStatement {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    overview: dto.overview ?? '',
    tags: dto.tags,
    teamSize: dto.teamSize,
    durationLabel: `${dto.durationWeeks} Week${dto.durationWeeks === 1 ? '' : 's'}`,
    difficulty: capitalize(dto.difficulty) as ProblemStatement['difficulty'],
    status: capitalize(dto.status) as ProblemStatement['status'],
    featured: dto.featured,
    bookmarked: dto.bookmarked,
    isMine: dto.isMine,
    isShortlisted: dto.bookmarked,
    isCompleted: dto.status === 'closed',
    hasExpressedInterest: dto.interested,
    deliverables: dto.deliverables,
    updatedLabel: formatUpdatedLabel(dto.updatedAt),
  };
}

const PROBLEM_STATEMENTS_KEY = ['student', 'problem-statements'];

export function useProblemStatements() {
  return useQuery({
    queryKey: PROBLEM_STATEMENTS_KEY,
    queryFn: () =>
      apiRequest<{ problemStatements: ProblemStatementDto[] }>('/api/problem-statements').then(
        (r) => r.problemStatements.map(toProblemStatement)
      ),
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (problemStatementId: string) =>
      apiRequest<{ bookmarked: boolean }>(
        `/api/problem-statements/${problemStatementId}/bookmark`,
        {
          method: 'POST',
        }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROBLEM_STATEMENTS_KEY });
    },
  });
}

export function useExpressInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (problemStatementId: string) =>
      apiRequest<void>(`/api/problem-statements/${problemStatementId}/interest`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROBLEM_STATEMENTS_KEY });
    },
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

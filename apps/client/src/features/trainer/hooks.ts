import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AssessmentDto,
  AssessmentType,
  CertificateDto,
  CourseDto,
  CourseSessionDto,
  RosterEntryDto,
  TeamDto,
} from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

export function useMyTeams() {
  return useQuery({
    queryKey: ['trainer', 'teams'],
    queryFn: () => apiRequest<{ teams: TeamDto[] }>('/api/teams').then((r) => r.teams),
  });
}

export function useTeachingCourses() {
  return useQuery({
    queryKey: ['trainer', 'teaching-courses'],
    queryFn: () =>
      apiRequest<{ courses: CourseDto[] }>('/api/courses/teaching').then((r) => r.courses),
  });
}

export function useCourseSessions(courseId: string | undefined) {
  return useQuery({
    queryKey: ['trainer', 'sessions', courseId],
    queryFn: () =>
      apiRequest<{ sessions: CourseSessionDto[] }>(`/api/courses/${courseId}/sessions`).then(
        (r) => r.sessions
      ),
    enabled: Boolean(courseId),
  });
}

export function useRoster(courseId: string | undefined) {
  return useQuery({
    queryKey: ['trainer', 'roster', courseId],
    queryFn: () =>
      apiRequest<{ roster: RosterEntryDto[] }>(`/api/courses/${courseId}/roster`).then(
        (r) => r.roster
      ),
    enabled: Boolean(courseId),
  });
}

export function useUpdateSession(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      status,
      cancelReason,
    }: {
      sessionId: string;
      status: 'completed' | 'cancelled';
      cancelReason?: string;
    }) =>
      apiRequest<{ session: CourseSessionDto }>(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        body: { status, cancelReason },
      }).then((r) => r.session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trainer', 'sessions', courseId] });
    },
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

export function useCreateAssessment(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; type: AssessmentType; scheduledDate: string }) =>
      apiRequest<{ assessment: AssessmentDto }>(`/api/courses/${courseId}/assessments`, {
        method: 'POST',
        body: input,
      }).then((r) => r.assessment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['course', 'assessments', courseId] });
    },
  });
}

export function useIssueCertificate(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      apiRequest<{ certificate: CertificateDto }>(`/api/enrollments/${enrollmentId}/certificate`, {
        method: 'POST',
        body: {},
      }).then((r) => r.certificate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trainer', 'roster', courseId] });
    },
  });
}

export function useMarkAttendance(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      records,
    }: {
      sessionId: string;
      records: { studentId: string; status: 'present' | 'absent' | 'excused' }[];
    }) =>
      apiRequest<{ session: CourseSessionDto }>(`/api/sessions/${sessionId}/attendance`, {
        method: 'POST',
        body: { records },
      }).then((r) => r.session),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trainer', 'sessions', courseId] });
    },
  });
}

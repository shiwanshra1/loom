import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BulkCreateStudentsResultDto,
  BulkStudentRowInput,
  CohortDto,
  CollegeFacultyMemberDto,
  CollegeProgramDto,
  CreateRosterMemberResultDto,
  RosterStudentDto,
  SendWelcomeEmailsAccountInput,
  SendWelcomeEmailsResultDto,
} from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

// Every read hook below takes an optional collegeId so Forge Admin's
// cross-college drill-in page (Phase 9) can reuse them exactly as College
// Admin's own dashboard does — omit it for "my own college" (College Admin),
// pass it for "this specific college" (Forge Admin, via ?collegeId=).
function collegeQuery(collegeId?: string): string {
  return collegeId ? `?collegeId=${encodeURIComponent(collegeId)}` : '';
}

export function useCollegePrograms(collegeId?: string) {
  return useQuery({
    queryKey: ['college', 'programs', collegeId ?? 'mine'],
    queryFn: () =>
      apiRequest<{ programs: CollegeProgramDto[] }>(
        `/api/colleges/mine/programs${collegeQuery(collegeId)}`
      ).then((r) => r.programs),
  });
}

export function useCollegeFaculty(collegeId?: string) {
  return useQuery({
    queryKey: ['college', 'faculty', collegeId ?? 'mine'],
    queryFn: () =>
      apiRequest<{ faculty: CollegeFacultyMemberDto[] }>(
        `/api/colleges/mine/faculty${collegeQuery(collegeId)}`
      ).then((r) => r.faculty),
  });
}

export function useCollegeBatches(collegeId?: string) {
  return useQuery({
    queryKey: ['college', 'batches', collegeId ?? 'mine'],
    queryFn: () =>
      apiRequest<{ cohorts: CohortDto[] }>(`/api/cohorts${collegeQuery(collegeId)}`).then(
        (r) => r.cohorts
      ),
  });
}

export interface CreateBatchInput {
  name: string;
  startDate: string;
  endDate: string;
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBatchInput) =>
      apiRequest<{ cohort: CohortDto }>('/api/cohorts', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['college', 'batches'] });
    },
  });
}

export function useCollegeStudents(collegeId?: string) {
  return useQuery({
    queryKey: ['college', 'students', collegeId ?? 'mine'],
    queryFn: () =>
      apiRequest<{ students: RosterStudentDto[] }>(
        `/api/college/students${collegeQuery(collegeId)}`
      ).then((r) => r.students),
  });
}

export interface CreateRosterMemberInput {
  email: string;
  displayName: string;
}

function useCreateRosterMember(path: string, invalidateKey: string[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRosterMemberInput) =>
      apiRequest<CreateRosterMemberResultDto>(path, { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invalidateKey });
    },
  });
}

export function useCreateStudent() {
  return useCreateRosterMember('/api/college/students', ['college', 'students']);
}

export function useCreateMentor() {
  return useCreateRosterMember('/api/college/mentors', ['college', 'faculty']);
}

export function useCreateTrainer() {
  return useCreateRosterMember('/api/college/trainers', ['college', 'faculty']);
}

export function useUpdateStudentBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { studentUserId: string; cohortId: string | null }) =>
      apiRequest<{ student: RosterStudentDto }>(
        `/api/college/students/${input.studentUserId}/batch`,
        { method: 'PATCH', body: { cohortId: input.cohortId } }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['college', 'students'] });
    },
  });
}

export function useBulkCreateStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: BulkStudentRowInput[]) =>
      apiRequest<BulkCreateStudentsResultDto>('/api/college/students/bulk', {
        method: 'POST',
        body: { rows },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['college', 'students'] });
    },
  });
}

export function useSendWelcomeEmails() {
  return useMutation({
    mutationFn: (accounts: SendWelcomeEmailsAccountInput[]) =>
      apiRequest<SendWelcomeEmailsResultDto>('/api/college/students/bulk/send-welcome-emails', {
        method: 'POST',
        body: { accounts },
      }),
  });
}

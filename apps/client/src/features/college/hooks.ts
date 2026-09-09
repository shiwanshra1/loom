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

export function useCollegePrograms() {
  return useQuery({
    queryKey: ['college', 'programs'],
    queryFn: () =>
      apiRequest<{ programs: CollegeProgramDto[] }>('/api/colleges/mine/programs').then(
        (r) => r.programs
      ),
  });
}

export function useCollegeFaculty() {
  return useQuery({
    queryKey: ['college', 'faculty'],
    queryFn: () =>
      apiRequest<{ faculty: CollegeFacultyMemberDto[] }>('/api/colleges/mine/faculty').then(
        (r) => r.faculty
      ),
  });
}

export function useCollegeBatches() {
  return useQuery({
    queryKey: ['college', 'batches'],
    queryFn: () => apiRequest<{ cohorts: CohortDto[] }>('/api/cohorts').then((r) => r.cohorts),
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

export function useCollegeStudents() {
  return useQuery({
    queryKey: ['college', 'students'],
    queryFn: () =>
      apiRequest<{ students: RosterStudentDto[] }>('/api/college/students').then(
        (r) => r.students
      ),
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

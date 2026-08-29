import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminUserRowDto,
  AnalyticsDto,
  CohortDto,
  CohortPhase as ServerCohortPhase,
  CollegeDto,
  NationalStatsDto,
} from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

export interface NationalStats {
  totalColleges: number;
  totalStudents: number;
  venturesLaunched: number;
  employabilityLiftPercent: number | null;
}

export type UserStatus = 'active' | 'pending_verification' | 'suspended';

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  college: string;
  status: UserStatus;
}

export type CohortPhase = 'Activation' | 'Bootcamp' | 'Citadel';

export interface AdminCohort {
  id: string;
  name: string;
  college: string;
  phase: CohortPhase;
}

const PHASE_TO_CLIENT: Record<ServerCohortPhase, CohortPhase> = {
  activation: 'Activation',
  bootcamp: 'Bootcamp',
  citadel: 'Citadel',
};
const PHASE_TO_SERVER: Record<CohortPhase, ServerCohortPhase> = {
  Activation: 'activation',
  Bootcamp: 'bootcamp',
  Citadel: 'citadel',
};
const PHASE_ORDER: CohortPhase[] = ['Activation', 'Bootcamp', 'Citadel'];

export function nextPhase(phase: CohortPhase): CohortPhase {
  const index = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[Math.min(index + 1, PHASE_ORDER.length - 1)] ?? phase;
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => apiRequest<AnalyticsDto>('/api/admin/analytics'),
  });
}

export function useNationalStats() {
  return useQuery({
    queryKey: ['admin', 'national-stats'],
    queryFn: () => apiRequest<NationalStatsDto>('/api/admin/national-stats'),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () =>
      apiRequest<{ users: AdminUserRowDto[] }>('/api/admin/users').then((r) =>
        r.users.map((u): AdminUserRow => ({
          id: u.id,
          name: u.email,
          email: u.email,
          role: u.role,
          college: u.collegeName ?? '—',
          status: u.status,
        }))
      ),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: 'active' | 'suspended' }) =>
      apiRequest(`/api/admin/users/${input.id}/status`, {
        method: 'PATCH',
        body: { status: input.status },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminCohorts() {
  return useQuery({
    queryKey: ['admin', 'cohorts'],
    queryFn: async () => {
      const [{ cohorts }, { colleges }] = await Promise.all([
        apiRequest<{ cohorts: CohortDto[] }>('/api/cohorts'),
        apiRequest<{ colleges: CollegeDto[] }>('/api/colleges'),
      ]);
      const nameByCollegeId = new Map(colleges.map((c) => [c.id, c.name]));

      return cohorts.map((cohort): AdminCohort => ({
        id: cohort.id,
        name: cohort.name,
        college: nameByCollegeId.get(cohort.collegeId) ?? 'Unknown college',
        phase: PHASE_TO_CLIENT[cohort.phase],
      }));
    },
  });
}

export function useAdvanceCohortPhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; phase: CohortPhase }) =>
      apiRequest(`/api/cohorts/${input.id}/phase`, {
        method: 'PATCH',
        body: { phase: PHASE_TO_SERVER[input.phase] },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'cohorts'] });
    },
  });
}

import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — built from wireframes.md §11 (Forge Admin isn't in the
// original source material by name, but required by the architecture doc's
// superuser role for cross-college oversight).

export interface NationalStats {
  totalColleges: number;
  totalStudents: number;
  venturesLaunched: number;
  employabilityLiftPercent: number;
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

const MOCK_NATIONAL_STATS: NationalStats = {
  totalColleges: 12,
  totalStudents: 4820,
  venturesLaunched: 96,
  employabilityLiftPercent: 34,
};

const MOCK_USERS: AdminUserRow[] = [
  {
    id: 'u-1',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    role: 'student',
    college: 'Forge Institute of Technology',
    status: 'active',
  },
  {
    id: 'u-2',
    name: 'Rohit Verma',
    email: 'rohit.verma@example.com',
    role: 'mentor',
    college: 'Forge Institute of Technology',
    status: 'active',
  },
  {
    id: 'u-3',
    name: 'Ananya Rao',
    email: 'ananya.rao@example.com',
    role: 'trainer',
    college: 'Riverside College of Engineering',
    status: 'active',
  },
  {
    id: 'u-4',
    name: 'Sanjay Rao',
    email: 'sanjay.rao@example.com',
    role: 'hr',
    college: '—',
    status: 'pending_verification',
  },
];

const MOCK_COHORTS: AdminCohort[] = [
  { id: 'c-1', name: 'Cohort 4', college: 'Forge Institute of Technology', phase: 'Citadel' },
  { id: 'c-2', name: 'Cohort 5', college: 'Riverside College of Engineering', phase: 'Bootcamp' },
  { id: 'c-3', name: 'Cohort 1', college: 'Northgate University', phase: 'Activation' },
];

const PHASE_ORDER: CohortPhase[] = ['Activation', 'Bootcamp', 'Citadel'];

export function nextPhase(phase: CohortPhase): CohortPhase {
  const index = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[Math.min(index + 1, PHASE_ORDER.length - 1)] ?? phase;
}

export function useNationalStats() {
  return useQuery({
    queryKey: ['admin', 'national-stats'],
    queryFn: () => Promise.resolve(MOCK_NATIONAL_STATS),
  });
}
export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: () => Promise.resolve(MOCK_USERS) });
}
export function useAdminCohorts() {
  return useQuery({ queryKey: ['admin', 'cohorts'], queryFn: () => Promise.resolve(MOCK_COHORTS) });
}

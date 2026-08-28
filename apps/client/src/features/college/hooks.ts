import { useQuery } from '@tanstack/react-query';
import type { CollegeFacultyMemberDto, CollegeProgramDto } from '@forge-loom/shared-types';
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

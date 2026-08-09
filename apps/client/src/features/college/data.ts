import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — built from wireframes.md §7.

export interface CollegeProgram {
  id: string;
  name: string;
  studentsEnrolled: number;
  status: 'Active' | 'Upcoming';
}

export interface FacultyMember {
  id: string;
  name: string;
  role: 'Mentor' | 'Trainer';
  workload: number;
}

export interface PlacementStat {
  domain: string;
  placements: number;
}

const MOCK_PROGRAMS: CollegeProgram[] = [
  { id: 'p-1', name: 'Full Stack Web Development', studentsEnrolled: 120, status: 'Active' },
  { id: 'p-2', name: 'Data Structures & Algorithms', studentsEnrolled: 95, status: 'Active' },
  { id: 'p-3', name: 'Cyber Security Basics', studentsEnrolled: 60, status: 'Upcoming' },
];

const MOCK_FACULTY: FacultyMember[] = [
  { id: 'f-1', name: 'Ananya Rao', role: 'Trainer', workload: 4 },
  { id: 'f-2', name: 'Vikram Nair', role: 'Trainer', workload: 3 },
  { id: 'f-3', name: 'Rohit Verma', role: 'Mentor', workload: 6 },
];

const MOCK_PLACEMENTS: PlacementStat[] = [
  { domain: 'Full Stack', placements: 28 },
  { domain: 'UI/UX', placements: 14 },
  { domain: 'Backend', placements: 19 },
  { domain: 'Data', placements: 9 },
];

export function useCollegePrograms() {
  return useQuery({
    queryKey: ['college', 'programs'],
    queryFn: () => Promise.resolve(MOCK_PROGRAMS),
  });
}
export function useCollegeFaculty() {
  return useQuery({
    queryKey: ['college', 'faculty'],
    queryFn: () => Promise.resolve(MOCK_FACULTY),
  });
}
export function useCollegePlacements() {
  return useQuery({
    queryKey: ['college', 'placements'],
    queryFn: () => Promise.resolve(MOCK_PLACEMENTS),
  });
}

import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — built from wireframes.md §6.

export interface SponsorEvent {
  id: string;
  title: string;
  college: string;
  dateLabel: string;
}

export interface PartnerCollege {
  id: string;
  name: string;
  studentCount: number;
  activePhase: string;
}

const MOCK_EVENTS: SponsorEvent[] = [
  {
    id: 'sev-1',
    title: 'Hackathon Kickoff 2026',
    college: 'Forge Institute of Technology',
    dateLabel: '5 Jun 2026',
  },
  {
    id: 'sev-2',
    title: 'Demo Day — Cohort 4',
    college: 'Riverside College of Engineering',
    dateLabel: '20 Jun 2026',
  },
];

const MOCK_COLLEGES: PartnerCollege[] = [
  { id: 'col-1', name: 'Forge Institute of Technology', studentCount: 420, activePhase: 'Citadel' },
  {
    id: 'col-2',
    name: 'Riverside College of Engineering',
    studentCount: 310,
    activePhase: 'Bootcamp',
  },
  { id: 'col-3', name: 'Northgate University', studentCount: 275, activePhase: 'Activation' },
];

export function useSponsorEvents() {
  return useQuery({ queryKey: ['sponsor', 'events'], queryFn: () => Promise.resolve(MOCK_EVENTS) });
}
export function usePartnerColleges() {
  return useQuery({
    queryKey: ['sponsor', 'colleges'],
    queryFn: () => Promise.resolve(MOCK_COLLEGES),
  });
}

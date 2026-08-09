import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — built from wireframes.md §9.

export interface MediaEvent {
  id: string;
  title: string;
  dateLabel: string;
  accessStatus: 'none' | 'requested' | 'granted';
}

export interface AccessRequestHistory {
  id: string;
  itemTitle: string;
  requestedLabel: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

const MOCK_EVENTS: MediaEvent[] = [
  { id: 'me-1', title: 'Hackathon Kickoff 2026', dateLabel: '5 Jun 2026', accessStatus: 'granted' },
  { id: 'me-2', title: 'Demo Day — Cohort 4', dateLabel: '20 Jun 2026', accessStatus: 'none' },
];

const MOCK_HISTORY: AccessRequestHistory[] = [
  { id: 'h-1', itemTitle: 'Citadel 2.0 Summit', requestedLabel: '3 days ago', status: 'Approved' },
  {
    id: 'h-2',
    itemTitle: 'Mentor Panel Discussion',
    requestedLabel: '1 week ago',
    status: 'Denied',
  },
];

export function useMediaEvents() {
  return useQuery({ queryKey: ['media', 'events'], queryFn: () => Promise.resolve(MOCK_EVENTS) });
}
export function useAccessHistory() {
  return useQuery({ queryKey: ['media', 'history'], queryFn: () => Promise.resolve(MOCK_HISTORY) });
}

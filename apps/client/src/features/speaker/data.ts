import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — built from wireframes.md §4 (no visual reference exists
// for this role).

export type SpeakerSessionStatus = 'Upcoming' | 'Past';

export interface SpeakerSession {
  id: string;
  title: string;
  dateLabel: string;
  venue: string;
  status: SpeakerSessionStatus;
  agenda: string[];
  feedbackAverage?: number;
  feedbackCount?: number;
}

export interface HrContact {
  id: string;
  companyName: string;
  contactName: string;
}

const MOCK_SESSIONS: SpeakerSession[] = [
  {
    id: 'sp-1',
    title: 'Building Scalable APIs',
    dateLabel: '2 Jun 2026 · 3:00 PM',
    venue: 'Auditorium, Main Block',
    status: 'Upcoming',
    agenda: ['API design principles', 'Live Q&A', 'Career advice'],
  },
  {
    id: 'sp-2',
    title: 'Design Systems in Practice',
    dateLabel: '18 May 2026 · 2:00 PM',
    venue: 'Seminar Hall',
    status: 'Past',
    agenda: ['Design tokens', 'Component libraries'],
    feedbackAverage: 4.7,
    feedbackCount: 42,
  },
];

const MOCK_HR_CONTACTS: HrContact[] = [
  { id: 'hr-1', companyName: 'TechNova', contactName: 'Meera Iyer' },
  { id: 'hr-2', companyName: 'Acme Corp', contactName: 'Sanjay Rao' },
];

export function useSpeakerSessions() {
  return useQuery({
    queryKey: ['speaker', 'sessions'],
    queryFn: () => Promise.resolve(MOCK_SESSIONS),
  });
}
export function useHrContacts() {
  return useQuery({
    queryKey: ['speaker', 'hr-contacts'],
    queryFn: () => Promise.resolve(MOCK_HR_CONTACTS),
  });
}

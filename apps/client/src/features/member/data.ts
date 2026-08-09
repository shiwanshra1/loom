import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — built from wireframes.md §10. Lightweight by design —
// Member is the broadest, lowest-privilege role.

export interface MemberFeedPost {
  id: string;
  author: string;
  content: string;
  timeLabel: string;
}

export interface MemberEvent {
  id: string;
  title: string;
  dateLabel: string;
  registered: boolean;
}

const MOCK_FEED: MemberFeedPost[] = [
  {
    id: 'mf-1',
    author: 'Forge Loom',
    content: 'Registrations for Hackathon Kickoff 2026 are now open!',
    timeLabel: '3h ago',
  },
  {
    id: 'mf-2',
    author: 'Design Club',
    content: 'Join our UI/UX workshop this weekend.',
    timeLabel: '1d ago',
  },
];

const MOCK_EVENTS: MemberEvent[] = [
  { id: 'me-1', title: 'Hackathon Kickoff 2026', dateLabel: '5 Jun 2026', registered: false },
  { id: 'me-2', title: 'UI/UX Workshop', dateLabel: '2 Jun 2026', registered: true },
];

export function useMemberFeed() {
  return useQuery({ queryKey: ['member', 'feed'], queryFn: () => Promise.resolve(MOCK_FEED) });
}
export function useMemberEvents() {
  return useQuery({ queryKey: ['member', 'events'], queryFn: () => Promise.resolve(MOCK_EVENTS) });
}

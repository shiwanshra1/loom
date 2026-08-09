import { useQuery } from '@tanstack/react-query';

// Mock/placeholder — built from wireframes.md §8.

export type CommunityMemberRole = 'Lead' | 'Volunteer' | 'Public';

export interface CommunityMember {
  id: string;
  name: string;
  role: CommunityMemberRole;
}

export interface FeedPost {
  id: string;
  author: string;
  content: string;
  timeLabel: string;
}

const MOCK_MEMBERS: CommunityMember[] = [
  { id: 'm-1', name: 'Divya Menon', role: 'Lead' },
  { id: 'm-2', name: 'Arjun Nair', role: 'Volunteer' },
  { id: 'm-3', name: 'Sara Fernandes', role: 'Volunteer' },
  { id: 'm-4', name: 'Karan Bhatt', role: 'Public' },
];

const MOCK_FEED: FeedPost[] = [
  {
    id: 'f-1',
    author: 'Divya Menon',
    content: 'Excited to announce our next Hackathon — registrations open now!',
    timeLabel: '2h ago',
  },
  {
    id: 'f-2',
    author: 'Arjun Nair',
    content: 'Great turnout at yesterday’s workshop, thanks everyone!',
    timeLabel: '1d ago',
  },
];

export function useCommunityMembers() {
  return useQuery({
    queryKey: ['community', 'members'],
    queryFn: () => Promise.resolve(MOCK_MEMBERS),
  });
}
export function useCommunityFeed() {
  return useQuery({ queryKey: ['community', 'feed'], queryFn: () => Promise.resolve(MOCK_FEED) });
}

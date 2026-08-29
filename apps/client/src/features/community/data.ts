import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CommunityMemberDto,
  CommunityMemberRole as ServerCommunityMemberRole,
  CommunityPostDto,
  EventDto,
  EventType,
} from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

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

const ROLE_TO_CLIENT: Record<ServerCommunityMemberRole, CommunityMemberRole> = {
  lead: 'Lead',
  volunteer: 'Volunteer',
  public: 'Public',
};
const ROLE_TO_SERVER: Record<CommunityMemberRole, ServerCommunityMemberRole> = {
  Lead: 'lead',
  Volunteer: 'volunteer',
  Public: 'public',
};

function timeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function useCommunityMembers() {
  return useQuery({
    queryKey: ['community', 'members'],
    queryFn: () =>
      apiRequest<{ members: CommunityMemberDto[] }>('/api/community-members').then((r) =>
        r.members.map((m): CommunityMember => ({
          id: m.userId,
          name: m.email,
          role: ROLE_TO_CLIENT[m.role],
        }))
      ),
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: CommunityMemberRole }) =>
      apiRequest('/api/community-members', {
        method: 'POST',
        body: { email: input.email, role: ROLE_TO_SERVER[input.role] },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'members'] });
    },
  });
}

export function useCommunityFeed() {
  return useQuery({
    queryKey: ['community', 'feed'],
    queryFn: () =>
      apiRequest<{ posts: CommunityPostDto[] }>('/api/community/feed').then((r) =>
        r.posts.map((p): FeedPost => ({
          id: p.id,
          author: p.authorEmail,
          content: p.content,
          timeLabel: timeLabel(p.createdAt),
        }))
      ),
  });
}

export function useHostEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; type: EventType; scheduledAt: string }) =>
      apiRequest<{ event: EventDto }>('/api/events', {
        method: 'POST',
        body: { title: input.title, type: input.type, scheduledAt: input.scheduledAt },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

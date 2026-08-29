import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommunityPostDto, EventDto } from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

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

function timeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function useMemberFeed() {
  return useQuery({
    queryKey: ['member', 'feed'],
    queryFn: () =>
      apiRequest<{ posts: CommunityPostDto[] }>('/api/community/feed').then((r) =>
        r.posts.map((p): MemberFeedPost => ({
          id: p.id,
          author: p.authorEmail,
          content: p.content,
          timeLabel: timeLabel(p.createdAt),
        }))
      ),
  });
}

export function useMemberEvents() {
  return useQuery({
    queryKey: ['member', 'events'],
    queryFn: () =>
      apiRequest<{ events: EventDto[] }>('/api/events').then((r) =>
        r.events.map((e): MemberEvent => ({
          id: e.id,
          title: e.title,
          dateLabel: new Date(e.scheduledAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          registered: e.isRegistered,
        }))
      ),
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      apiRequest(`/api/events/${eventId}/register`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['member', 'events'] });
    },
  });
}

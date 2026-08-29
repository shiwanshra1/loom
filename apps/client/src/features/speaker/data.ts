import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HrDirectoryEntryDto, SpeakerTopicDto } from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

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

function toSession(topic: SpeakerTopicDto): SpeakerSession {
  const isPast =
    topic.status === 'booked' &&
    !!topic.scheduledAt &&
    new Date(topic.scheduledAt).getTime() < Date.now();
  return {
    id: topic.id,
    title: topic.title,
    dateLabel: topic.scheduledAt
      ? new Date(topic.scheduledAt).toLocaleString(undefined, {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'Not yet scheduled',
    venue: topic.venue ?? 'TBD',
    status: isPast ? 'Past' : 'Upcoming',
    agenda: topic.description ? [topic.description] : [],
  };
}

export function useSpeakerSessions() {
  return useQuery({
    queryKey: ['speaker', 'sessions'],
    queryFn: () =>
      apiRequest<{ topics: SpeakerTopicDto[] }>('/api/speaker-topics/mine').then((r) =>
        r.topics.map(toSession)
      ),
  });
}

export function usePostTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string }) =>
      apiRequest('/api/speaker-topics', { method: 'POST', body: { title: input.title } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['speaker', 'sessions'] });
    },
  });
}

export function useHrContacts() {
  return useQuery({
    queryKey: ['speaker', 'hr-contacts'],
    queryFn: () =>
      apiRequest<{ entries: HrDirectoryEntryDto[] }>('/api/hr-profile/directory').then((r) =>
        r.entries.map((entry, index): HrContact => ({
          id: `${entry.contactEmail}-${index}`,
          companyName: entry.companyName,
          contactName: entry.contactEmail,
        }))
      ),
  });
}

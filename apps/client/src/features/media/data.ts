import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccessRequestDto, EventDto } from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

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

const STATUS_LABEL: Record<AccessRequestDto['status'], AccessRequestHistory['status']> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function useMediaEvents() {
  return useQuery({
    queryKey: ['media', 'events'],
    queryFn: async () => {
      const [{ events }, { requests }] = await Promise.all([
        apiRequest<{ events: EventDto[] }>('/api/events'),
        apiRequest<{ requests: AccessRequestDto[] }>('/api/access-requests/mine'),
      ]);
      const statusByEventId = new Map(requests.map((r) => [r.eventId, r.status]));

      return events.map((e): MediaEvent => {
        const requestStatus = statusByEventId.get(e.id);
        return {
          id: e.id,
          title: e.title,
          dateLabel: dateLabel(e.scheduledAt),
          accessStatus:
            requestStatus === 'approved' ? 'granted' : requestStatus ? 'requested' : 'none',
        };
      });
    },
  });
}

export function useRequestAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      apiRequest(`/api/access-requests/events/${eventId}`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['media', 'events'] });
      void queryClient.invalidateQueries({ queryKey: ['media', 'history'] });
    },
  });
}

export function useAccessHistory() {
  return useQuery({
    queryKey: ['media', 'history'],
    queryFn: () =>
      apiRequest<{ requests: AccessRequestDto[] }>('/api/access-requests/mine').then((r) =>
        r.requests.map((req): AccessRequestHistory => ({
          id: req.id,
          itemTitle: req.eventTitle,
          requestedLabel: dateLabel(req.requestedAt),
          status: STATUS_LABEL[req.status],
        }))
      ),
  });
}

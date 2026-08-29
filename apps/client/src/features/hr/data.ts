import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EventDto, HrCompanyProfileDto, TalentSearchPageDto } from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

export type HrCompanyProfile = HrCompanyProfileDto;

export interface HrUpcomingEvent {
  id: string;
  title: string;
  dateLabel: string;
}

export interface TalentSearchFilters {
  query?: string;
  domain?: string;
  minScore?: number;
}

export function useHrCompanyProfile() {
  return useQuery({
    queryKey: ['hr', 'company-profile'],
    queryFn: () =>
      apiRequest<{ profile: HrCompanyProfileDto }>('/api/hr-profile/mine').then((r) => r.profile),
  });
}

export function useHrUpcomingEvents() {
  return useQuery({
    queryKey: ['hr', 'upcoming-events'],
    queryFn: () =>
      apiRequest<{ events: EventDto[] }>('/api/events').then((r) =>
        r.events
          .filter((e) => e.isRegistered && new Date(e.scheduledAt).getTime() > Date.now())
          .map((e): HrUpcomingEvent => ({
            id: e.id,
            title: e.title,
            dateLabel: new Date(e.scheduledAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
          }))
      ),
  });
}

const TALENT_PAGE_SIZE = 6;

export function useTalentPool(filters: TalentSearchFilters) {
  return useInfiniteQuery({
    queryKey: ['hr', 'talent-pool', filters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(TALENT_PAGE_SIZE) });
      if (filters.query) params.set('query', filters.query);
      if (filters.domain && filters.domain !== 'all') params.set('domain', filters.domain);
      if (filters.minScore) params.set('minScore', String(filters.minScore));
      if (pageParam) params.set('cursor', pageParam);
      return apiRequest<TalentSearchPageDto>(`/api/talent-pool?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description: string }) =>
      apiRequest('/api/problem-statements', {
        method: 'POST',
        body: {
          title: input.title,
          description: input.description,
          source: 'industry',
          domain: 'General',
          teamSize: 1,
          durationWeeks: 4,
          difficulty: 'medium',
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student', 'problem-statements'] });
    },
  });
}

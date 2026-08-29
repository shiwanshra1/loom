import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BookingDto, EventDto, PartnerCollegeDto } from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';

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
  contactEmail: string | null;
}

const PHASE_LABEL: Record<string, string> = {
  activation: 'Activation',
  bootcamp: 'Bootcamp',
  citadel: 'Citadel',
};

export function useSponsorEvents() {
  return useQuery({
    queryKey: ['sponsor', 'events'],
    queryFn: () =>
      apiRequest<{ events: EventDto[] }>('/api/events').then((r) =>
        r.events.map((e): SponsorEvent => ({
          id: e.id,
          title: e.title,
          college: e.collegeName ?? 'Unaffiliated',
          dateLabel: new Date(e.scheduledAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        }))
      ),
  });
}

export function usePartnerColleges() {
  return useQuery({
    queryKey: ['sponsor', 'colleges'],
    queryFn: () =>
      apiRequest<{ colleges: PartnerCollegeDto[] }>('/api/colleges/partners').then((r) =>
        r.colleges.map((c): PartnerCollege => ({
          id: c.id,
          name: c.name,
          studentCount: c.studentCount,
          activePhase: c.activePhase
            ? (PHASE_LABEL[c.activePhase] ?? c.activePhase)
            : 'Not started',
          contactEmail: c.contactEmail,
        }))
      ),
  });
}

export function useBookMeet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { contactEmail: string; title: string; scheduledAt: string }) =>
      apiRequest<{ booking: BookingDto }>('/api/bookings', {
        method: 'POST',
        body: {
          counterpartEmail: input.contactEmail,
          title: input.title,
          scheduledAt: input.scheduledAt,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sponsor', 'bookings'] });
    },
  });
}

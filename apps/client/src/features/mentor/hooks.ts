import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BookingDto,
  NotificationDto,
  TeamDto,
  TeamSprintsDto,
} from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';
import {
  MOCK_ASSIGNED_STUDENTS,
  MOCK_AT_RISK_STUDENTS,
  MOCK_MENTEE_VIEW_STATS,
  MOCK_PROGRESS_SNAPSHOT,
  MOCK_STUDENT_PROFILES,
  MOCK_TEAM_VIEW_STATS,
} from './mockData';
import type {
  MentorSession,
  TeamDetail,
  TeamSummary,
  TodaySession,
  UpcomingSessionHighlight,
} from './types';

// Thin useQuery wrappers around static mock data — same pattern as the
// Student feature. Swapping to the real API later means changing each
// queryFn, not the pages that consume these hooks. `useMentorTeams` and
// `useTeamDetails` below are the ones already swapped over, by Phase 7.

const SPRINT_PHASE_LABELS = [
  'Ideation & Research',
  'Development & Prototyping',
  'Testing & Integration',
];

const TEAMS_WITH_DETAILS_KEY = ['mentor', 'teams-with-details'];

interface MentorTeamRow {
  team: TeamDto;
  view: TeamSprintsDto;
}

async function fetchMentorTeamsWithDetails(): Promise<MentorTeamRow[]> {
  const { teams } = await apiRequest<{ teams: TeamDto[] }>('/api/teams');
  const views = await Promise.all(
    teams.map((team) => apiRequest<TeamSprintsDto>(`/api/teams/${team.id}/sprints`))
  );
  return teams.map((team, index) => ({ team, view: views[index]! }));
}

function averageProgress(view: TeamSprintsDto): number {
  return view.sprints.length > 0
    ? Math.round(
        view.sprints.reduce((sum, sprint) => sum + sprint.progressPercent, 0) / view.sprints.length
      )
    : 0;
}

export function useMentorTeamStats() {
  return useQuery({
    queryKey: ['mentor', 'team-stats'],
    queryFn: () => Promise.resolve(MOCK_TEAM_VIEW_STATS),
  });
}

export function useMentorMenteeStats() {
  return useQuery({
    queryKey: ['mentor', 'mentee-stats'],
    queryFn: () => Promise.resolve(MOCK_MENTEE_VIEW_STATS),
  });
}

const MENTOR_BOOKINGS_KEY = ['mentor', 'bookings'];

// No team-to-session link exists on a booking (it's a plain 1:1 with a
// student) — the requester's email stands in for "team" the same way an
// email stands in for a display name elsewhere, disclosed.
async function fetchMentorBookings(): Promise<BookingDto[]> {
  const { bookings } = await apiRequest<{ bookings: BookingDto[] }>('/api/bookings/mine');
  return bookings.filter((b) => b.status !== 'cancelled');
}

function toMentorSideSession(booking: BookingDto): MentorSession {
  const start = new Date(booking.scheduledAt);
  return {
    id: booking.id,
    title: booking.title,
    team: booking.requesterEmail,
    dayLabel: start.getDate().toString().padStart(2, '0'),
    monthLabel: start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    dateLabel: start.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    timeLabel: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    mode: booking.mode,
    status: booking.status === 'completed' ? 'Completed' : 'Upcoming',
    agenda: booking.agenda,
  };
}

function startingInLabel(scheduledAt: string): string {
  const diffMs = new Date(scheduledAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Now';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `In ${hours}h ${minutes}m` : `In ${minutes}m`;
}

export function useTodaySessions() {
  return useQuery({
    queryKey: MENTOR_BOOKINGS_KEY,
    queryFn: fetchMentorBookings,
    select: (bookings): TodaySession[] => {
      const today = new Date().toDateString();
      return bookings
        .filter((b) => b.status === 'upcoming' && new Date(b.scheduledAt).toDateString() === today)
        .map((b) => ({
          id: b.id,
          title: b.title,
          team: b.requesterEmail,
          timeLabel: new Date(b.scheduledAt).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          }),
          mode: b.mode,
          startingInLabel: startingInLabel(b.scheduledAt),
        }));
    },
  });
}

export function useMentorTeams() {
  return useQuery({
    queryKey: TEAMS_WITH_DETAILS_KEY,
    queryFn: fetchMentorTeamsWithDetails,
    select: (rows): TeamSummary[] =>
      rows.map(({ team, view }) => ({
        id: team.id,
        name: team.name,
        letter: team.name.charAt(0).toUpperCase(),
        memberCount: team.members.length,
        progressPercent: averageProgress(view),
      })),
  });
}

export function useAtRiskStudents() {
  return useQuery({
    queryKey: ['mentor', 'at-risk'],
    queryFn: () => Promise.resolve(MOCK_AT_RISK_STUDENTS),
  });
}

export function useProgressSnapshot() {
  return useQuery({
    queryKey: ['mentor', 'progress-snapshot'],
    queryFn: () => Promise.resolve(MOCK_PROGRESS_SNAPSHOT),
  });
}

function formatNotificationTimeLabel(iso: string): string {
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return isToday ? `Today, ${time}` : `${date.toLocaleDateString()}, ${time}`;
}

export function useMentorNotifications() {
  return useQuery({
    queryKey: ['notifications', 'mine'],
    queryFn: () =>
      apiRequest<{ notifications: NotificationDto[] }>('/api/notifications/mine').then((r) =>
        r.notifications.map((n) => ({
          id: n.id,
          title: n.title,
          timeLabel: formatNotificationTimeLabel(n.createdAt),
        }))
      ),
  });
}

export function useUpcomingSessionHighlight() {
  return useQuery({
    queryKey: MENTOR_BOOKINGS_KEY,
    queryFn: fetchMentorBookings,
    select: (bookings): UpcomingSessionHighlight | null => {
      const next = bookings
        .filter((b) => b.status === 'upcoming' && new Date(b.scheduledAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
      if (!next) return null;
      const start = new Date(next.scheduledAt);
      return {
        title: next.title,
        team: next.requesterEmail,
        dateLabel: start.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        timeLabel: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        mode: next.mode,
        startingInLabel: startingInLabel(next.scheduledAt),
      };
    },
  });
}

export function useAssignedStudents() {
  return useQuery({
    queryKey: ['mentor', 'assigned-students'],
    queryFn: () => Promise.resolve(MOCK_ASSIGNED_STUDENTS),
  });
}

export function useStudentProfiles() {
  return useQuery({
    queryKey: ['mentor', 'student-profiles'],
    queryFn: () => Promise.resolve(MOCK_STUDENT_PROFILES),
  });
}

export function useTeamDetails() {
  return useQuery({
    queryKey: TEAMS_WITH_DETAILS_KEY,
    queryFn: fetchMentorTeamsWithDetails,
    select: (rows): Record<string, TeamDetail> => {
      const result: Record<string, TeamDetail> = {};
      for (const { team, view } of rows) {
        const current = view.sprints.find(
          (sprint) =>
            sprint.status === 'in_progress' ||
            sprint.status === 'submitted' ||
            sprint.status === 'reviewed'
        );
        result[team.id] = {
          id: team.id,
          name: team.name,
          letter: team.name.charAt(0).toUpperCase(),
          progressPercent: averageProgress(view),
          trainerName: view.team.trainerEmail ?? 'Unassigned',
          problemStatementTitle:
            view.team.problemStatementTitle ?? 'No problem statement assigned yet',
          currentSprint: current
            ? `Sprint Cycle ${current.cycleNumber} — ${SPRINT_PHASE_LABELS[current.cycleNumber - 1] ?? ''}`
            : 'All sprints complete',
          currentSprintId: current?.id ?? null,
          currentSprintStatus: (current?.status as TeamDetail['currentSprintStatus']) ?? null,
          members: team.members.map((member) => ({ name: member.name, role: 'Member' })),
        };
      }
      return result;
    },
  });
}

export function useAddSprintFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sprintId,
      comment,
      rating,
    }: {
      sprintId: string;
      comment: string;
      rating?: number;
    }) =>
      apiRequest(`/api/sprints/${sprintId}/feedback`, {
        method: 'POST',
        body: { comment, rating },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_WITH_DETAILS_KEY });
    },
  });
}

export function useCompleteSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) =>
      apiRequest(`/api/sprints/${sprintId}/complete`, { method: 'PATCH' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_WITH_DETAILS_KEY });
    },
  });
}

export function useMentorSessions() {
  return useQuery({
    queryKey: MENTOR_BOOKINGS_KEY,
    queryFn: fetchMentorBookings,
    select: (bookings) => bookings.map(toMentorSideSession),
  });
}

export function useScheduleSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { studentEmail: string; title: string; scheduledAt: string }) =>
      apiRequest<{ booking: BookingDto }>('/api/bookings', {
        method: 'POST',
        body: {
          counterpartEmail: input.studentEmail,
          title: input.title,
          scheduledAt: input.scheduledAt,
        },
      }).then((r) => r.booking),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MENTOR_BOOKINGS_KEY });
    },
  });
}

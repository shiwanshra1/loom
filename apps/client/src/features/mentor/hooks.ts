import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TeamDto, TeamSprintsDto } from '@forge-loom/shared-types';
import { apiRequest } from '../../lib/apiClient';
import {
  MOCK_ASSIGNED_STUDENTS,
  MOCK_AT_RISK_STUDENTS,
  MOCK_MENTEE_VIEW_STATS,
  MOCK_MENTOR_SESSIONS,
  MOCK_NOTIFICATIONS,
  MOCK_PROGRESS_SNAPSHOT,
  MOCK_STUDENT_PROFILES,
  MOCK_TEAM_VIEW_STATS,
  MOCK_TODAY_SESSIONS,
  MOCK_UPCOMING_SESSION_HIGHLIGHT,
} from './mockData';
import type { TeamDetail, TeamSummary } from './types';

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

export function useTodaySessions() {
  return useQuery({
    queryKey: ['mentor', 'today-sessions'],
    queryFn: () => Promise.resolve(MOCK_TODAY_SESSIONS),
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

export function useMentorNotifications() {
  return useQuery({
    queryKey: ['mentor', 'notifications'],
    queryFn: () => Promise.resolve(MOCK_NOTIFICATIONS),
  });
}

export function useUpcomingSessionHighlight() {
  return useQuery({
    queryKey: ['mentor', 'upcoming-session-highlight'],
    queryFn: () => Promise.resolve(MOCK_UPCOMING_SESSION_HIGHLIGHT),
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
    queryKey: ['mentor', 'sessions'],
    queryFn: () => Promise.resolve(MOCK_MENTOR_SESSIONS),
  });
}

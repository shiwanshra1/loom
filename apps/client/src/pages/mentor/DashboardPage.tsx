import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  ClipboardList,
  FileUp,
  Megaphone,
  Star,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  useAtRiskStudents,
  useMentorMenteeStats,
  useMentorNotifications,
  useMentorTeamStats,
  useMentorTeams,
  useProgressSnapshot,
  useTodaySessions,
  useUpcomingSessionHighlight,
} from '../../features/mentor/hooks';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ProgressDonut } from '../../components/ui/ProgressDonut';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/PageLoading';

type ViewMode = 'team' | 'mentee';

export function DashboardPage() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>('team');

  const { data: teamStats, isLoading: teamStatsLoading } = useMentorTeamStats();
  const { data: menteeStats, isLoading: menteeStatsLoading } = useMentorMenteeStats();
  const { data: todaySessions, isLoading: sessionsLoading } = useTodaySessions();
  const { data: teams, isLoading: teamsLoading } = useMentorTeams();
  const { data: atRisk, isLoading: atRiskLoading } = useAtRiskStudents();
  const { data: snapshot, isLoading: snapshotLoading } = useProgressSnapshot();
  const { data: notifications, isLoading: notificationsLoading } = useMentorNotifications();
  const { data: highlight, isLoading: highlightLoading } = useUpcomingSessionHighlight();

  if (
    teamStatsLoading ||
    menteeStatsLoading ||
    sessionsLoading ||
    teamsLoading ||
    atRiskLoading ||
    snapshotLoading ||
    notificationsLoading ||
    highlightLoading
  ) {
    return <PageLoading />;
  }

  const firstName = user?.email.split('@')[0] ?? 'there';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Welcome back, {firstName} 👋</h1>
          <p className="text-sm text-slate-500">
            {view === 'team'
              ? "Here's what's happening with your students today."
              : 'Guide. Support. Build the future.'}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView('team')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'team' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Team View
          </button>
          <button
            type="button"
            onClick={() => setView('mentee')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'mentee' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mentee View
          </button>
        </div>
      </div>

      {view === 'team' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={Users}
                label="Students Assigned"
                value={String(teamStats?.studentsAssigned ?? 0)}
              />
              <StatCard
                icon={Users}
                label="Teams Mentoring"
                value={String(teamStats?.teamsMentoring ?? 0)}
                iconClassName="bg-green-50 text-green-600"
              />
              <StatCard
                icon={CalendarClock}
                label="Sessions Today"
                value={String(teamStats?.sessionsToday ?? 0)}
                iconClassName="bg-purple-50 text-purple-600"
              />
              <StatCard
                icon={ClipboardList}
                label="Pending Assignments"
                value={String(teamStats?.pendingAssignments ?? 0)}
                iconClassName="bg-orange-50 text-orange-600"
              />
            </div>

            <Card>
              <h2 className="mb-4 font-semibold text-slate-900">Today's Sessions</h2>
              <div className="flex flex-col divide-y divide-slate-100">
                {todaySessions?.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{session.title}</p>
                      <p className="text-xs text-slate-500">{session.team}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-700">{session.timeLabel}</p>
                      <p className="text-xs text-slate-400">{session.startingInLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">My Teams</h2>
                <Link
                  to="/mentor/teams"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {teams?.map((team) => (
                  <Link
                    key={team.id}
                    to="/mentor/teams"
                    className="rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700">
                        {team.letter}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{team.name}</p>
                        <p className="text-xs text-slate-500">{team.memberCount} Students</p>
                      </div>
                    </div>
                    <ProgressBar percent={team.progressPercent} />
                    <p className="mt-1 text-right text-xs text-slate-500">
                      {team.progressPercent}%
                    </p>
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 font-semibold text-slate-900">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Link to="/mentor/sessions">
                  <Button variant="secondary" className="w-full flex-col gap-1 py-3">
                    <CalendarClock size={18} />
                    Schedule Session
                  </Button>
                </Link>
                <Button variant="secondary" className="w-full flex-col gap-1 py-3" disabled>
                  <Video size={18} />
                  Book a Room
                </Button>
                <Button variant="secondary" className="w-full flex-col gap-1 py-3" disabled>
                  <Megaphone size={18} />
                  Announcement
                </Button>
                <Button variant="secondary" className="w-full flex-col gap-1 py-3" disabled>
                  <FileUp size={18} />
                  Upload Resource
                </Button>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Students Requiring Attention</h2>
                <Link
                  to="/mentor/students"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="flex flex-col divide-y divide-slate-100">
                {atRisk?.map((student) => (
                  <Link
                    key={student.id}
                    to="/mentor/students"
                    className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {student.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-500">
                          {student.team} · {student.subject}
                        </p>
                      </div>
                    </div>
                    <Badge tone="red">{student.overdueCount} Overdue</Badge>
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 font-semibold text-slate-900">Progress Snapshot</h2>
              <div className="flex items-center gap-4">
                <ProgressDonut percent={snapshot?.onTrackPercent ?? 0} />
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-blue-600" /> On Track
                    </span>
                    <span className="font-medium text-slate-900">{snapshot?.onTrackPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-orange-500" /> At Risk
                    </span>
                    <span className="font-medium text-slate-900">{snapshot?.atRiskPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-slate-300" /> Not Started
                    </span>
                    <span className="font-medium text-slate-900">
                      {snapshot?.notStartedPercent}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                <Bell size={16} /> Recent Notifications
              </h2>
              <div className="flex flex-col divide-y divide-slate-100">
                {notifications?.map((note) => (
                  <div key={note.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm text-slate-800">{note.title}</p>
                    <p className="text-xs text-slate-400">{note.timeLabel}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={Users}
                label="Active Mentees"
                value={String(menteeStats?.activeMentees ?? 0)}
              />
              <StatCard
                icon={CalendarClock}
                label="Upcoming Sessions"
                value={String(menteeStats?.upcomingSessions ?? 0)}
                iconClassName="bg-purple-50 text-purple-600"
              />
              <StatCard
                icon={ClipboardList}
                label="Sessions Completed"
                value={String(menteeStats?.sessionsCompleted ?? 0)}
                iconClassName="bg-green-50 text-green-600"
              />
              <StatCard
                icon={Star}
                label="Average Rating"
                value={String(menteeStats?.averageRating ?? 0)}
                iconClassName="bg-amber-50 text-amber-600"
              />
            </div>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">My Mentees</h2>
                <Link
                  to="/mentor/teams"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="flex flex-col divide-y divide-slate-100">
                {teams?.map((team) => (
                  <Link
                    key={team.id}
                    to="/mentor/teams"
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700">
                      {team.letter}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{team.name}</p>
                      <p className="text-xs text-slate-500">{team.memberCount} Mentees</p>
                    </div>
                    <div className="w-32">
                      <ProgressBar percent={team.progressPercent} />
                    </div>
                    <span className="w-10 text-right text-xs text-slate-500">
                      {team.progressPercent}%
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <Badge tone="blue">Upcoming Session</Badge>
              <h2 className="mt-2 font-semibold text-slate-900">{highlight?.title}</h2>
              <p className="text-sm text-slate-500">{highlight?.team}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <CalendarClock size={14} /> {highlight?.dateLabel} · {highlight?.timeLabel}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Video size={14} /> {highlight?.mode}
              </div>
              <Badge tone="amber">{highlight?.startingInLabel}</Badge>
              <Link to="/mentor/sessions">
                <Button className="mt-4 w-full">View Full Schedule</Button>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900 to-blue-900 text-center text-white">
              <blockquote className="text-sm text-blue-100">
                "Great mentorship is not about having all the answers, it's about asking the right
                questions."
              </blockquote>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

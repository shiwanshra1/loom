import { useState } from 'react';
import { Building2, Rocket, Search, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import {
  nextPhase,
  useAdminCohorts,
  useAdminUsers,
  useAdvanceCohortPhase,
  useAnalytics,
  useNationalStats,
  useUpdateUserStatus,
} from '../../features/admin/data';
import type { AdminCohort } from '../../features/admin/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';
import { SimpleLineChart } from '../../components/charts/SimpleLineChart';

const STATUS_BADGE = {
  active: { tone: 'green' as const, label: 'Active' },
  pending_verification: { tone: 'amber' as const, label: 'Pending' },
  suspended: { tone: 'red' as const, label: 'Suspended' },
};

const PHASE_BADGE: Record<AdminCohort['phase'], 'slate' | 'blue' | 'purple'> = {
  Activation: 'slate',
  Bootcamp: 'blue',
  Citadel: 'purple',
};

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useNationalStats();
  const { data: userList, isLoading: usersLoading } = useAdminUsers();
  const { data: cohortList, isLoading: cohortsLoading } = useAdminCohorts();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const updateUserStatus = useUpdateUserStatus();
  const advanceCohortPhase = useAdvanceCohortPhase();

  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim().toLowerCase();
  const filteredUsers = trimmedQuery
    ? (userList ?? []).filter(
        (u) =>
          u.name.toLowerCase().includes(trimmedQuery) ||
          u.email.toLowerCase().includes(trimmedQuery) ||
          u.role.includes(trimmedQuery)
      )
    : (userList ?? []);

  if (statsLoading || usersLoading || cohortsLoading || analyticsLoading) {
    return <PageLoading />;
  }

  function toggleSuspend(id: string, currentStatus: string) {
    updateUserStatus.mutate({ id, status: currentStatus === 'suspended' ? 'active' : 'suspended' });
  }

  function advanceCohort(id: string, currentPhase: AdminCohort['phase']) {
    advanceCohortPhase.mutate({ id, phase: nextPhase(currentPhase) });
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Forge Admin</h1>
      <p className="mb-6 text-sm text-slate-500">
        Cross-college oversight, user management, and cohort phases.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Building2} label="Colleges" value={String(stats?.totalColleges ?? 0)} />
        <StatCard
          icon={Users}
          label="Total Students"
          value={String(stats?.totalStudents ?? 0)}
          iconClassName="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Rocket}
          label="Ventures Launched"
          value={String(stats?.venturesLaunched ?? 0)}
          iconClassName="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Employability Lift"
          value={
            stats?.employabilityLiftPercent === null ||
            stats?.employabilityLiftPercent === undefined
              ? 'No data yet'
              : `${stats.employabilityLiftPercent}%`
          }
          iconClassName="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">User Management</h2>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or role"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {filteredUsers.map((user) => {
              const badge = STATUS_BADGE[user.status];
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">
                      {user.email} · {user.role} · {user.college}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    <Button variant="secondary" onClick={() => toggleSuspend(user.id, user.status)}>
                      <ShieldCheck size={14} />{' '}
                      {user.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Cohort / Phase Management</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {(cohortList ?? []).map((cohort) => (
              <div
                key={cohort.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{cohort.name}</p>
                  <p className="text-xs text-slate-500">{cohort.college}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={PHASE_BADGE[cohort.phase]}>{cohort.phase}</Badge>
                  <Button
                    variant="secondary"
                    disabled={cohort.phase === 'Citadel'}
                    onClick={() => advanceCohort(cohort.id, cohort.phase)}
                  >
                    Advance
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {analytics && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Citadel Funnel</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={Users}
                label="Interested"
                value={String(analytics.citadelFunnel.interested)}
              />
              <StatCard
                icon={Users}
                label="Teams Formed"
                value={String(analytics.citadelFunnel.teamsFormed)}
                iconClassName="bg-blue-50 text-blue-600"
              />
              <StatCard
                icon={Rocket}
                label="Sprints Completed"
                value={String(analytics.citadelFunnel.sprintsCompleted)}
                iconClassName="bg-purple-50 text-purple-600"
              />
              <StatCard
                icon={TrendingUp}
                label="Investor Access"
                value={String(analytics.citadelFunnel.investorGranted)}
                iconClassName="bg-green-50 text-green-600"
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Course completion rate: {analytics.courseCompletionRatePercent}%
            </p>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Attendance Trend (last 7 days)</h2>
            <SimpleLineChart
              points={analytics.attendanceTrend.map((p) => p.ratePercent)}
              labels={analytics.attendanceTrend.map((p) => p.dateLabel)}
            />
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="mb-4 font-semibold text-slate-900">Builder Score Distribution</h2>
            <SimpleLineChart
              points={analytics.scoreDistribution.map((bucket) => {
                const maxCount = Math.max(1, ...analytics.scoreDistribution.map((b) => b.count));
                return (bucket.count / maxCount) * 100;
              })}
              labels={analytics.scoreDistribution.map(
                (bucket) => `${bucket.label} (${bucket.count})`
              )}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

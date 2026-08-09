import { useState } from 'react';
import { Building2, Rocket, Search, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import {
  nextPhase,
  useAdminCohorts,
  useAdminUsers,
  useNationalStats,
} from '../../features/admin/data';
import type { AdminCohort, AdminUserRow } from '../../features/admin/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

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
  const { data: initialUsers, isLoading: usersLoading } = useAdminUsers();
  const { data: initialCohorts, isLoading: cohortsLoading } = useAdminCohorts();

  const [users, setUsers] = useState<AdminUserRow[] | undefined>(undefined);
  const [cohorts, setCohorts] = useState<AdminCohort[] | undefined>(undefined);
  const [query, setQuery] = useState('');

  const userList = users ?? initialUsers ?? [];
  const cohortList = cohorts ?? initialCohorts ?? [];

  const trimmedQuery = query.trim().toLowerCase();
  const filteredUsers = trimmedQuery
    ? userList.filter(
        (u) =>
          u.name.toLowerCase().includes(trimmedQuery) ||
          u.email.toLowerCase().includes(trimmedQuery) ||
          u.role.includes(trimmedQuery)
      )
    : userList;

  if (statsLoading || usersLoading || cohortsLoading) {
    return <PageLoading />;
  }

  function toggleSuspend(id: string) {
    setUsers(
      userList.map((u) =>
        u.id === id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u
      )
    );
  }

  function advanceCohort(id: string) {
    setCohorts(cohortList.map((c) => (c.id === id ? { ...c, phase: nextPhase(c.phase) } : c)));
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
          value={`${stats?.employabilityLiftPercent ?? 0}%`}
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
                    <Button variant="secondary" onClick={() => toggleSuspend(user.id)}>
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
            {cohortList.map((cohort) => (
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
                    onClick={() => advanceCohort(cohort.id)}
                  >
                    Advance
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

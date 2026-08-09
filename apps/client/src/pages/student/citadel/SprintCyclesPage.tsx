import { useMemo, useState } from 'react';
import { CalendarRange, CheckCircle2, Circle, Loader2, Users } from 'lucide-react';
import { useSprints } from '../../../features/student/hooks';
import type { Sprint, SprintStatus } from '../../../features/student/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ProgressDonut } from '../../../components/ui/ProgressDonut';
import { Tabs } from '../../../components/ui/Tabs';
import { PageLoading } from '../../../components/ui/PageLoading';
import { CitadelSubNav } from './CitadelSubNav';

type TabValue = 'all' | SprintStatus;

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All Sprints' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'upcoming', label: 'Upcoming' },
];

const STATUS_BADGE: Record<SprintStatus, { tone: 'blue' | 'green' | 'slate'; label: string }> = {
  in_progress: { tone: 'blue', label: 'In Progress' },
  completed: { tone: 'green', label: 'Completed' },
  upcoming: { tone: 'slate', label: 'Upcoming' },
};

const TASK_STATUS_ICON = {
  completed: <CheckCircle2 size={16} className="text-green-600" />,
  in_progress: <Loader2 size={16} className="text-blue-600" />,
  pending: <Circle size={16} className="text-slate-300" />,
};

export function SprintCyclesPage() {
  const { data: sprints, isLoading } = useSprints();
  const [tab, setTab] = useState<TabValue>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!sprints) return [];
    return tab === 'all' ? sprints : sprints.filter((s) => s.status === tab);
  }, [sprints, tab]);

  const selected: Sprint | undefined =
    sprints?.find((s) => s.id === selectedId) ??
    sprints?.find((s) => s.status === 'in_progress') ??
    sprints?.[0];

  if (isLoading || !sprints) {
    return <PageLoading />;
  }

  return (
    <div>
      <CitadelSubNav />
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Sprint Cycles</h1>
      <p className="mb-6 text-sm text-slate-500">Plan, execute and complete sprint cycles.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="px-4 pt-2">
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
          </div>
          <div className="flex flex-col divide-y divide-slate-100 p-4">
            {filtered.map((sprint) => {
              const badge = STATUS_BADGE[sprint.status];
              const isSelected = selected?.id === sprint.id;
              return (
                <button
                  key={sprint.id}
                  type="button"
                  onClick={() => setSelectedId(sprint.id)}
                  className={`flex items-center justify-between gap-3 py-4 text-left first:pt-0 last:pb-0 ${
                    isSelected ? 'text-blue-700' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{sprint.title}</p>
                    <p className="text-xs text-slate-500">{sprint.phase}</p>
                    <p className="text-xs text-slate-400">{sprint.dateRangeLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    <span className="text-xs font-medium text-slate-500">
                      {sprint.progressPercent}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {selected && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Badge tone="blue">
                  {selected.status === 'in_progress' ? 'Current Sprint' : selected.title}
                </Badge>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{selected.title}</h2>
                <p className="text-sm text-slate-500">{selected.phase}</p>
              </div>
              <ProgressDonut percent={selected.progressPercent} size={72} strokeWidth={8} />
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3 border-y border-slate-100 py-4 text-center text-sm">
              <div>
                <p className="flex items-center justify-center gap-1 font-semibold text-slate-900">
                  <CalendarRange size={14} /> {selected.dateRangeLabel.split('–')[0]?.trim()}
                </p>
                <p className="text-xs text-slate-500">Duration</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {selected.tasks.filter((t) => t.status === 'completed').length}/
                  {selected.tasks.length}
                </p>
                <p className="text-xs text-slate-500">Tasks Completed</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 font-semibold text-slate-900">
                  <Users size={14} /> {selected.teamMembers}
                </p>
                <p className="text-xs text-slate-500">Team Members</p>
              </div>
            </div>

            <h3 className="mb-3 text-sm font-semibold text-slate-900">Sprint Tasks</h3>
            {selected.tasks.length === 0 && (
              <p className="text-sm text-slate-400">Tasks haven't been set yet.</p>
            )}
            <div className="flex flex-col divide-y divide-slate-100">
              {selected.tasks.map((task) => (
                <div
                  key={task.title}
                  className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    {TASK_STATUS_ICON[task.status]} {task.title}
                  </span>
                  <span className="text-xs text-slate-400">{task.dueLabel}</span>
                </div>
              ))}
            </div>

            {selected.status === 'in_progress' && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                Keep pushing forward! You're on track to complete this sprint.
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

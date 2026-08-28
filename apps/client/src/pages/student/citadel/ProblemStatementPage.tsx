import { useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Circle,
  Star,
  Users,
  Clock,
  BarChart3,
  CircleDot,
} from 'lucide-react';
import {
  useExpressInterest,
  useProblemStatements,
  useToggleBookmark,
} from '../../../features/student/hooks';
import type { ProblemStatement, ProblemStatementTab } from '../../../features/student/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Tabs } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';
import { PageLoading } from '../../../components/ui/PageLoading';
import { CitadelSubNav } from './CitadelSubNav';

const TABS: { value: ProblemStatementTab; label: string }[] = [
  { value: 'all', label: 'All Problems' },
  { value: 'mine', label: 'My Problems' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'completed', label: 'Completed' },
];

function matchesTab(ps: ProblemStatement, tab: ProblemStatementTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'mine') return ps.isMine;
  if (tab === 'shortlisted') return ps.isShortlisted;
  return ps.isCompleted;
}

export function ProblemStatementPage() {
  const { data, isLoading } = useProblemStatements();
  const toggleBookmark = useToggleBookmark();
  const expressInterest = useExpressInterest();
  const [tab, setTab] = useState<ProblemStatementTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => (data ?? []).filter((ps) => matchesTab(ps, tab)), [data, tab]);
  const selected =
    data?.find((ps) => ps.id === selectedId) ?? data?.find((ps) => ps.featured) ?? data?.[0];

  if (isLoading || !data) {
    return <PageLoading />;
  }

  const isBookmarked = selected?.bookmarked ?? false;
  const hasSentInterest = selected?.hasExpressedInterest ?? false;

  return (
    <div>
      <CitadelSubNav />
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Problem Statements</h1>
      <p className="mb-6 text-sm text-slate-500">
        Explore real-world problems and build impactful solutions.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="px-4 pt-2">
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
          </div>
          <div className="flex flex-col divide-y divide-slate-100 p-4">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">Nothing here yet.</p>
            )}
            {filtered.map((ps) => (
              <button
                key={ps.id}
                type="button"
                onClick={() => setSelectedId(ps.id)}
                className={`flex items-start gap-3 py-4 text-left first:pt-0 last:pb-0 ${
                  selected?.id === ps.id ? 'text-blue-700' : ''
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CircleDot size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{ps.title}</p>
                  <p className="line-clamp-2 text-xs text-slate-500">{ps.description}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <Badge tone="green">{ps.tags[0]}</Badge>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> Team of {ps.teamSize}
                    </span>
                    <span>{ps.updatedLabel}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {selected && (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                {selected.featured && (
                  <span className="mb-1 flex items-center gap-1 text-xs font-medium text-blue-600">
                    <Star size={12} className="fill-blue-600" /> Featured Problem
                  </span>
                )}
                <h2 className="text-lg font-semibold text-slate-900">{selected.title}</h2>
                <p className="text-sm text-slate-500">{selected.description}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleBookmark.mutate(selected.id)}
                disabled={toggleBookmark.isPending}
                className={`rounded-lg border p-2 ${
                  isBookmarked
                    ? 'border-blue-200 bg-blue-50 text-blue-600'
                    : 'border-slate-200 text-slate-400'
                }`}
                aria-label="Bookmark"
              >
                <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {selected.tags.map((tag) => (
                <Badge key={tag} tone="blue">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mb-4 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Problem Overview</h3>
              <p className="text-sm text-slate-600">{selected.overview}</p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
              <div className="text-center">
                <Users size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">{selected.teamSize} Members</p>
                <p className="text-xs text-slate-500">Team Size</p>
              </div>
              <div className="text-center">
                <Clock size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">{selected.durationLabel}</p>
                <p className="text-xs text-slate-500">Expected Duration</p>
              </div>
              <div className="text-center">
                <BarChart3 size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">{selected.difficulty}</p>
                <p className="text-xs text-slate-500">Difficulty</p>
              </div>
              <div className="text-center">
                <span
                  className={`mx-auto mb-1 block h-2 w-2 rounded-full ${
                    selected.status === 'Open' ? 'bg-green-500' : 'bg-slate-400'
                  }`}
                />
                <p className="text-sm font-semibold text-slate-900">{selected.status}</p>
                <p className="text-xs text-slate-500">Status</p>
              </div>
            </div>

            <div className="mb-6 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Key Deliverables</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selected.deliverables.map((deliverable) => (
                  <span
                    key={deliverable.title}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    {deliverable.done ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : (
                      <Circle size={16} className="text-slate-300" />
                    )}
                    {deliverable.title}
                  </span>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={hasSentInterest || expressInterest.isPending}
              onClick={() => expressInterest.mutate(selected.id)}
            >
              {hasSentInterest ? 'Interest Sent ✓' : "I'm Interested"}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

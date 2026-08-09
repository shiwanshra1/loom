import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Sparkles, Trophy } from 'lucide-react';
import { useCitadelDaysRemaining, useSprints } from '../../../features/student/hooks';
import { Card } from '../../../components/ui/Card';
import { ProgressDonut } from '../../../components/ui/ProgressDonut';
import { Button } from '../../../components/ui/Button';
import { PageLoading } from '../../../components/ui/PageLoading';
import { CitadelSubNav } from './CitadelSubNav';

export function CitadelHubPage() {
  const { data: sprints, isLoading: sprintsLoading } = useSprints();
  const { data: daysRemaining, isLoading: daysLoading } = useCitadelDaysRemaining();

  if (sprintsLoading || daysLoading || !sprints) {
    return <PageLoading />;
  }

  const completedCount = sprints.filter((s) => s.status === 'completed').length;
  const overallPercent = Math.round(
    sprints.reduce((sum, s) => sum + s.progressPercent, 0) / sprints.length
  );
  const currentSprint = sprints.find((s) => s.status === 'in_progress');
  const nextSprint = sprints.find((s) => s.status === 'upcoming');
  const currentTasksPercent = currentSprint?.tasks.length
    ? Math.round(
        (currentSprint.tasks.filter((t) => t.status === 'completed').length /
          currentSprint.tasks.length) *
          100
      )
    : 0;

  return (
    <div>
      <CitadelSubNav />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Welcome to Citadel 👋</h1>
            <p className="text-sm text-slate-500">
              Track your progress, complete sprints, and build something extraordinary.
            </p>
          </div>

          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Sprint Progress Overview</h2>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-bold text-blue-600">{overallPercent}%</p>
                <p className="text-sm text-slate-500">Across all sprint cycles</p>
              </div>
              <ProgressDonut percent={overallPercent} />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-center">
              <div>
                <p className="flex items-center justify-center gap-1 text-lg font-semibold text-slate-900">
                  <CalendarClock size={16} className="text-blue-600" /> {completedCount}/
                  {sprints.length}
                </p>
                <p className="text-xs text-slate-500">Sprints Completed</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-lg font-semibold text-slate-900">
                  <CheckCircle2 size={16} className="text-green-600" /> {currentTasksPercent}%
                </p>
                <p className="text-xs text-slate-500">Tasks Completed</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-lg font-semibold text-slate-900">
                  <Sparkles size={16} className="text-purple-600" /> {daysRemaining}
                </p>
                <p className="text-xs text-slate-500">Days Remaining</p>
              </div>
            </div>
          </Card>

          {nextSprint && (
            <Card>
              <h2 className="mb-4 font-semibold text-slate-900">Next Up</h2>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <CalendarClock size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{nextSprint.title}</p>
                    <p className="text-xs text-slate-500">{nextSprint.phase}</p>
                    <p className="text-xs text-slate-400">
                      Starts {nextSprint.dateRangeLabel.split('–')[0]}
                    </p>
                  </div>
                </div>
                <Link to="/student/citadel/sprints">
                  <Button variant="secondary">View Details</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 text-center text-white">
          <Trophy size={40} className="mb-3 text-amber-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-blue-200">Citadel</p>
          <h2 className="mt-1 text-xl font-bold">Build. Iterate. Impact.</h2>
          <p className="mt-2 text-sm text-blue-100">
            Work in focused sprint cycles, collaborate with mentors, and turn ideas into real-world
            solutions.
          </p>
          <blockquote className="mt-4 rounded-lg bg-white/10 p-3 text-xs text-blue-100">
            "Great projects are not built in a day, but in consistent cycles."
          </blockquote>
        </Card>
      </div>
    </div>
  );
}

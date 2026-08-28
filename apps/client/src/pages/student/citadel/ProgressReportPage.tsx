import { CheckCircle2, FileText, Rocket, Trophy } from 'lucide-react';
import { SPRINT_PHASE_LABELS, useMyCitadelTeam } from '../../../features/student/hooks';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { ProgressDonut } from '../../../components/ui/ProgressDonut';
import { PageLoading } from '../../../components/ui/PageLoading';
import { CitadelSubNav } from './CitadelSubNav';

const STATUS_BADGE: Record<string, { tone: 'blue' | 'green' | 'amber' | 'slate'; label: string }> =
  {
    not_started: { tone: 'slate', label: 'Not Started' },
    in_progress: { tone: 'blue', label: 'In Progress' },
    submitted: { tone: 'amber', label: 'Submitted' },
    reviewed: { tone: 'amber', label: 'Reviewed' },
    complete: { tone: 'green', label: 'Complete' },
  };

export function ProgressReportPage() {
  const { data: team, isLoading } = useMyCitadelTeam();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!team) {
    return (
      <div>
        <CitadelSubNav />
        <Card className="border-dashed bg-slate-50 text-sm text-slate-500">
          You&apos;re not on a Citadel team yet — there's no progress to report.
        </Card>
      </div>
    );
  }

  const overallPercent =
    team.sprints.length > 0
      ? Math.round(
          team.sprints.reduce((sum, s) => sum + s.progressPercent, 0) / team.sprints.length
        )
      : 0;
  const completedCount = team.sprints.filter((s) => s.status === 'complete').length;

  return (
    <div>
      <CitadelSubNav />
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Progress Report</h1>
      <p className="mb-6 text-sm text-slate-500">
        {team.team.name}
        {team.team.problemStatementTitle ? ` · ${team.team.problemStatementTitle}` : ''}
      </p>

      {team.investorAccessGranted && (
        <Card className="mb-6 flex items-center gap-3 border-amber-200 bg-amber-50">
          <Trophy size={24} className="shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Investor Access Unlocked</p>
            <p className="text-xs text-amber-700">
              All 3 sprint cycles are complete — your team is now visible to investors.
            </p>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="flex items-center gap-6">
          <ProgressDonut percent={overallPercent} />
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {completedCount}/{team.sprints.length} Sprints Complete
            </p>
            <p className="text-sm text-slate-500">Overall progress across all cycles</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {team.sprints.map((sprint) => {
          const badge = STATUS_BADGE[sprint.status] ?? STATUS_BADGE.not_started!;
          const submissions = team.submissionsBySprintId[sprint.id] ?? [];
          const tasksDone = sprint.tasks.filter((t) => t.status === 'completed').length;

          return (
            <Card key={sprint.id}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sprint Cycle {sprint.cycleNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    {SPRINT_PHASE_LABELS[sprint.cycleNumber - 1] ?? ''}
                  </p>
                </div>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>

              <div className="mb-3 flex items-center gap-3">
                <ProgressBar percent={sprint.progressPercent} />
                <span className="w-24 shrink-0 text-right text-xs text-slate-500">
                  {tasksDone}/{sprint.tasks.length} tasks
                </span>
              </div>

              {submissions.length === 0 ? (
                <p className="text-xs text-slate-400">No milestone submitted yet.</p>
              ) : (
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="text-xs text-slate-600">
                      <p className="mb-1 flex items-center gap-1 font-medium text-slate-700">
                        <FileText size={12} /> Submitted{' '}
                        {new Date(submission.createdAt).toLocaleDateString()}
                        {submission.demoDate &&
                          ` · Demo ${new Date(submission.demoDate).toLocaleDateString()}`}
                      </p>
                      {submission.artifactUrls.length > 0 && (
                        <ul className="ml-4 list-disc text-slate-500">
                          {submission.artifactUrls.map((url) => (
                            <li key={url} className="truncate">
                              {url}
                            </li>
                          ))}
                        </ul>
                      )}
                      {submission.mentorFeedback.length > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-green-700">
                          <CheckCircle2 size={12} /> {submission.mentorFeedback.length} mentor
                          comment{submission.mentorFeedback.length === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}

        {team.sprints.length === 0 && (
          <Card>
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Rocket size={16} /> Sprint cycles will appear once your team picks up a problem
              statement.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

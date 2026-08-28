import { useState } from 'react';
import { Layers, Target, UserCheck } from 'lucide-react';
import {
  useAddSprintFeedback,
  useCompleteSprint,
  useMentorTeams,
  useTeamDetails,
} from '../../features/mentor/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ProgressDonut } from '../../components/ui/ProgressDonut';
import { PageLoading } from '../../components/ui/PageLoading';

export function TeamsPage() {
  const { data: teams, isLoading: teamsLoading } = useMentorTeams();
  const { data: details, isLoading: detailsLoading } = useTeamDetails();
  const addFeedback = useAddSprintFeedback();
  const completeSprint = useCompleteSprint();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedTeam = teams?.find((t) => t.id === selectedId) ?? teams?.[0];
  const detail = selectedTeam ? details?.[selectedTeam.id] : undefined;

  if (teamsLoading || detailsLoading || !teams) {
    return <PageLoading />;
  }

  async function handleSubmitFeedback() {
    if (!detail?.currentSprintId || !feedbackComment.trim()) return;
    setActionError(null);
    try {
      await addFeedback.mutateAsync({
        sprintId: detail.currentSprintId,
        comment: feedbackComment.trim(),
      });
      setFeedbackComment('');
    } catch {
      setActionError('Could not submit feedback. Please try again.');
    }
  }

  async function handleMarkComplete() {
    if (!detail?.currentSprintId) return;
    setActionError(null);
    try {
      await completeSprint.mutateAsync(detail.currentSprintId);
    } catch {
      setActionError('Could not mark this sprint complete.');
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Teams Assigned</h1>
      <p className="mb-6 text-sm text-slate-500">Your Citadel teams and their sprint progress.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="flex flex-col divide-y divide-slate-100 p-4">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedId(team.id)}
                className={`flex items-center gap-4 py-4 text-left first:pt-0 last:pb-0 ${
                  (selectedTeam?.id ?? teams[0]?.id) === team.id ? 'text-blue-700' : ''
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-semibold text-blue-700">
                  {team.letter}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{team.name}</p>
                  <p className="text-xs text-slate-500">{team.memberCount} Students</p>
                </div>
                <span className="w-10 text-right text-xs text-slate-500">
                  {team.progressPercent}%
                </span>
              </button>
            ))}
          </div>
        </Card>

        {detail && selectedTeam && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{detail.name}</h2>
                <p className="text-sm text-slate-500">{detail.currentSprint}</p>
              </div>
              <ProgressDonut percent={selectedTeam.progressPercent} size={64} strokeWidth={7} />
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <Target size={16} className="text-slate-400" /> {detail.problemStatementTitle}
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
              <UserCheck size={16} className="text-slate-400" /> Trainer: {detail.trainerName}
            </div>

            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-700">Sprint Progress</span>
                <span className="text-slate-500">{selectedTeam.progressPercent}%</span>
              </div>
              <ProgressBar percent={selectedTeam.progressPercent} />
            </div>

            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Layers size={14} /> Team Members
            </h3>
            <div className="flex flex-col divide-y divide-slate-100">
              {detail.members.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="text-sm text-slate-800">{member.name}</span>
                  <span className="text-xs text-slate-400">{member.role}</span>
                </div>
              ))}
            </div>

            {detail.currentSprintId && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {actionError && <p className="mb-2 text-xs text-red-600">{actionError}</p>}
                {detail.currentSprintStatus === 'submitted' && (
                  <>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">
                      Review this sprint's submission
                    </h3>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      rows={3}
                      placeholder="Leave feedback on the submitted milestone…"
                      className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Button
                      className="w-full"
                      onClick={handleSubmitFeedback}
                      disabled={addFeedback.isPending || !feedbackComment.trim()}
                    >
                      {addFeedback.isPending ? 'Submitting…' : 'Submit Feedback'}
                    </Button>
                  </>
                )}
                {detail.currentSprintStatus === 'reviewed' && (
                  <>
                    <Badge tone="amber">Reviewed — ready to complete</Badge>
                    <Button
                      className="mt-2 w-full"
                      onClick={handleMarkComplete}
                      disabled={completeSprint.isPending}
                    >
                      {completeSprint.isPending ? 'Completing…' : 'Mark Sprint Complete'}
                    </Button>
                  </>
                )}
                {detail.currentSprintStatus === 'in_progress' && (
                  <p className="text-xs text-slate-400">
                    Waiting on the team to submit this sprint's milestone.
                  </p>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

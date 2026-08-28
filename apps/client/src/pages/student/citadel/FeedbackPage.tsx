import { MessageSquare, Star } from 'lucide-react';
import { useMyCitadelTeam } from '../../../features/student/hooks';
import { Card } from '../../../components/ui/Card';
import { PageLoading } from '../../../components/ui/PageLoading';
import { CitadelSubNav } from './CitadelSubNav';

interface FeedbackRow {
  cycleNumber: number;
  comment: string;
  rating?: number;
  createdAt: string;
}

export function FeedbackPage() {
  const { data: team, isLoading } = useMyCitadelTeam();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!team) {
    return (
      <div>
        <CitadelSubNav />
        <Card className="border-dashed bg-slate-50 text-sm text-slate-500">
          You&apos;re not on a Citadel team yet — there's no mentor feedback to show.
        </Card>
      </div>
    );
  }

  const sprintByCycle = new Map(team.sprints.map((s) => [s.id, s.cycleNumber]));
  const rows: FeedbackRow[] = Object.entries(team.submissionsBySprintId)
    .flatMap(([sprintId, submissions]) =>
      submissions.flatMap((submission) =>
        submission.mentorFeedback.map((feedback) => ({
          cycleNumber: sprintByCycle.get(sprintId) ?? 0,
          comment: feedback.comment,
          rating: feedback.rating,
          createdAt: feedback.createdAt,
        }))
      )
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <CitadelSubNav />
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Mentor Feedback</h1>
      <p className="mb-6 text-sm text-slate-500">
        Everything your mentor has said about your sprint submissions.
      </p>

      {rows.length === 0 ? (
        <Card>
          <p className="flex items-center gap-2 py-8 text-center text-sm text-slate-400">
            <MessageSquare size={16} /> No feedback yet — it&apos;ll show up here once a mentor
            reviews a submitted sprint.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <Card key={index}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  Sprint Cycle {row.cycleNumber}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(row.createdAt).toLocaleDateString()}
                </span>
              </div>
              {row.rating && (
                <div className="mb-2 flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < row.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }
                    />
                  ))}
                </div>
              )}
              <p className="text-sm text-slate-600">{row.comment}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

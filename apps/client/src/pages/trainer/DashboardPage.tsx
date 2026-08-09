import { useState } from 'react';
import { BookOpenCheck, CalendarClock, ClipboardCheck, Layers, Users } from 'lucide-react';
import {
  useTrainerCourses,
  useTrainerStats,
  useTrainerStudents,
  useTrainerSubmissions,
  useTrainerTeams,
} from '../../features/trainer/data';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useTrainerStats();
  const { data: students, isLoading: studentsLoading } = useTrainerStudents();
  const { data: courses, isLoading: coursesLoading } = useTrainerCourses();
  const { data: submissions, isLoading: submissionsLoading } = useTrainerSubmissions();
  const { data: teams, isLoading: teamsLoading } = useTrainerTeams();

  const [grades, setGrades] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});

  if (statsLoading || studentsLoading || coursesLoading || submissionsLoading || teamsLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Trainer Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        Your students, courses, and assignments in one place.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Students Assigned"
          value={String(stats?.studentsAssigned ?? 0)}
        />
        <StatCard
          icon={BookOpenCheck}
          label="Courses Teaching"
          value={String(stats?.coursesTeaching ?? 0)}
          iconClassName="bg-green-50 text-green-600"
        />
        <StatCard
          icon={CalendarClock}
          label="Sessions Today"
          value={String(stats?.sessionsToday ?? 0)}
          iconClassName="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending Grading"
          value={String(stats?.pendingGrading ?? 0)}
          iconClassName="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Assigned Students</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {students?.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.course}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Score: {student.score}</p>
                  <p className="text-slate-400">{student.lastActivityLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Course Cards</h2>
          <div className="flex flex-col gap-4">
            {courses?.map((course) => (
              <div key={course.id} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{course.name}</span>
                  <span className="text-slate-500">{course.studentsEnrolled} students</span>
                </div>
                <ProgressBar percent={course.progressPercent} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Assignment Submissions</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {submissions?.map((submission) => {
              const isGraded = submission.status === 'graded' || graded[submission.id];
              return (
                <div
                  key={submission.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {submission.assignmentTitle}
                    </p>
                    <p className="text-xs text-slate-500">
                      {submission.studentName} · Submitted {submission.submittedLabel}
                    </p>
                  </div>
                  {isGraded ? (
                    <Badge tone="green">Graded {submission.grade ?? grades[submission.id]}%</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Grade"
                        className="w-20"
                        value={grades[submission.id] ?? ''}
                        onChange={(e) =>
                          setGrades((prev) => ({ ...prev, [submission.id]: e.target.value }))
                        }
                      />
                      <Button
                        variant="secondary"
                        disabled={!grades[submission.id]}
                        onClick={() => setGraded((prev) => ({ ...prev, [submission.id]: true }))}
                      >
                        Submit Grade
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Layers size={16} /> Teams Connection
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {teams?.map((team) => (
              <div key={team.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{team.name}</p>
                <p className="text-xs text-slate-500">{team.problemStatementTitle}</p>
                <Badge tone="blue">{team.sprintStatus}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

import { CheckCircle2, Clock, Flame, TrendingUp } from 'lucide-react';
import {
  useLearningStreak,
  useStudentCourses,
  useStudentStats,
  useWeeklyProgress,
} from '../../features/student/hooks';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { PageLoading } from '../../components/ui/PageLoading';
import { SimpleLineChart } from '../../components/charts/SimpleLineChart';

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function TrackerPage() {
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: weekly, isLoading: weeklyLoading } = useWeeklyProgress();
  const { data: streak, isLoading: streakLoading } = useLearningStreak();
  const { data: courses, isLoading: coursesLoading } = useStudentCourses();

  if (statsLoading || weeklyLoading || streakLoading || coursesLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">My Progress Tracker</h1>
      <p className="mb-6 text-sm text-slate-500">
        Track your learning, stay consistent and achieve your goals.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={CheckCircle2}
              label="Tasks Completed"
              value={String(stats?.tasksCompleted ?? 0)}
            />
            <StatCard
              icon={Clock}
              label="Weekly Goal"
              value="85%"
              iconClassName="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={Flame}
              label="Day Streak"
              value={String(streak?.days ?? 0)}
              iconClassName="bg-orange-50 text-orange-600"
            />
            <StatCard
              icon={TrendingUp}
              label="XP Earned"
              value={String(stats?.xpEarned ?? 0)}
              iconClassName="bg-purple-50 text-purple-600"
            />
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Learning Streak</h3>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Flame size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{streak?.days} Days Streak</p>
                <div className="mt-1 flex gap-1.5">
                  {streak?.weekPattern.map((active, index) => (
                    <span
                      key={index}
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${
                        active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {WEEKDAY_LETTERS[index]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Weekly Progress</h2>
            <span className="text-xs font-medium text-green-600">{weekly?.changeLabel}</span>
          </div>
          <p className="mb-1 text-2xl font-bold text-slate-900">{weekly?.totalPercent}%</p>
          <p className="mb-3 text-xs text-slate-500">Total progress this week</p>
          <SimpleLineChart points={weekly?.points ?? []} labels={weekly?.dayLabels} />
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Subject Progress</h2>
          <div className="flex flex-col gap-4">
            {courses?.slice(0, 4).map((course) => (
              <div key={course.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{course.name}</span>
                  <span className="text-slate-500">{course.progressPercent}%</span>
                </div>
                <ProgressBar
                  percent={course.progressPercent}
                  colorClassName={course.accentClassName}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

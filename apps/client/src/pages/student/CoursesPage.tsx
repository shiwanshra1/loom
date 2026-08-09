import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { useStudentActivity, useStudentCourses } from '../../features/student/hooks';
import type { CourseStatus } from '../../features/student/types';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ProgressDonut } from '../../components/ui/ProgressDonut';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { PageLoading } from '../../components/ui/PageLoading';

type TabValue = 'all' | CourseStatus;

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All Courses' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'dropped', label: 'Dropped' },
];

const STATUS_BADGE: Record<
  CourseStatus,
  { tone: 'blue' | 'green' | 'slate' | 'amber'; label: string }
> = {
  in_progress: { tone: 'blue', label: 'In Progress' },
  completed: { tone: 'green', label: 'Completed' },
  upcoming: { tone: 'amber', label: 'Upcoming' },
  dropped: { tone: 'slate', label: 'Dropped' },
};

export function CoursesPage() {
  const { data: courses, isLoading: coursesLoading } = useStudentCourses();
  const { data: activity, isLoading: activityLoading } = useStudentActivity();
  const [tab, setTab] = useState<TabValue>('all');

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return tab === 'all' ? courses : courses.filter((course) => course.status === tab);
  }, [courses, tab]);

  const overview = useMemo(() => {
    if (!courses) return null;
    const enrolled = courses.length;
    const inProgress = courses.filter((c) => c.status === 'in_progress').length;
    const completed = courses.filter((c) => c.status === 'completed').length;
    const upcoming = courses.filter((c) => c.status === 'upcoming').length;
    const overallPercent = enrolled
      ? Math.round(courses.reduce((sum, c) => sum + c.progressPercent, 0) / enrolled)
      : 0;
    return { enrolled, inProgress, completed, upcoming, overallPercent };
  }, [courses]);

  if (coursesLoading || activityLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Courses</h1>
          <p className="text-sm text-slate-500">Continue your learning journey</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-0">
            <div className="px-4 pt-2">
              <Tabs tabs={TABS} value={tab} onChange={setTab} />
            </div>

            <div className="flex flex-col divide-y divide-slate-100 p-4">
              {filteredCourses.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No courses in this category yet.
                </p>
              )}

              {filteredCourses.map((course) => {
                const badge = STATUS_BADGE[course.status];
                return (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${course.accentClassName}`}
                    >
                      <BookOpen size={18} />
                    </span>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{course.name}</p>
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </div>
                      <p className="mb-2 text-xs text-slate-500">
                        {course.level} · {course.updatedLabel}
                      </p>
                      <div className="flex items-center gap-3">
                        <ProgressBar
                          percent={course.progressPercent}
                          colorClassName={course.accentClassName}
                        />
                        <span className="w-10 text-right text-xs text-slate-500">
                          {course.progressPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Course Progress Overview</h2>
            <div className="flex items-center gap-4">
              <ProgressDonut percent={overview?.overallPercent ?? 0} />
              <div className="flex-1 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <BookOpen size={14} /> Courses Enrolled
                  </span>
                  <span className="font-medium text-slate-900">{overview?.enrolled}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <PlayCircle size={14} /> In Progress
                  </span>
                  <span className="font-medium text-slate-900">{overview?.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 size={14} /> Completed
                  </span>
                  <span className="font-medium text-slate-900">{overview?.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Clock size={14} /> Upcoming
                  </span>
                  <span className="font-medium text-slate-900">{overview?.upcoming}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-slate-900">Recent Activity</h2>
            <div className="flex flex-col divide-y divide-slate-100">
              {activity?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.subtitle}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{item.timeAgo}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

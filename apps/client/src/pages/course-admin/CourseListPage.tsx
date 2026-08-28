import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import type { CourseStatus } from '@forge-loom/shared-types';
import { useMyCourses } from '../../features/course-admin/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/PageLoading';

type TabValue = 'all' | CourseStatus;

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_BADGE: Record<CourseStatus, { tone: 'slate' | 'green' | 'blue'; label: string }> = {
  draft: { tone: 'slate', label: 'Draft' },
  published: { tone: 'green', label: 'Published' },
  archived: { tone: 'blue', label: 'Archived' },
};

export function CourseListPage() {
  const { data: courses, isLoading } = useMyCourses();
  const [tab, setTab] = useState<TabValue>('all');

  const filtered = useMemo(() => {
    if (!courses) return [];
    return tab === 'all' ? courses : courses.filter((c) => c.status === tab);
  }, [courses, tab]);

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Courses</h1>
          <p className="text-sm text-slate-500">Create and manage your courses.</p>
        </div>
        <Link to="/course-admin/courses/new">
          <Button>
            <Plus size={16} /> New Course
          </Button>
        </Link>
      </div>

      <Card className="p-0">
        <div className="px-4 pt-2">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
        </div>
        <div className="flex flex-col divide-y divide-slate-100 p-4">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              No courses in this category yet.
            </p>
          )}
          {filtered.map((course) => {
            const badge = STATUS_BADGE[course.status];
            return (
              <Link
                key={course.id}
                to={`/course-admin/courses/${course.id}/edit`}
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BookOpen size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{course.title}</p>
                  <p className="text-xs text-slate-500">
                    {course.deliveryMode} · {course.durationDays} days · {course.syllabus.length}{' '}
                    syllabus days · {course.currency} {course.price}
                  </p>
                </div>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Calendar, Star } from 'lucide-react';
import { useAssignedStudents, useStudentProfiles } from '../../features/mentor/hooks';
import type { StudentStatus } from '../../features/mentor/types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { PageLoading } from '../../components/ui/PageLoading';

type TabValue = 'all' | StudentStatus;

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'not_started', label: 'Not Started' },
];

const STATUS_BADGE: Record<StudentStatus, { tone: 'green' | 'red' | 'slate'; label: string }> = {
  on_track: { tone: 'green', label: 'On Track' },
  at_risk: { tone: 'red', label: 'At Risk' },
  not_started: { tone: 'slate', label: 'Not Started' },
};

export function StudentsPage() {
  const { data: students, isLoading: studentsLoading } = useAssignedStudents();
  const { data: profiles, isLoading: profilesLoading } = useStudentProfiles();
  const [tab, setTab] = useState<TabValue>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!students) return [];
    return tab === 'all' ? students : students.filter((s) => s.status === tab);
  }, [students, tab]);

  const selectedStudent = students?.find((s) => s.id === selectedId) ?? filtered[0];
  const selectedProfile = selectedStudent ? profiles?.[selectedStudent.id] : undefined;

  if (studentsLoading || profilesLoading || !students) {
    return <PageLoading />;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Assigned Students</h1>
      <p className="mb-6 text-sm text-slate-500">
        Track progress and stay ahead of anyone falling behind.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="px-4 pt-2">
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
          </div>
          <div className="flex flex-col divide-y divide-slate-100 p-4">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No students here.</p>
            )}
            {filtered.map((student) => {
              const badge = STATUS_BADGE[student.status];
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedId(student.id)}
                  className={`flex items-center gap-3 py-4 text-left first:pt-0 last:pb-0 ${
                    (selectedStudent?.id ?? filtered[0]?.id) === student.id ? 'text-blue-700' : ''
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {student.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">
                      {student.team} · {student.course}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    <p className="mt-1 text-xs text-slate-400">Score: {student.score}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {selectedStudent && (
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {selectedStudent.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedStudent.name}</p>
                <p className="text-xs text-slate-500">{selectedStudent.team}</p>
              </div>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">Course Progress</h3>
            <div className="mb-4 flex flex-col gap-3">
              {selectedProfile?.courses.map((course) => (
                <div key={course.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{course.name}</span>
                    <span className="text-slate-500">{course.progressPercent}%</span>
                  </div>
                  <ProgressBar percent={course.progressPercent} />
                </div>
              ))}
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <Calendar size={16} className="text-slate-400" />{' '}
              {selectedProfile?.upcomingSessionLabel}
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">Feedback History</h3>
            <div className="flex flex-col divide-y divide-slate-100">
              {selectedProfile?.feedbackHistory.map((entry) => (
                <div key={entry.dateLabel} className="py-3 first:pt-0 last:pb-0">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{entry.dateLabel}</span>
                    <span className="flex items-center gap-0.5 text-xs text-amber-600">
                      {Array.from({ length: entry.rating }).map((_, index) => (
                        <Star key={index} size={12} className="fill-amber-500 text-amber-500" />
                      ))}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{entry.note}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

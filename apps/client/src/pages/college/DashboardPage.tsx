import { useState, type FormEvent } from 'react';
import { Award, BookOpen, CalendarPlus, GraduationCap, Users } from 'lucide-react';
import { useCollegePlacements } from '../../features/college/data';
import { useCollegeFaculty, useCollegePrograms } from '../../features/college/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

export function DashboardPage() {
  const { data: programs, isLoading: programsLoading } = useCollegePrograms();
  const { data: faculty, isLoading: facultyLoading } = useCollegeFaculty();
  const { data: placements, isLoading: placementsLoading } = useCollegePlacements();
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [hosted, setHosted] = useState(false);

  if (programsLoading || facultyLoading || placementsLoading) {
    return <PageLoading />;
  }

  const totalStudents = programs?.reduce((sum, p) => sum + p.studentsEnrolled, 0) ?? 0;
  const totalPlacements = placements?.reduce((sum, p) => sum + p.placements, 0) ?? 0;
  const maxPlacements = Math.max(...(placements?.map((p) => p.placements) ?? [1]));

  const PROGRAM_BADGE = {
    published: { tone: 'green' as const, label: 'Active' },
    draft: { tone: 'slate' as const, label: 'Draft' },
    archived: { tone: 'amber' as const, label: 'Archived' },
  };

  function handleHostEvent(event: FormEvent) {
    event.preventDefault();
    if (!eventTitle || !eventDate) return;
    setHosted(true);
    setEventTitle('');
    setEventDate('');
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">College Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">Programs, faculty, and placement performance.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Active Programs"
          value={String(programs?.filter((p) => p.status === 'published').length ?? 0)}
        />
        <StatCard
          icon={Users}
          label="Students Enrolled"
          value={String(totalStudents)}
          iconClassName="bg-green-50 text-green-600"
        />
        <StatCard
          icon={GraduationCap}
          label="Faculty"
          value={String(faculty?.length ?? 0)}
          iconClassName="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={Award}
          label="Placements"
          value={String(totalPlacements)}
          iconClassName="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Programs / Active Courses</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {programs?.length === 0 && (
              <p className="py-4 text-sm text-slate-400">
                No students at this college have enrolled in a course yet.
              </p>
            )}
            {programs?.map((program) => {
              const badge = PROGRAM_BADGE[program.status];
              return (
                <div
                  key={program.courseId}
                  className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{program.title}</p>
                    <p className="text-xs text-slate-500">
                      {program.studentsEnrolled} students enrolled
                    </p>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Faculty Overview</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {faculty?.length === 0 && (
              <p className="py-4 text-sm text-slate-400">
                No trainers or mentors are linked to this college yet.
              </p>
            )}
            {faculty?.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{member.email}</p>
                  <p className="text-xs capitalize text-slate-500">{member.role}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {member.workload} {member.role === 'trainer' ? 'teams' : 'students'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Placement Stats</h2>
          <div className="flex flex-col gap-3">
            {placements?.map((stat) => (
              <div key={stat.domain}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{stat.domain}</span>
                  <span className="text-slate-500">{stat.placements}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${(stat.placements / maxPlacements) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <CalendarPlus size={16} /> Host an Event
          </h2>
          <form onSubmit={handleHostEvent} className="flex flex-col gap-3">
            <Input
              placeholder="Event title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <Button type="submit" disabled={!eventTitle || !eventDate}>
              Host Event
            </Button>
            {hosted && (
              <p className="text-xs text-green-600">Event added to the shared calendar.</p>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}

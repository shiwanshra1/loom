import { useMemo, useState, type FormEvent } from 'react';
import { CalendarPlus, CheckCircle2, Users, Video } from 'lucide-react';
import { useMentorSessions, useScheduleSession } from '../../features/mentor/hooks';
import type { MentorSessionStatus } from '../../features/mentor/types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

const TABS: { value: MentorSessionStatus; label: string }[] = [
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Completed', label: 'Completed' },
];

export function SessionsPage() {
  const { data: sessions, isLoading: sessionsLoading } = useMentorSessions();
  const scheduleSession = useScheduleSession();
  const [tab, setTab] = useState<MentorSessionStatus>('Upcoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const filtered = useMemo(() => (sessions ?? []).filter((s) => s.status === tab), [sessions, tab]);
  const selected = sessions?.find((s) => s.id === selectedId) ?? filtered[0];

  if (sessionsLoading) {
    return <PageLoading />;
  }

  async function handleSchedule(event: FormEvent) {
    event.preventDefault();
    if (!title || !studentEmail || !date || !time) return;

    setScheduleError(null);
    try {
      await scheduleSession.mutateAsync({
        studentEmail,
        title,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
      });
      setTitle('');
      setStudentEmail('');
      setDate('');
      setTime('');
      setShowForm(false);
      setTab('Upcoming');
    } catch {
      setScheduleError('Could not schedule this session. Check the student email and try again.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sessions</h1>
          <p className="text-sm text-slate-500">Schedule and manage sessions with your teams.</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          <CalendarPlus size={16} /> Schedule Session
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold text-slate-900">New Session</h2>
          <form onSubmit={handleSchedule} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="session-title"
              >
                Title
              </label>
              <Input
                id="session-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint Check-in"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="session-student"
              >
                Student email
              </label>
              <Input
                id="session-student"
                type="email"
                required
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student1@forgeloom.dev"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="session-date"
              >
                Date
              </label>
              <Input
                id="session-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="session-time"
              >
                Time
              </label>
              <Input
                id="session-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            {scheduleError && <p className="text-sm text-red-600 sm:col-span-2">{scheduleError}</p>}
            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" className="flex-1" disabled={scheduleSession.isPending}>
                {scheduleSession.isPending ? 'Scheduling…' : 'Confirm Session'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="px-4 pt-2">
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
          </div>
          <div className="flex flex-col divide-y divide-slate-100 p-4">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No sessions here.</p>
            )}
            {filtered.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedId(session.id)}
                className={`flex items-center gap-3 py-4 text-left first:pt-0 last:pb-0 ${
                  (selected?.id ?? filtered[0]?.id) === session.id ? 'text-blue-700' : ''
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <span className="text-xs font-medium">{session.monthLabel}</span>
                  <span className="text-sm font-bold">{session.dayLabel}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{session.title}</p>
                  <p className="text-xs text-slate-500">
                    {session.team} · {session.timeLabel}
                  </p>
                </div>
                <Badge tone={session.status === 'Upcoming' ? 'blue' : 'slate'}>
                  {session.status}
                </Badge>
              </button>
            ))}
          </div>
        </Card>

        {selected ? (
          <Card>
            <Badge tone={selected.status === 'Upcoming' ? 'blue' : 'slate'}>
              {selected.status} Session
            </Badge>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{selected.title}</h2>
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <Users size={14} /> {selected.team}
            </p>

            <div className="my-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-900">{selected.dateLabel}</p>
                <p className="text-xs text-slate-500">Date</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-900">{selected.timeLabel}</p>
                <p className="text-xs text-slate-500">Time</p>
              </div>
              <div className="text-center">
                <p className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-900">
                  <Video size={12} /> {selected.mode}
                </p>
                <p className="text-xs text-slate-500">Mode</p>
              </div>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">Agenda</h3>
            {selected.agenda.length === 0 && (
              <p className="text-sm text-slate-400">No agenda set yet.</p>
            )}
            <div className="flex flex-col gap-2">
              {selected.agenda.map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={14} className="text-slate-300" /> {item}
                </span>
              ))}
            </div>

            {selected.status === 'Upcoming' && (
              <div className="mt-6 flex gap-3">
                <Button variant="secondary" className="flex-1">
                  Reschedule
                </Button>
                <Button className="flex-1">
                  <Video size={16} /> Start Session
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex items-center justify-center text-sm text-slate-400">
            No session selected.
          </Card>
        )}
      </div>
    </div>
  );
}

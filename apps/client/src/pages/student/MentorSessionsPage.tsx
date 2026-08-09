import { useMemo, useState } from 'react';
import { Calendar, Clock, Linkedin, Mail, Video, CheckCircle2, Lightbulb } from 'lucide-react';
import { useMentorSessions } from '../../features/student/hooks';
import type { MentorSessionTab } from '../../features/student/types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/PageLoading';

const TABS: { value: MentorSessionTab; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming Sessions' },
  { value: 'past', label: 'Past Sessions' },
];

export function MentorSessionsPage() {
  const { data, isLoading } = useMentorSessions();
  const [tab, setTab] = useState<MentorSessionTab>('upcoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((session) =>
      tab === 'upcoming' ? session.status === 'Upcoming' : session.status === 'Completed'
    );
  }, [data, tab]);

  const selected = data?.find((s) => s.id === selectedId) ?? filtered[0];

  if (isLoading || !data) {
    return <PageLoading />;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Mentor Sessions</h1>
      <p className="mb-6 text-sm text-slate-500">Connect, learn and grow with your mentors.</p>

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
                  selected?.id === session.id ? 'text-blue-700' : ''
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <span className="text-xs font-medium">{session.monthLabel}</span>
                  <span className="text-sm font-bold">{session.dayLabel}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{session.title}</p>
                  <p className="text-xs text-slate-500">with {session.mentorName}</p>
                  <p className="text-xs text-slate-400">{session.timeLabel}</p>
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
            <Badge tone="blue">
              {selected.status === 'Upcoming' ? 'Upcoming Session' : 'Completed Session'}
            </Badge>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{selected.title}</h2>
            <p className="text-sm text-slate-500">Get expert feedback and level up your project.</p>

            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 sm:grid-cols-4">
              <div className="text-center">
                <Calendar size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-900">{selected.dateLabel}</p>
              </div>
              <div className="text-center">
                <Clock size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-900">{selected.timeLabel}</p>
              </div>
              <div className="text-center">
                <Video size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-900">{selected.mode}</p>
              </div>
              <div className="text-center">
                <span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-blue-500" />
                <p className="text-xs font-semibold text-slate-900">1:1 Session</p>
              </div>
            </div>

            <div className="my-4 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {selected.mentorName
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </span>
              <div className="flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  {selected.mentorName} <Badge tone="purple">Mentor</Badge>
                </p>
                <p className="text-xs text-slate-500">{selected.mentorTitle}</p>
                <p className="text-xs text-slate-400">{selected.mentorBio}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href="#"
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                >
                  <Linkedin size={16} />
                </a>
                <a
                  href="#"
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">Session Agenda</h3>
            <div className="mb-4 flex flex-col gap-2">
              {selected.agenda.map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={14} className="text-slate-300" /> {item}
                </span>
              ))}
            </div>

            {selected.note && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                <Lightbulb size={14} className="mt-0.5 shrink-0" /> {selected.note}
              </div>
            )}

            {selected.status === 'Upcoming' && (
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1">
                  Reschedule
                </Button>
                <Button className="flex-1">
                  <Video size={16} /> Join Session
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

import { useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, Users, CheckCircle2, Share2 } from 'lucide-react';
import { useEvents } from '../../features/student/hooks';
import type { EventStatus } from '../../features/student/types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/PageLoading';

type TabValue = 'all' | EventStatus;

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_BADGE: Record<EventStatus, { tone: 'blue' | 'green' | 'slate'; label: string }> = {
  upcoming: { tone: 'blue', label: 'Upcoming' },
  ongoing: { tone: 'green', label: 'Ongoing' },
  completed: { tone: 'slate', label: 'Completed' },
};

export function EventsPage() {
  const { data, isLoading } = useEvents();
  const [tab, setTab] = useState<TabValue>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (!data) return [];
    return tab === 'all' ? data : data.filter((event) => event.status === tab);
  }, [data, tab]);

  const selected =
    data?.find((e) => e.id === selectedId) ?? filtered[filtered.length - 1] ?? data?.[0];

  if (isLoading || !data) {
    return <PageLoading />;
  }

  const isRegistered = selected ? (registered[selected.id] ?? false) : false;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Events</h1>
      <p className="mb-6 text-sm text-slate-500">Explore, learn and grow with exciting events.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="px-4 pt-2">
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
          </div>
          <div className="flex flex-col divide-y divide-slate-100 p-4">
            {filtered.map((event) => {
              const badge = STATUS_BADGE[event.status];
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedId(event.id)}
                  className={`flex items-center gap-3 py-4 text-left first:pt-0 last:pb-0 ${
                    selected?.id === event.id ? 'text-blue-700' : ''
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <span className="text-xs font-medium">{event.monthLabel}</span>
                    <span className="text-sm font-bold">{event.dayLabel}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{event.title}</p>
                    <p className="text-xs text-slate-500">
                      {event.timeLabel} · {event.location}
                    </p>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        {selected && (
          <Card>
            <span className="mb-2 flex items-center gap-1 text-xs font-medium text-blue-600">
              <Users size={12} /> Featured Event
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{selected.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{selected.description}</p>

            <div className="my-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 sm:grid-cols-4">
              <div className="text-center">
                <CalendarDays size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-900">
                  {selected.dayLabel} {selected.monthLabel}
                </p>
              </div>
              <div className="text-center">
                <Clock size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-900">{selected.timeLabel}</p>
              </div>
              <div className="text-center">
                <MapPin size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-900">{selected.location}</p>
              </div>
              <div className="text-center">
                <Users size={16} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-900">{selected.participants}</p>
              </div>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">What to Expect</h3>
            <div className="mb-6 flex flex-col gap-2">
              {selected.whatToExpect.map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={14} className="text-green-600" /> {item}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={isRegistered}
                onClick={() => setRegistered((prev) => ({ ...prev, [selected.id]: true }))}
              >
                {isRegistered ? 'Registered ✓' : 'Register Now'}
              </Button>
              <Button variant="secondary">
                <Share2 size={16} /> Share
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

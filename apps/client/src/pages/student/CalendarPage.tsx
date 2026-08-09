import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useCalendarEntries } from '../../features/student/hooks';
import type { CalendarEntry } from '../../features/student/types';
import { Card } from '../../components/ui/Card';
import { PageLoading } from '../../components/ui/PageLoading';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarPage() {
  const { data: entries, isLoading } = useCalendarEntries();
  // Mock "current" view — there is no live backend yet, so this anchors to the
  // month the seed calendar data actually lives in rather than the real today.
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4); // May
  const [selectedDate, setSelectedDate] = useState('2026-05-28');

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    entries?.forEach((entry) => {
      const existing = map.get(entry.date) ?? [];
      map.set(entry.date, [...existing, entry]);
    });
    return map;
  }, [entries]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  function goToMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  if (isLoading) {
    return <PageLoading />;
  }

  const upcoming = [...(entries ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const selectedEntries = entriesByDate.get(selectedDate) ?? [];
  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Calendar</h1>
      <p className="mb-6 text-sm text-slate-500">Stay on track with your schedule and events.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 font-semibold text-slate-900">Upcoming Schedule</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {upcoming.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedDate(entry.date)}
                className="flex w-full items-start gap-3 py-3 text-left first:pt-0 last:pb-0 hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-semibold text-blue-600">
                  {entry.date.slice(8, 10)}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{entry.title}</p>
                  <p className="text-xs text-slate-500">{entry.subtitle}</p>
                  <p className="text-xs text-slate-400">{entry.timeLabel}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {MONTH_LABELS[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (day === null) return <div key={`blank-${index}`} />;
              const dateKey = toDateKey(year, month, day);
              const hasEntries = entriesByDate.has(dateKey);
              const isSelected = dateKey === selectedDate;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                  {hasEntries && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              {selectedDateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            {selectedEntries.length === 0 && (
              <p className="text-sm text-slate-400">Nothing scheduled.</p>
            )}

            <div className="flex flex-col divide-y divide-slate-100">
              {selectedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entry.title}</p>
                    <p className="text-xs text-slate-500">{entry.timeLabel}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={12} /> {entry.location}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

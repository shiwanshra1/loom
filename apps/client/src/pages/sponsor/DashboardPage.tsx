import { useMemo, useState, type FormEvent } from 'react';
import { CalendarClock, GraduationCap, Send, Users } from 'lucide-react';
import { usePartnerColleges, useSponsorEvents } from '../../features/sponsor/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

export function DashboardPage() {
  const { data: events, isLoading: eventsLoading } = useSponsorEvents();
  const { data: colleges, isLoading: collegesLoading } = usePartnerColleges();
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [meetCollege, setMeetCollege] = useState('');
  const [meetSlot, setMeetSlot] = useState('');
  const [requested, setRequested] = useState(false);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return collegeFilter === 'all' ? events : events.filter((e) => e.college === collegeFilter);
  }, [events, collegeFilter]);

  if (eventsLoading || collegesLoading) {
    return <PageLoading />;
  }

  function handleBookMeet(event: FormEvent) {
    event.preventDefault();
    if (!meetCollege || !meetSlot) return;
    setRequested(true);
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Sponsor Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        Upcoming events across partner colleges and meeting requests.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <CalendarClock size={16} /> Upcoming Events
            </h2>
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
            >
              <option value="all">All Colleges</option>
              {colleges?.map((college) => (
                <option key={college.id} value={college.name}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {filteredEvents.map((event) => (
              <div key={event.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-slate-800">{event.title}</p>
                <p className="text-xs text-slate-500">
                  {event.college} · {event.dateLabel}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <GraduationCap size={16} /> Colleges Directory
          </h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {colleges?.map((college) => (
              <div
                key={college.id}
                className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{college.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Users size={12} /> {college.studentCount} students
                  </p>
                </div>
                <Badge tone="blue">{college.activePhase}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Book a Meet</h2>
          <form onSubmit={handleBookMeet} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <select
              required
              value={meetCollege}
              onChange={(e) => setMeetCollege(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select a college
              </option>
              {colleges?.map((college) => (
                <option key={college.id} value={college.name}>
                  {college.name}
                </option>
              ))}
            </select>
            <Input
              type="datetime-local"
              required
              value={meetSlot}
              onChange={(e) => setMeetSlot(e.target.value)}
            />
            <Button type="submit">
              <Send size={16} /> Request Meeting
            </Button>
          </form>
          {requested && <p className="mt-3 text-xs text-green-600">Meeting request sent.</p>}
        </Card>
      </div>
    </div>
  );
}

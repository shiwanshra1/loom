import { CalendarClock, History, Lock, LockOpen } from 'lucide-react';
import { useAccessHistory, useMediaEvents, useRequestAccess } from '../../features/media/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/PageLoading';

export function DashboardPage() {
  const { data: events, isLoading: eventsLoading } = useMediaEvents();
  const { data: history, isLoading: historyLoading } = useAccessHistory();
  const requestAccessMutation = useRequestAccess();

  if (eventsLoading || historyLoading) {
    return <PageLoading />;
  }

  const list = events ?? [];

  function requestAccess(id: string) {
    requestAccessMutation.mutate(id);
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Media Partner Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        Request access to events and track your history.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <CalendarClock size={16} /> Events
          </h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {list.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">{event.dateLabel}</p>
                </div>
                {event.accessStatus === 'granted' && <Badge tone="green">Access Granted</Badge>}
                {event.accessStatus === 'requested' && <Badge tone="amber">Requested</Badge>}
                {event.accessStatus === 'none' && (
                  <Button variant="secondary" onClick={() => requestAccess(event.id)}>
                    <Lock size={14} /> Request Access
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <LockOpen size={16} /> Calendar Access
          </h2>
          <p className="text-sm text-slate-500">
            Calendar visibility follows the same request-access pattern as events — request access
            to a college or community's calendar to see their schedule here.
          </p>
          <Button variant="secondary" className="mt-4">
            <Lock size={14} /> Request Calendar Access
          </Button>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <History size={16} /> History
          </h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {history?.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{entry.itemTitle}</p>
                  <p className="text-xs text-slate-500">Requested {entry.requestedLabel}</p>
                </div>
                <Badge
                  tone={
                    entry.status === 'Approved'
                      ? 'green'
                      : entry.status === 'Denied'
                        ? 'red'
                        : 'amber'
                  }
                >
                  {entry.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

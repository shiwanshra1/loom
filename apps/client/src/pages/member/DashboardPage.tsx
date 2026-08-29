import { CalendarClock, MessageSquare } from 'lucide-react';
import { useMemberEvents, useMemberFeed, useRegisterForEvent } from '../../features/member/data';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/PageLoading';

export function DashboardPage() {
  const { data: feed, isLoading: feedLoading } = useMemberFeed();
  const { data: events, isLoading: eventsLoading } = useMemberEvents();
  const registerMutation = useRegisterForEvent();

  if (feedLoading || eventsLoading) {
    return <PageLoading />;
  }

  const list = events ?? [];

  function register(id: string) {
    registerMutation.mutate(id);
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Welcome</h1>
      <p className="mb-6 text-sm text-slate-500">Your feed, events, and calendar.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <MessageSquare size={16} /> Feed
          </h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {feed?.map((post) => (
              <div key={post.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-slate-800">{post.author}</p>
                <p className="text-sm text-slate-600">{post.content}</p>
                <p className="text-xs text-slate-400">{post.timeLabel}</p>
              </div>
            ))}
          </div>
        </Card>

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
                <Button
                  variant={event.registered ? 'secondary' : 'primary'}
                  disabled={event.registered}
                  onClick={() => register(event.id)}
                >
                  {event.registered ? 'Registered' : 'Register'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

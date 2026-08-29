import { useState, type FormEvent } from 'react';
import { CalendarPlus, MessageSquare, UserPlus } from 'lucide-react';
import type { EventType } from '@forge-loom/shared-types';
import {
  useCommunityFeed,
  useCommunityMembers,
  useHostEvent,
  useInviteMember,
} from '../../features/community/data';
import type { CommunityMemberRole } from '../../features/community/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

const EVENT_TYPES: { label: string; value: EventType }[] = [
  { label: 'Hackathon', value: 'hackathon' },
  { label: 'Seminar', value: 'seminar' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Other', value: 'other' },
];
const ROLE_BADGE: Record<CommunityMemberRole, 'blue' | 'green' | 'slate'> = {
  Lead: 'blue',
  Volunteer: 'green',
  Public: 'slate',
};

export function DashboardPage() {
  const { data: members, isLoading: membersLoading } = useCommunityMembers();
  const { data: feed, isLoading: feedLoading } = useCommunityFeed();
  const hostEvent = useHostEvent();
  const inviteMember = useInviteMember();

  const [eventType, setEventType] = useState<EventType>('hackathon');
  const [eventTitle, setEventTitle] = useState('');
  const [eventSlot, setEventSlot] = useState('');
  const [hosted, setHosted] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CommunityMemberRole>('Volunteer');
  const [invited, setInvited] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  if (membersLoading || feedLoading) {
    return <PageLoading />;
  }

  function handleHostEvent(event: FormEvent) {
    event.preventDefault();
    if (!eventTitle || !eventSlot) return;
    hostEvent.mutate(
      { title: eventTitle, type: eventType, scheduledAt: new Date(eventSlot).toISOString() },
      {
        onSuccess: () => {
          setHosted(true);
          setEventTitle('');
          setEventSlot('');
        },
      }
    );
  }

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!inviteEmail) return;
    setInviteError(null);
    inviteMember.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          setInvited(true);
          setInviteEmail('');
        },
        onError: () => setInviteError('No account found for that email.'),
      }
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Community Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        Host events, grow your community, and share updates.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <CalendarPlus size={16} /> Host an Event
          </h2>
          <form onSubmit={handleHostEvent} className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEventType(type.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    eventType === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="Event title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
            <Input
              type="datetime-local"
              value={eventSlot}
              onChange={(e) => setEventSlot(e.target.value)}
            />
            <Button type="submit" disabled={!eventTitle || !eventSlot || hostEvent.isPending}>
              {hostEvent.isPending
                ? 'Hosting...'
                : `Host ${EVENT_TYPES.find((t) => t.value === eventType)?.label}`}
            </Button>
            {hosted && <p className="text-xs text-green-600">Event created.</p>}
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <UserPlus size={16} /> Add Community Members
          </h2>
          <form onSubmit={handleInvite} className="mb-4 flex flex-wrap gap-2">
            <Input
              type="email"
              className="flex-1"
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CommunityMemberRole)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
            >
              <option value="Lead">Lead</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Public">Public</option>
            </select>
            <Button type="submit" disabled={!inviteEmail || inviteMember.isPending}>
              {inviteMember.isPending ? 'Inviting...' : 'Invite'}
            </Button>
          </form>
          {invited && <p className="mb-3 text-xs text-green-600">Member added.</p>}
          {inviteError && <p className="mb-3 text-xs text-red-600">{inviteError}</p>}
          <div className="flex flex-col divide-y divide-slate-100">
            {members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-slate-800">{member.name}</span>
                <Badge tone={ROLE_BADGE[member.role]}>{member.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
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
      </div>
    </div>
  );
}

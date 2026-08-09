import { useState, type FormEvent } from 'react';
import { CheckCircle2, FileUp, MapPin, Send, Star, UserPlus } from 'lucide-react';
import { useHrContacts, useSpeakerSessions } from '../../features/speaker/data';
import type { SpeakerSessionStatus } from '../../features/speaker/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

export function DashboardPage() {
  const { data: sessions, isLoading: sessionsLoading } = useSpeakerSessions();
  const { data: hrContacts, isLoading: hrLoading } = useHrContacts();
  const [tab, setTab] = useState<SpeakerSessionStatus>('Upcoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [topicSent, setTopicSent] = useState(false);

  const filtered = sessions?.filter((s) => s.status === tab) ?? [];
  const selected = sessions?.find((s) => s.id === selectedId) ?? filtered[0];

  if (sessionsLoading || hrLoading) {
    return <PageLoading />;
  }

  function handlePostTopic(event: FormEvent) {
    event.preventDefault();
    if (!topic) return;
    setTopicSent(true);
    setTopic('');
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Speaker Sessions</h1>
      <p className="mb-6 text-sm text-slate-500">Your sessions, feedback, and resources.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-0">
            <div className="px-4 pt-2">
              <Tabs
                tabs={[
                  { value: 'Upcoming', label: 'Upcoming' },
                  { value: 'Past', label: 'Past' },
                ]}
                value={tab}
                onChange={setTab}
              />
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
                  className={`flex items-center justify-between gap-3 py-4 text-left first:pt-0 last:pb-0 ${
                    (selected?.id ?? filtered[0]?.id) === session.id ? 'text-blue-700' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{session.title}</p>
                    <p className="text-xs text-slate-500">{session.dateLabel}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={12} /> {session.venue}
                    </p>
                  </div>
                  <Badge tone={session.status === 'Upcoming' ? 'blue' : 'slate'}>
                    {session.status}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          {selected && (
            <Card className="mt-6">
              <h2 className="mb-1 text-lg font-semibold text-slate-900">{selected.title}</h2>
              <p className="mb-4 text-sm text-slate-500">
                {selected.dateLabel} · {selected.venue}
              </p>

              <h3 className="mb-2 text-sm font-semibold text-slate-900">Agenda</h3>
              <div className="mb-4 flex flex-col gap-2">
                {selected.agenda.map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={14} className="text-slate-300" /> {item}
                  </span>
                ))}
              </div>

              {selected.feedbackAverage !== undefined && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  <Star size={14} className="fill-amber-500 text-amber-500" />{' '}
                  {selected.feedbackAverage} average from {selected.feedbackCount} attendees
                </div>
              )}

              <Button variant="secondary">
                <FileUp size={16} /> Upload Resource
              </Button>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Post a Topic</h2>
            <form onSubmit={handlePostTopic} className="flex flex-col gap-3">
              <Input
                placeholder="Propose a session topic"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setTopicSent(false);
                }}
              />
              <Button type="submit" disabled={!topic}>
                <Send size={14} /> Submit
              </Button>
              {topicSent && (
                <p className="text-xs text-green-600">Topic submitted for colleges to book.</p>
              )}
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-900">Connect HR</h2>
            <div className="flex flex-col divide-y divide-slate-100">
              {hrContacts?.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{contact.companyName}</p>
                    <p className="text-xs text-slate-500">{contact.contactName}</p>
                  </div>
                  <Button variant="secondary">
                    <UserPlus size={14} /> Request Intro
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

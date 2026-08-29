import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarClock, Send, Users } from 'lucide-react';
import {
  useCreateOpportunity,
  useHrCompanyProfile,
  useHrUpcomingEvents,
} from '../../features/hr/data';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

export function DashboardPage() {
  const { data: company, isLoading: companyLoading } = useHrCompanyProfile();
  const { data: events, isLoading: eventsLoading } = useHrUpcomingEvents();
  const createOpportunity = useCreateOpportunity();
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [posted, setPosted] = useState(false);

  if (companyLoading || eventsLoading) {
    return <PageLoading />;
  }

  function handlePost(event: FormEvent) {
    event.preventDefault();
    if (!role || !description) return;
    createOpportunity.mutate(
      { title: role, description },
      {
        onSuccess: () => {
          setPosted(true);
          setRole('');
          setDescription('');
        },
      }
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">HR Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        Manage your company profile, opportunities, and talent search.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Building2 size={16} /> Company Profile
          </h2>
          <p className="text-sm font-medium text-slate-900">{company?.companyName}</p>
          <p className="text-xs text-slate-500">{company?.industry}</p>
          <p className="mt-2 text-sm text-slate-600">{company?.description}</p>
          <Link to="/hr/talent-pool">
            <Button variant="secondary" className="mt-4 w-full">
              <Users size={16} /> Browse Talent Pool
            </Button>
          </Link>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <CalendarClock size={16} /> Upcoming Events
          </h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {events?.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-slate-800">{event.title}</span>
                <span className="text-xs text-slate-400">{event.dateLabel}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Post Opportunity</h2>
          <form onSubmit={handlePost} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role-title">
                Role Title
              </label>
              <Input
                id="role-title"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Intern"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="role-description"
              >
                Description
              </label>
              <Input
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role and evaluation criteria"
              />
            </div>
            <Button type="submit" className="sm:col-span-2" disabled={createOpportunity.isPending}>
              <Send size={16} /> {createOpportunity.isPending ? 'Posting...' : 'Post Opportunity'}
            </Button>
            {posted && <p className="text-xs text-green-600 sm:col-span-2">Opportunity posted.</p>}
          </form>
        </Card>
      </div>
    </div>
  );
}

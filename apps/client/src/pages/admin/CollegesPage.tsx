import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users } from 'lucide-react';
import type { CollegeDto } from '@forge-loom/shared-types';
import { useAdminColleges, useOnboardCollege } from '../../features/admin/data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/PageLoading';
import { ApiClientError } from '../../lib/apiClient';

const TIER_BADGE: Record<CollegeDto['partnerTier'], 'slate' | 'blue' | 'amber'> = {
  bronze: 'slate',
  silver: 'blue',
  gold: 'amber',
};

export function CollegesPage() {
  const { data: colleges, isLoading } = useAdminColleges();
  const onboardCollege = useOnboardCollege();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ adminEmail: string; tempPassword: string } | null>(null);

  function closeModal() {
    setModalOpen(false);
    setName('');
    setLocation('');
    setAdminEmail('');
    setAdminDisplayName('');
    setError(null);
    setResult(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    onboardCollege.mutate(
      { name, location: location || undefined, adminEmail, adminDisplayName },
      {
        onSuccess: (data) => {
          setResult({ adminEmail: data.collegeAdmin.email, tempPassword: data.tempPassword });
        },
        onError: (err) => {
          setError(
            err instanceof ApiClientError ? err.message : 'Could not onboard this college.'
          );
        },
      }
    );
  }

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Colleges</h1>
          <p className="text-sm text-slate-500">Onboard new colleges and their College Admins.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Onboard New College
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Building2} label="Colleges Onboarded" value={String(colleges?.length ?? 0)} />
        <StatCard
          icon={Users}
          label="Total Students"
          value={String(colleges?.reduce((sum, c) => sum + c.studentCount, 0) ?? 0)}
          iconClassName="bg-green-50 text-green-600"
        />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">All Colleges</h2>
        <div className="flex flex-col divide-y divide-slate-100">
          {colleges?.length === 0 && (
            <p className="py-4 text-sm text-slate-400">No colleges onboarded yet.</p>
          )}
          {colleges?.map((college) => (
            <Link
              key={college.id}
              to={`/admin/colleges/${college.id}`}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{college.name}</p>
                <p className="text-xs text-slate-500">
                  {college.adminEmail ?? 'No admin contact'} · {college.location ?? 'No location'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500">{college.studentCount} students</span>
                <span className="text-xs text-slate-500">{college.batchCount} batches</span>
                <Badge tone={TIER_BADGE[college.partnerTier]}>{college.partnerTier}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={closeModal}>
        {result ? (
          <div>
            <h2 className="mb-2 font-semibold text-slate-900">College Onboarded</h2>
            <p className="mb-4 text-sm text-slate-500">
              A welcome email is on its way to <strong>{result.adminEmail}</strong>. In case it
              doesn't arrive, here are the login details — shown once, not saved anywhere.
            </p>
            <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm">
              <p>
                <span className="text-slate-500">Email:</span> {result.adminEmail}
              </p>
              <p>
                <span className="text-slate-500">Temporary password:</span>{' '}
                <span className="font-mono">{result.tempPassword}</span>
              </p>
            </div>
            <Button onClick={closeModal}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h2 className="mb-1 font-semibold text-slate-900">Onboard New College</h2>
            <Input
              placeholder="College name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Input
              type="email"
              placeholder="College Admin email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
            <Input
              placeholder="College Admin name"
              required
              value={adminDisplayName}
              onChange={(e) => setAdminDisplayName(e.target.value)}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={onboardCollege.isPending}>
                {onboardCollege.isPending ? 'Onboarding...' : 'Onboard College'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { useCollegeFaculty, useCreateMentor, useCreateTrainer } from '../../features/college/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/PageLoading';
import { DataTable } from '../../components/ui/DataTable';
import { ApiClientError } from '../../lib/apiClient';

type InviteRole = 'mentor' | 'trainer';

export function FacultyPage() {
  const { data: faculty, isLoading } = useCollegeFaculty();
  const createMentor = useCreateMentor();
  const createTrainer = useCreateTrainer();

  const [inviteRole, setInviteRole] = useState<InviteRole | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const activeMutation = inviteRole === 'mentor' ? createMentor : createTrainer;

  function closeModal() {
    setInviteRole(null);
    setEmail('');
    setDisplayName('');
    setError(null);
    setResult(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    activeMutation.mutate(
      { email, displayName },
      {
        onSuccess: (data) => setResult({ email: data.user.email, tempPassword: data.tempPassword }),
        onError: (err) => {
          setError(
            err instanceof ApiClientError ? err.message : 'Could not invite this person.'
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
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Faculty</h1>
          <p className="text-sm text-slate-500">Mentors and trainers at your college.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setInviteRole('mentor')}>
            <Plus size={16} /> Invite Mentor
          </Button>
          <Button variant="secondary" onClick={() => setInviteRole('trainer')}>
            <Plus size={16} /> Invite Trainer
          </Button>
        </div>
      </div>

      <StatCard icon={GraduationCap} label="Faculty" value={String(faculty?.length ?? 0)} />

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">All Faculty</h2>
        <DataTable
          rows={faculty ?? []}
          rowKey={(f) => f.userId}
          emptyMessage="No trainers or mentors added yet."
          columns={[
            { key: 'email', header: 'Email', render: (f) => f.email },
            {
              key: 'role',
              header: 'Role',
              render: (f) => <Badge tone={f.role === 'trainer' ? 'blue' : 'purple'}>{f.role}</Badge>,
            },
            {
              key: 'workload',
              header: 'Workload',
              render: (f) => `${f.workload} ${f.role === 'trainer' ? 'teams' : 'students'}`,
            },
          ]}
        />
      </Card>

      <Modal open={inviteRole !== null} onClose={closeModal}>
        {result ? (
          <div>
            <h2 className="mb-2 font-semibold text-slate-900">Invite Sent</h2>
            <p className="mb-4 text-sm text-slate-500">
              A welcome email is on its way to <strong>{result.email}</strong>. In case it doesn't
              arrive, here are the login details — shown once, not saved anywhere.
            </p>
            <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm">
              <p>
                <span className="text-slate-500">Email:</span> {result.email}
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
            <h2 className="mb-1 capitalize font-semibold text-slate-900">Invite {inviteRole}</h2>
            <Input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={activeMutation.isPending}>
                {activeMutation.isPending ? 'Inviting...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

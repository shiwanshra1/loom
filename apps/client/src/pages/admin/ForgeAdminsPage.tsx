import { useState, type FormEvent } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { useCreateForgeAdmin, useForgeAdmins } from '../../features/admin/data';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/PageLoading';
import { ApiClientError } from '../../lib/apiClient';

export function ForgeAdminsPage() {
  const { data: forgeAdmins, isLoading } = useForgeAdmins();
  const createForgeAdmin = useCreateForgeAdmin();

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  function closeModal() {
    setModalOpen(false);
    setEmail('');
    setDisplayName('');
    setError(null);
    setResult(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    createForgeAdmin.mutate(
      { email, displayName },
      {
        onSuccess: (data) => {
          setResult({ email: data.forgeAdmin.email, tempPassword: data.tempPassword });
        },
        onError: (err) => {
          setError(err instanceof ApiClientError ? err.message : 'Could not create this account.');
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
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Forge Admins</h1>
          <p className="text-sm text-slate-500">Platform-level operators with national oversight.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Forge Admin
        </Button>
      </div>

      <StatCard icon={ShieldCheck} label="Forge Admins" value={String(forgeAdmins?.length ?? 0)} />

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">All Forge Admins</h2>
        <div className="flex flex-col divide-y divide-slate-100">
          {forgeAdmins?.length === 0 && (
            <p className="py-4 text-sm text-slate-400">No peer Forge Admins yet.</p>
          )}
          {forgeAdmins?.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <p className="text-sm font-medium text-slate-800">{admin.email}</p>
              <p className="text-xs text-slate-500">
                Added {new Date(admin.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={closeModal}>
        {result ? (
          <div>
            <h2 className="mb-2 font-semibold text-slate-900">Forge Admin Created</h2>
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
            <h2 className="mb-1 font-semibold text-slate-900">Add Forge Admin</h2>
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
              <Button type="submit" disabled={createForgeAdmin.isPending}>
                {createForgeAdmin.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

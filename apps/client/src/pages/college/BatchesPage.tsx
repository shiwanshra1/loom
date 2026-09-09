import { useState, type FormEvent } from 'react';
import { Layers, Plus } from 'lucide-react';
import type { CohortDto } from '@forge-loom/shared-types';
import { useCollegeBatches, useCreateBatch } from '../../features/college/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/PageLoading';
import { DataTable } from '../../components/ui/DataTable';
import { ApiClientError } from '../../lib/apiClient';

const PHASE_BADGE: Record<CohortDto['phase'], 'slate' | 'blue' | 'purple'> = {
  activation: 'slate',
  bootcamp: 'blue',
  citadel: 'purple',
};

export function BatchesPage() {
  const { data: batches, isLoading } = useCollegeBatches();
  const createBatch = useCreateBatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    setModalOpen(false);
    setName('');
    setStartDate('');
    setEndDate('');
    setError(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    createBatch.mutate(
      { name, startDate, endDate },
      {
        onSuccess: closeModal,
        onError: (err) => {
          setError(err instanceof ApiClientError ? err.message : 'Could not create this batch.');
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
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Batches</h1>
          <p className="text-sm text-slate-500">Cohorts your students are grouped into.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New Batch
        </Button>
      </div>

      <StatCard icon={Layers} label="Batches" value={String(batches?.length ?? 0)} />

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">All Batches</h2>
        <DataTable
          rows={batches ?? []}
          rowKey={(batch) => batch.id}
          emptyMessage="No batches created yet."
          columns={[
            { key: 'name', header: 'Name', render: (b) => <span className="font-medium text-slate-800">{b.name}</span> },
            {
              key: 'dates',
              header: 'Dates',
              render: (b) =>
                `${new Date(b.startDate).toLocaleDateString()} – ${new Date(b.endDate).toLocaleDateString()}`,
            },
            {
              key: 'phase',
              header: 'Phase',
              render: (b) => <Badge tone={PHASE_BADGE[b.phase]}>{b.phase}</Badge>,
            },
          ]}
        />
      </Card>

      <Modal open={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h2 className="mb-1 font-semibold text-slate-900">New Batch</h2>
          <Input placeholder="Batch name" required value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Start date</label>
            <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">End date</label>
            <Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBatch.isPending}>
              {createBatch.isPending ? 'Creating...' : 'Create Batch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

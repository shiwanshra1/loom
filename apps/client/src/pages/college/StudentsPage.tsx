import { useState, type FormEvent } from 'react';
import { Mail, Plus, UploadCloud, Users } from 'lucide-react';
import type { BulkCreateStudentResultRowDto, BulkStudentRowInput } from '@forge-loom/shared-types';
import {
  useBulkCreateStudents,
  useCollegeBatches,
  useCollegeStudents,
  useCreateStudent,
  useSendWelcomeEmails,
  useUpdateStudentBatch,
} from '../../features/college/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageLoading } from '../../components/ui/PageLoading';
import { DataTable } from '../../components/ui/DataTable';
import { FileDropInput } from '../../components/ui/FileDropInput';
import { parseStudentCsv, type StudentCsvRow } from '../../lib/parseCsv';
import { ApiClientError } from '../../lib/apiClient';

const UNASSIGNED = '__unassigned__';

export function StudentsPage() {
  const { data: students, isLoading: studentsLoading } = useCollegeStudents();
  const { data: batches, isLoading: batchesLoading } = useCollegeBatches();
  const createStudent = useCreateStudent();
  const updateBatch = useUpdateStudentBatch();
  const bulkCreate = useBulkCreateStudents();
  const sendWelcomeEmails = useSendWelcomeEmails();

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const [csvRows, setCsvRows] = useState<StudentCsvRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [bulkRows, setBulkRows] = useState<BulkCreateStudentResultRowDto[] | null>(null);
  const [emailsSentCount, setEmailsSentCount] = useState<number | null>(null);

  function handleCsvFile(file: File) {
    setBulkRows(null);
    setEmailsSentCount(null);
    const reader = new FileReader();
    reader.onload = () => {
      const { rows, errors } = parseStudentCsv(String(reader.result ?? ''));
      setCsvRows(rows);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  }

  function resolveCohortId(batchName?: string): string | undefined {
    if (!batchName) return undefined;
    return batches?.find((b) => b.name.toLowerCase() === batchName.toLowerCase())?.id;
  }

  function handleBulkUpload() {
    const rows: BulkStudentRowInput[] = csvRows.map((row) => ({
      name: row.name,
      email: row.email,
      rollNumber: row.rollNumber,
      cohortId: resolveCohortId(row.batchName),
    }));
    bulkCreate.mutate(rows, {
      onSuccess: (data) => setBulkRows(data.results),
    });
  }

  function handleSendWelcomeEmails() {
    if (!bulkRows) return;
    const accounts = bulkRows
      .filter((row) => row.status === 'created' && row.userId && row.tempPassword && row.displayName)
      .map((row) => ({
        userId: row.userId!,
        email: row.email,
        displayName: row.displayName!,
        tempPassword: row.tempPassword!,
      }));
    sendWelcomeEmails.mutate(accounts, {
      onSuccess: (data) => setEmailsSentCount(data.sent),
    });
  }

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
    createStudent.mutate(
      { email, displayName },
      {
        onSuccess: (data) => setResult({ email: data.user.email, tempPassword: data.tempPassword }),
        onError: (err) => {
          setError(err instanceof ApiClientError ? err.message : 'Could not add this student.');
        },
      }
    );
  }

  if (studentsLoading || batchesLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">Your college's roster and batch assignments.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Student
        </Button>
      </div>

      <StatCard icon={Users} label="Students" value={String(students?.length ?? 0)} />

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold text-slate-900">Roster</h2>
        <DataTable
          rows={students ?? []}
          rowKey={(s) => s.userId}
          emptyMessage="No students added yet."
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (s) => (
                <div>
                  <p className="font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </div>
              ),
            },
            { key: 'rollNumber', header: 'Roll No.', render: (s) => s.rollNumber ?? '—' },
            {
              key: 'batch',
              header: 'Batch',
              render: (s) => (
                <select
                  value={s.cohortId ?? UNASSIGNED}
                  onChange={(e) =>
                    updateBatch.mutate({
                      studentUserId: s.userId,
                      cohortId: e.target.value === UNASSIGNED ? null : e.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                >
                  <option value={UNASSIGNED}>No batch</option>
                  {batches?.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              ),
            },
          ]}
        />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
          <UploadCloud size={16} /> Bulk Upload
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          CSV columns: <code className="rounded bg-slate-100 px-1">name</code>,{' '}
          <code className="rounded bg-slate-100 px-1">email</code>,{' '}
          <code className="rounded bg-slate-100 px-1">rollNumber</code> (optional),{' '}
          <code className="rounded bg-slate-100 px-1">batch</code> (optional, matched by name).
        </p>

        <FileDropInput onFile={handleCsvFile} />

        {csvErrors.length > 0 && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {csvErrors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        {csvRows.length > 0 && !bulkRows && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">{csvRows.length} row(s) ready to upload.</p>
            <Button onClick={handleBulkUpload} disabled={bulkCreate.isPending}>
              {bulkCreate.isPending ? 'Uploading...' : `Upload ${csvRows.length} Students`}
            </Button>
          </div>
        )}

        {bulkRows && (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {bulkRows.filter((r) => r.status === 'created').length} created,{' '}
                {bulkRows.filter((r) => r.status === 'error').length} failed.
              </p>
              {emailsSentCount === null ? (
                <Button
                  variant="secondary"
                  onClick={handleSendWelcomeEmails}
                  disabled={
                    sendWelcomeEmails.isPending ||
                    !bulkRows.some((r) => r.status === 'created')
                  }
                >
                  <Mail size={14} />{' '}
                  {sendWelcomeEmails.isPending ? 'Sending...' : 'Send Welcome Emails'}
                </Button>
              ) : (
                <p className="text-xs text-green-600">{emailsSentCount} welcome email(s) queued.</p>
              )}
            </div>
            <DataTable
              rows={bulkRows}
              rowKey={(r) => `${r.index}-${r.email}`}
              columns={[
                { key: 'email', header: 'Email', render: (r) => r.email },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => (
                    <Badge tone={r.status === 'created' ? 'green' : 'red'}>{r.status}</Badge>
                  ),
                },
                {
                  key: 'detail',
                  header: 'Detail',
                  render: (r) =>
                    r.status === 'error' ? (
                      <span className="text-red-600">{r.error}</span>
                    ) : (
                      <span className="font-mono text-xs">{r.tempPassword}</span>
                    ),
                },
              ]}
            />
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={closeModal}>
        {result ? (
          <div>
            <h2 className="mb-2 font-semibold text-slate-900">Student Added</h2>
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
            <h2 className="mb-1 font-semibold text-slate-900">Add Student</h2>
            <Input
              type="email"
              placeholder="Student email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Full name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStudent.isPending}>
                {createStudent.isPending ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

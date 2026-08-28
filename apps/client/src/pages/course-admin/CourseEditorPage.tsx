import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { CourseDeliveryMode, SyllabusDayDto } from '@forge-loom/shared-types';
import {
  useCourse,
  useCreateCourse,
  useUpdateCourse,
  useUpdateCourseStatus,
} from '../../features/course-admin/hooks';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/PageLoading';

function renumber(days: SyllabusDayDto[]): SyllabusDayDto[] {
  return days.map((day, index) => ({ ...day, dayNumber: index + 1 }));
}

export function CourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useCourse(id);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(id ?? '');
  const updateStatus = useUpdateCourseStatus(id ?? '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<CourseDeliveryMode>('online');
  const [durationHours, setDurationHours] = useState('0');
  const [durationDays, setDurationDays] = useState('0');
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('INR');
  const [syllabus, setSyllabus] = useState<SyllabusDayDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description ?? '');
    setDeliveryMode(existing.deliveryMode);
    setDurationHours(String(existing.durationHours));
    setDurationDays(String(existing.durationDays));
    setPrice(String(existing.price));
    setCurrency(existing.currency);
    setSyllabus(existing.syllabus);
  }, [existing]);

  if (isEditing && isLoading) {
    return <PageLoading />;
  }

  function addDay() {
    setSyllabus((prev) =>
      renumber([...prev, { dayNumber: prev.length + 1, title: '', description: '' }])
    );
  }

  function removeDay(index: number) {
    setSyllabus((prev) => renumber(prev.filter((_, i) => i !== index)));
  }

  function moveDay(index: number, direction: -1 | 1) {
    setSyllabus((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const day = next[index];
      const swapWith = next[target];
      if (!day || !swapWith) return prev;
      next[index] = swapWith;
      next[target] = day;
      return renumber(next);
    });
  }

  function updateDay(index: number, patch: Partial<SyllabusDayDto>) {
    setSyllabus((prev) => prev.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);

    const input = {
      title,
      description: description || undefined,
      deliveryMode,
      durationHours: Number(durationHours),
      durationDays: Number(durationDays),
      price: Number(price),
      currency,
      syllabus,
    };

    try {
      if (isEditing) {
        await updateCourse.mutateAsync(input);
        setSaved(true);
      } else {
        const course = await createCourse.mutateAsync(input);
        navigate(`/course-admin/courses/${course.id}/edit`, { replace: true });
      }
    } catch {
      setError('Could not save the course. Please check the fields and try again.');
    }
  }

  async function handlePublish() {
    setError(null);
    try {
      await updateStatus.mutateAsync('published');
    } catch {
      setError('Could not publish this course.');
    }
  }

  async function handleArchive() {
    setError(null);
    try {
      await updateStatus.mutateAsync('archived');
    } catch {
      setError('Could not archive this course.');
    }
  }

  const isSaving = createCourse.isPending || updateCourse.isPending;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {isEditing ? 'Edit Course' : 'New Course'}
          </h1>
          <p className="text-sm text-slate-500">
            Set the course details and build its day-by-day syllabus.
          </p>
        </div>
        {existing && (
          <Badge tone={existing.status === 'published' ? 'green' : 'slate'}>
            {existing.status}
          </Badge>
        )}
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full Stack Web Development"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn?"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Delivery Mode</label>
            <select
              value={deliveryMode}
              onChange={(e) => setDeliveryMode(e.target.value as CourseDeliveryMode)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="INR"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Duration (hours)
            </label>
            <Input
              type="number"
              min={0}
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Duration (days)</label>
            <Input
              type="number"
              min={0}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Price</label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Syllabus</h2>
          <Button variant="secondary" onClick={addDay}>
            <Plus size={14} /> Add Day
          </Button>
        </div>

        {syllabus.length === 0 && (
          <p className="text-sm text-slate-400">No syllabus days yet — add the first one.</p>
        )}

        <div className="flex flex-col gap-3">
          {syllabus.map((day, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Day {day.dayNumber}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveDay(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDay(index, 1)}
                    disabled={index === syllabus.length - 1}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDay(index)}
                    className="rounded p-1 text-red-400 hover:bg-red-50"
                    aria-label="Remove day"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <Input
                className="mb-2"
                placeholder="Day title"
                value={day.title}
                onChange={(e) => updateDay(index, { title: e.target.value })}
              />
              <Input
                placeholder="Day description (optional)"
                value={day.description ?? ''}
                onChange={(e) => updateDay(index, { description: e.target.value })}
              />
            </div>
          ))}
        </div>
      </Card>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {saved && <p className="mb-4 text-sm text-green-600">Saved.</p>}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={isSaving || !title}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        {isEditing && existing?.status === 'draft' && (
          <Button variant="secondary" onClick={handlePublish} disabled={updateStatus.isPending}>
            Publish
          </Button>
        )}
        {isEditing && existing?.status === 'published' && (
          <Button variant="secondary" onClick={handleArchive} disabled={updateStatus.isPending}>
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}

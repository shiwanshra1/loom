import { Card } from '../components/ui/Card';

export function PlaceholderPage({ title, note }: { title: string; note?: string }) {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {note ?? 'This section is coming in a later build phase.'}
      </p>
    </Card>
  );
}

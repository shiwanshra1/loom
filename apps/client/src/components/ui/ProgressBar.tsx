export function ProgressBar({
  percent,
  colorClassName = 'bg-blue-600',
}: {
  percent: number;
  colorClassName?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${colorClassName}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

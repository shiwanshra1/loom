import type { ReactNode } from 'react';

export type BadgeTone = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple';

const TONE_CLASSES: Record<BadgeTone, string> = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-50 text-purple-700',
};

export function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

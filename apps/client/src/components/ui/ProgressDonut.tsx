interface ProgressDonutProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  trackColor?: string;
  progressColor?: string;
}

export function ProgressDonut({
  percent,
  size = 96,
  strokeWidth = 10,
  label,
  trackColor = '#e2e8f0',
  progressColor = '#2563eb',
}: ProgressDonutProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-slate-900">
        {label ?? `${Math.round(clamped)}%`}
      </div>
    </div>
  );
}

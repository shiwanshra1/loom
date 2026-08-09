interface SimpleLineChartProps {
  points: number[];
  labels?: string[];
  height?: number;
}

export function SimpleLineChart({ points, labels, height = 160 }: SimpleLineChartProps) {
  const width = 320;
  const paddingX = 8;
  const paddingY = 12;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const step = points.length > 1 ? usableWidth / (points.length - 1) : 0;
  const coords = points.map((value, index) => {
    const x = paddingX + step * index;
    const y = paddingY + usableHeight * (1 - Math.min(100, Math.max(0, value)) / 100);
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const lastCoord = coords[coords.length - 1];
  const areaPath = lastCoord
    ? `${linePath} L${lastCoord[0]},${height - paddingY} L${paddingX},${height - paddingY} Z`
    : '';

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <path d={areaPath} fill="#dbeafe" opacity={0.6} />
        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r={3} fill="#2563eb" />
        ))}
      </svg>
      {labels && (
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          {labels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

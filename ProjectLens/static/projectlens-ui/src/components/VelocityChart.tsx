interface Props { history: number[] }

export default function VelocityChart({ history }: Props) {
  if (history.length === 0) return null;

  const avg = history.reduce((s, v) => s + v, 0) / history.length;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const last = history[history.length - 1];

  let trend: string;
  let trendClass: string;
  if (last > avg * 1.1) {
    trend = '▲'; trendClass = 'text-teal-600';
  } else if (last < avg * 0.9) {
    trend = '▼'; trendClass = 'text-amber-600';
  } else {
    trend = '→'; trendClass = 'text-gray-400';
  }

  const svgH = 80;
  const barW = 24;
  const gap = 6;
  const svgW = history.length * (barW + gap) - gap;

  return (
    <div>
      <svg
        width={svgW}
        height={svgH + 2}
        className="block"
        aria-label="Velocity history bar chart"
        role="img"
      >
        {/* baseline */}
        <line x1={0} y1={svgH} x2={svgW} y2={svgH} stroke="#E2E8F0" strokeWidth={1} />
        {history.map((v, i) => {
          const barH = max > 0 ? Math.max(4, Math.round((v / max) * svgH)) : 4;
          const x = i * (barW + gap);
          const y = svgH - barH;
          const fill = v >= avg ? '#14B8A6' : '#F59E0B';
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={fill}
            />
          );
        })}
      </svg>
      <div className="flex gap-5 text-xs text-gray-500 mt-2">
        <span>Avg: <strong className="text-gray-700">{Math.round(avg)}</strong></span>
        <span>Min: <strong className="text-gray-700">{min}</strong></span>
        <span>Max: <strong className="text-gray-700">{max}</strong></span>
        <span>Trend: <strong className={trendClass}>{trend}</strong></span>
      </div>
    </div>
  );
}

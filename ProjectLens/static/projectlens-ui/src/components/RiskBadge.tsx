import type { RiskLevel } from '../types/viewModels';

const classes: Record<RiskLevel, string> = {
  HIGH:   'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW:    'bg-green-100 text-green-800',
};

const icons: Record<RiskLevel, string> = {
  HIGH: '▲', MEDIUM: '●', LOW: '▼',
};

interface Props { level: RiskLevel; score?: number }

export default function RiskBadge({ level, score }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${classes[level]}`}
      aria-label={`Risk level: ${level}`}
    >
      {icons[level]} {level}{score !== undefined ? ` (${score})` : ''}
    </span>
  );
}

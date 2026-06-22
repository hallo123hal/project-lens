import type { RiskLevel } from '../types/viewModels';

const classes: Record<RiskLevel, string> = {
  HIGH:   'bg-[var(--risk-high-bg)] text-[var(--risk-high-text)]',
  MEDIUM: 'bg-[var(--risk-med-bg)] text-[var(--risk-med-text)]',
  LOW:    'bg-[var(--risk-low-bg)] text-[var(--risk-low-text)]',
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

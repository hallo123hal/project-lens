import { scoreColor } from '../utils/scoreColor';

const badgeClasses = {
  low:    'bg-[var(--risk-low-bg)] text-[var(--risk-low-text)]',
  medium: 'bg-[var(--risk-med-bg)] text-[var(--risk-med-text)]',
  high:   'bg-[var(--risk-high-bg)] text-[var(--risk-high-text)]',
};

interface Props { score: number; large?: boolean }

export default function ScoreBadge({ score, large = false }: Props) {
  const level = scoreColor(score);
  const size = large
    ? 'text-2xl font-bold px-3 py-1 rounded-md'
    : 'text-xs font-semibold px-2 py-0.5 rounded';
  return (
    <span className={`inline-flex items-center ${size} ${badgeClasses[level]}`}>
      {score}
    </span>
  );
}

import { scoreColor } from '../utils/scoreColor';

const badgeClasses = {
  low:    'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high:   'bg-red-100 text-red-800',
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

interface Props { probability: number | null; confidence: string; large?: boolean }

export default function ProbabilityBadge({ probability, confidence, large = false }: Props) {
  if (probability === null) {
    return <span className="text-gray-400 text-sm">—</span>;
  }
  return (
    <div className="flex flex-col leading-tight">
      <span className={`font-semibold text-gray-800 ${large ? 'text-3xl' : 'text-sm'}`}>
        {probability}%
      </span>
      <span className="text-xs text-gray-400 mt-0.5">{confidence}</span>
    </div>
  );
}

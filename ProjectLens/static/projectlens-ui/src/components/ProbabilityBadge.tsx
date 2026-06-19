interface Props { probability: number | null; confidence: string }

export default function ProbabilityBadge({ probability, confidence }: Props) {
  if (probability === null) return <span style={{ color: '#626F86', fontSize: 12 }}>—</span>;
  return (
    <span style={{ fontSize: 12 }} title={`Confidence: ${confidence}`}>
      {probability}% <span style={{ color: '#626F86' }}>({confidence})</span>
    </span>
  );
}

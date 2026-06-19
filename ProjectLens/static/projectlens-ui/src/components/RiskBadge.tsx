import type { RiskLevel } from '../types/viewModels';

const styles: Record<RiskLevel, { background: string; color: string; label: string; icon: string }> = {
  HIGH:   { background: '#FFEBE6', color: '#AE2A19', label: 'HIGH',   icon: '▲' },
  MEDIUM: { background: '#FFF7D6', color: '#7F5F01', label: 'MEDIUM', icon: '●' },
  LOW:    { background: '#DFFCF0', color: '#1F845A', label: 'LOW',    icon: '▼' },
};

interface Props { level: RiskLevel; score?: number }

export default function RiskBadge({ level, score }: Props) {
  const s = styles[level];
  return (
    <span style={{ background: s.background, color: s.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}
          aria-label={`Risk level: ${s.label}`}>
      {s.icon} {s.label}{score !== undefined ? ` (${score})` : ''}
    </span>
  );
}

import type { WarningItem } from '../types/viewModels';

interface Props { warnings: WarningItem[] }

export default function WarningList({ warnings }: Props) {
  if (warnings.length === 0) return null;
  return (
    <ul style={{ padding: '8px 16px', background: '#FFF7D6', borderRadius: 4, margin: '8px 0', listStyle: 'none' }}>
      {warnings.map((w, i) => (
        <li key={i} style={{ fontSize: 12, color: '#7F5F01' }}>⚠ {w.message}</li>
      ))}
    </ul>
  );
}

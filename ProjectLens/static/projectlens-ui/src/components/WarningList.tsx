import type { WarningItem } from '../types/viewModels';

interface Props { warnings: WarningItem[] }

export default function WarningList({ warnings }: Props) {
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 mb-3 space-y-1">
      {warnings.map((w) => (
        <p key={w.code} className="text-sm text-amber-800 flex items-start gap-2 m-0">
          <span className="shrink-0">⚠</span>
          <span>{w.message}</span>
        </p>
      ))}
    </div>
  );
}

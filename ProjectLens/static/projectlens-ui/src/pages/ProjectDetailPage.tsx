import { useEffect, useState } from 'react';
import { getProjectRiskDetail } from '../api/forgeApi';
import RiskBadge from '../components/RiskBadge';
import ScoreBadge from '../components/ScoreBadge';
import ProbabilityBadge from '../components/ProbabilityBadge';
import VelocityChart from '../components/VelocityChart';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import WarningList from '../components/WarningList';
import { scoreColor } from '../utils/scoreColor';

interface BlockedIssue { key: string; summary: string; daysBlocked: number }

interface DetailData {
  project: {
    projectKey: string;
    projectName: string;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    sprintName: string | null;
    completionProbability: number | null;
    completionConfidence: string;
  };
  breakdown: { blockedRisk: number; velocityRisk: number; scopeCreepRisk: number; unassignedRisk: number };
  blockedIssues: BlockedIssue[];
  velocityHistory: number[];
  scopeCreepPercent: number;
  unassignedCount: number;
  recommendations: string[];
  warnings: { code: string; message: string; severity: 'warning' | 'info' }[];
  partial: boolean;
}

const topBorder: Record<string, string> = {
  HIGH:   'border-t-red-400',
  MEDIUM: 'border-t-yellow-400',
  LOW:    'border-t-green-400',
};

const barColor: Record<string, string> = {
  low:    'bg-green-400',
  medium: 'bg-yellow-400',
  high:   'bg-red-400',
};

function BreakdownCard({ label, score }: { label: string; score: number }) {
  const level = scoreColor(score);
  return (
    <div className="rounded-lg shadow-sm border border-gray-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 m-0 mb-2">{label}</p>
      <ScoreBadge score={score} large />
      <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor[level]} w-[var(--w)]`}
          style={{ '--w': `${score}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

interface Props { projectKey: string; onBack: () => void }

export default function ProjectDetailPage({ projectKey, onBack }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [data, setData] = useState<DetailData | null>(null);

  useEffect(() => {
    getProjectRiskDetail(projectKey)
      .then(result => { setData(result.data as DetailData); setStatus('loaded'); })
      .catch(() => setStatus('error'));
  }, [projectKey]);

  return (
    <div className="p-6 max-w-4xl">
      <button
        onClick={onBack}
        className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0 text-sm mb-5 block"
      >
        ← Back to Dashboard
      </button>

      {status === 'loading' && <LoadingState message="Loading project risk detail…" />}
      {status === 'error' && <EmptyState title="Failed to load project detail" />}

      {status === 'loaded' && data && (
        <>
          {/* Header card */}
          <div className={`rounded-lg border border-gray-200 border-t-4 ${topBorder[data.project.riskLevel]} bg-white p-5 mb-5 shadow-sm`}>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 m-0">{data.project.projectName}</h1>
              <RiskBadge level={data.project.riskLevel} score={data.project.riskScore} />
              {data.project.sprintName && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                  {data.project.sprintName}
                </span>
              )}
            </div>
          </div>

          {data.partial && (
            <WarningList warnings={[{ code: 'PARTIAL', message: 'Partial data — some signals could not be analyzed.', severity: 'warning' }]} />
          )}
          <WarningList warnings={data.warnings} />

          {/* Risk Breakdown */}
          <section className="mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 m-0">Risk Breakdown</h2>
            <div className="grid grid-cols-2 gap-3">
              <BreakdownCard label="Blocked Issues"  score={data.breakdown.blockedRisk} />
              <BreakdownCard label="Velocity Drop"   score={data.breakdown.velocityRisk} />
              <BreakdownCard label="Scope Creep"     score={data.breakdown.scopeCreepRisk} />
              <BreakdownCard label="Unassigned Work" score={data.breakdown.unassignedRisk} />
            </div>
          </section>

          {/* Sprint Completion */}
          <section className="mb-5 bg-white rounded-lg border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 m-0">Sprint Completion Prediction</h2>
            <div className="flex items-start gap-8">
              <ProbabilityBadge
                probability={data.project.completionProbability}
                confidence={data.project.completionConfidence}
                large
              />
              {data.project.sprintName && (
                <p className="text-sm text-gray-500 mt-1 m-0">
                  Sprint: <span className="font-medium text-gray-700">{data.project.sprintName}</span>
                </p>
              )}
            </div>
          </section>

          {/* Velocity History */}
          <section className="mb-5 bg-white rounded-lg border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 m-0">Velocity History</h2>
            {data.velocityHistory.length > 0
              ? <VelocityChart history={data.velocityHistory} />
              : <p className="text-sm text-gray-400 m-0">Insufficient sprint history for velocity analysis.</p>
            }
          </section>

          {/* Blocked Issues */}
          {data.blockedIssues.length > 0 && (
            <section className="mb-5 bg-white rounded-lg border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 m-0">Blocked Issues</h2>
              <div className="space-y-2">
                {data.blockedIssues.map(i => (
                  <div key={i.key} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">{i.key}</span>
                    <span className="text-gray-700 flex-1 min-w-0 truncate">{i.summary}</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0">{i.daysBlocked}d blocked</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <section className="bg-blue-50 rounded-lg p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-3 m-0">Recommendations</h2>
              <div className="space-y-2">
                {data.recommendations.map((r, i) => (
                  <p key={i} className="text-sm text-blue-800 flex gap-2 m-0">
                    <span className="shrink-0 font-bold">→</span>
                    <span>{r}</span>
                  </p>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

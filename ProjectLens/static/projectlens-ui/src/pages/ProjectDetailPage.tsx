import { useEffect, useState } from 'react';
import { getProjectRiskDetail } from '../api/forgeApi';
import RiskBadge from '../components/RiskBadge';
import ProbabilityBadge from '../components/ProbabilityBadge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import WarningList from '../components/WarningList';

interface BlockedIssue { key: string; summary: string; daysBlocked: number }
interface DetailData {
  project: { projectKey: string; projectName: string; riskScore: number; riskLevel: 'LOW'|'MEDIUM'|'HIGH'; sprintName: string|null; completionProbability: number|null; completionConfidence: string };
  breakdown: { blockedRisk: number; velocityRisk: number; scopeCreepRisk: number; unassignedRisk: number };
  blockedIssues: BlockedIssue[];
  velocityHistory: number[];
  scopeCreepPercent: number;
  unassignedCount: number;
  recommendations: string[];
  warnings: { code: string; message: string; severity: 'warning'|'info' }[];
  partial: boolean;
}

interface Props { projectKey: string; onBack: () => void }

export default function ProjectDetailPage({ projectKey, onBack }: Props) {
  const [status, setStatus] = useState<'loading'|'loaded'|'error'>('loading');
  const [data, setData] = useState<DetailData | null>(null);

  useEffect(() => {
    getProjectRiskDetail(projectKey)
      .then(result => { setData(result.data as DetailData); setStatus('loaded'); })
      .catch(() => setStatus('error'));
  }, [projectKey]);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 900 }}>
      <button onClick={onBack} style={{ marginBottom: 16, cursor: 'pointer' }}>← Back to Dashboard</button>
      {status === 'loading' && <LoadingState message="Loading project risk detail…" />}
      {status === 'error' && <EmptyState title="Failed to load project detail" />}
      {status === 'loaded' && data && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 20 }}>{data.project.projectName}</h1>
            <RiskBadge level={data.project.riskLevel} score={data.project.riskScore} />
          </div>
          {data.partial && <WarningList warnings={[{ code: 'PARTIAL', message: 'Partial data — some signals could not be analyzed.', severity: 'warning' }]} />}
          <WarningList warnings={data.warnings} />

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16 }}>Risk Breakdown</h2>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
              <thead><tr style={{ borderBottom: '1px solid #DFE1E6' }}><th style={{ textAlign: 'left', padding: '6px 12px' }}>Signal</th><th style={{ padding: '6px 12px' }}>Score</th></tr></thead>
              <tbody>
                {[['Blocked Issues', data.breakdown.blockedRisk],['Velocity Drop', data.breakdown.velocityRisk],['Scope Creep', data.breakdown.scopeCreepRisk],['Unassigned Work', data.breakdown.unassignedRisk]].map(([label, score]) => {
                  const isUnmeasured = label === 'Scope Creep' && (score as number) === 0;
                  return (
                    <tr key={label as string} style={{ borderBottom: '1px solid #EBECF0' }}>
                      <td style={{ padding: '6px 12px' }}>{label}</td>
                      <td style={{ padding: '6px 12px' }}>
                        {isUnmeasured
                          ? <span title="Not measured in this version" style={{ color: '#626F86' }}>—</span>
                          : score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16 }}>Sprint Completion Prediction</h2>
            <p style={{ fontSize: 14 }}>
              Sprint: {data.project.sprintName ?? '—'} &nbsp;|&nbsp;
              <ProbabilityBadge probability={data.project.completionProbability} confidence={data.project.completionConfidence} />
            </p>
            <p style={{ fontSize: 13, color: '#626F86' }}>Velocity history: {data.velocityHistory.join(', ') || '—'}</p>
          </section>

          {data.blockedIssues.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 16 }}>Blocked Issues</h2>
              <ul style={{ fontSize: 14, paddingLeft: 20 }}>
                {data.blockedIssues.map(i => <li key={i.key}><strong>{i.key}</strong> — {i.summary} ({i.daysBlocked}d blocked)</li>)}
              </ul>
            </section>
          )}

          {data.recommendations.length > 0 && (
            <section>
              <h2 style={{ fontSize: 16 }}>Recommendations</h2>
              <ul style={{ fontSize: 14, paddingLeft: 20 }}>
                {data.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

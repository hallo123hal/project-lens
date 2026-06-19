import { useEffect, useReducer } from 'react';
import { getDashboardData } from '../api/forgeApi';
import RiskBadge from '../components/RiskBadge';
import ProbabilityBadge from '../components/ProbabilityBadge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import WarningList from '../components/WarningList';
import type { DashboardState } from '../state/dashboardState';
import { initialDashboardState } from '../state/dashboardState';
import type { ProjectRow } from '../types/viewModels';

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: DashboardState }
  | { type: 'FETCH_ERROR'; message: string }
  | { type: 'SORT'; field: DashboardState['sortField'] };

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'FETCH_START': return { ...state, status: 'loading' };
    case 'FETCH_SUCCESS': return { ...action.payload, status: 'loaded', sortField: state.sortField, sortDirection: state.sortDirection };
    case 'FETCH_ERROR': return { ...state, status: 'error', errors: [{ code: 'FETCH_FAILED', message: action.message }] };
    case 'SORT':
      return {
        ...state,
        sortField: action.field,
        sortDirection: state.sortField === action.field && state.sortDirection === 'asc' ? 'desc' : 'asc',
      };
  }
}

function sortedProjects(projects: ProjectRow[], field: DashboardState['sortField'], dir: 'asc' | 'desc'): ProjectRow[] {
  return [...projects].sort((a, b) => {
    const av = field === 'riskScore' ? a.riskScore : a.projectName;
    const bv = field === 'riskScore' ? b.riskScore : b.projectName;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });
}

interface Props { onProjectClick: (key: string) => void; onSettingsClick: () => void }

export default function DashboardPage({ onProjectClick, onSettingsClick }: Props) {
  const [state, dispatch] = useReducer(reducer, initialDashboardState);

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    getDashboardData()
      .then(result => {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            ...initialDashboardState,
            data: result.data ?? null,
            warnings: result.warnings,
            errors: result.errors,
            partial: result.partial,
          },
        });
      })
      .catch(err => dispatch({ type: 'FETCH_ERROR', message: String(err) }));
  }, []);

  const projects = state.data ? sortedProjects(state.data.projects, state.sortField, state.sortDirection) : [];

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Portfolio Risk Dashboard</h1>
        <button onClick={onSettingsClick} style={{ padding: '6px 16px', cursor: 'pointer' }}>Settings</button>
      </div>

      {state.partial && <WarningList warnings={[{ code: 'PARTIAL', message: 'Some projects could not be analyzed — partial data shown.', severity: 'warning' }]} />}
      <WarningList warnings={state.warnings} />

      {state.status === 'loading' && <LoadingState message="Analyzing portfolio…" />}
      {state.status === 'error' && <EmptyState title="Failed to load dashboard" description={state.errors[0]?.message ?? 'An unexpected error occurred.'} />}
      {state.status === 'loaded' && projects.length === 0 && (
        <EmptyState title="No projects configured" description="Go to Settings to select projects for analysis." />
      )}
      {state.status === 'loaded' && projects.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #DFE1E6', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => dispatch({ type: 'SORT', field: 'projectName' })}>Project</th>
              <th style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => dispatch({ type: 'SORT', field: 'riskScore' })}>Risk Score ↕</th>
              <th style={{ padding: '8px 12px' }}>Blocked</th>
              <th style={{ padding: '8px 12px' }}>Velocity Drop</th>
              <th style={{ padding: '8px 12px' }}>Scope Creep</th>
              <th style={{ padding: '8px 12px' }}>Unassigned</th>
              <th style={{ padding: '8px 12px' }}>Sprint Completion</th>
              <th style={{ padding: '8px 12px' }}>Sprint</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.projectKey} style={{ borderBottom: '1px solid #EBECF0' }}>
                <td style={{ padding: '8px 12px' }}>
                  <button onClick={() => onProjectClick(p.projectKey)} style={{ background: 'none', border: 'none', color: '#0052CC', cursor: 'pointer', padding: 0, fontSize: 14 }}>
                    {p.projectName}
                  </button>
                  {p.partial && <span style={{ color: '#626F86', fontSize: 11, marginLeft: 6 }}>(partial)</span>}
                </td>
                <td style={{ padding: '8px 12px' }}><RiskBadge level={p.riskLevel} score={p.riskScore} /></td>
                <td style={{ padding: '8px 12px' }}>{p.breakdown.blockedRisk}</td>
                <td style={{ padding: '8px 12px' }}>{p.breakdown.velocityRisk}</td>
                <td style={{ padding: '8px 12px' }}>{p.breakdown.scopeCreepRisk}</td>
                <td style={{ padding: '8px 12px' }}>{p.breakdown.unassignedRisk}</td>
                <td style={{ padding: '8px 12px' }}><ProbabilityBadge probability={p.completionProbability} confidence={p.completionConfidence} /></td>
                <td style={{ padding: '8px 12px', color: '#626F86' }}>{p.sprintName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

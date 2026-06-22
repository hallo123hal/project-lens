import { useEffect, useReducer } from 'react';
import { getDashboardData } from '../api/forgeApi';
import RiskBadge from '../components/RiskBadge';
import ScoreBadge from '../components/ScoreBadge';
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
    case 'FETCH_START':   return { ...state, status: 'loading' };
    case 'FETCH_SUCCESS': return { ...action.payload, status: 'loaded', sortField: state.sortField, sortDirection: state.sortDirection };
    case 'FETCH_ERROR':   return { ...state, status: 'error', errors: [{ code: 'FETCH_FAILED', message: action.message }] };
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

function SortIcon({ field, activeField, dir }: { field: string; activeField: string; dir: 'asc' | 'desc' }) {
  if (field !== activeField) return <span className="text-gray-300 ml-1 font-normal">↕</span>;
  return <span className="text-blue-500 ml-1 font-normal">{dir === 'asc' ? '↑' : '↓'}</span>;
}

const rowBorder: Record<string, string> = {
  HIGH:   'border-l-red-400',
  MEDIUM: 'border-l-yellow-400',
  LOW:    'border-l-green-400',
};

interface Props { onProjectClick: (key: string) => void; onSettingsClick: () => void }

export default function DashboardPage({ onProjectClick, onSettingsClick }: Props) {
  const [state, dispatch] = useReducer(reducer, initialDashboardState);

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    getDashboardData()
      .then(result => dispatch({
        type: 'FETCH_SUCCESS',
        payload: { ...initialDashboardState, data: result.data ?? null, warnings: result.warnings, errors: result.errors, partial: result.partial },
      }))
      .catch(err => dispatch({ type: 'FETCH_ERROR', message: String(err) }));
  }, []);

  const projects = state.data
    ? sortedProjects(state.data.projects, state.sortField, state.sortDirection)
    : [];

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
        <h1 className="m-0 text-xl font-semibold text-gray-900">Portfolio Risk Dashboard</h1>
        <button
          onClick={onSettingsClick}
          className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white"
        >
          Settings
        </button>
      </div>

      {state.partial && (
        <WarningList warnings={[{ code: 'PARTIAL', message: 'Some projects could not be analyzed — partial data shown.', severity: 'warning' }]} />
      )}
      <WarningList warnings={state.warnings} />

      {state.status === 'loading' && <LoadingState message="Analyzing portfolio…" />}
      {state.status === 'error' && (
        <EmptyState title="Failed to load dashboard" description={state.errors[0]?.message ?? 'An unexpected error occurred.'} />
      )}
      {state.status === 'loaded' && projects.length === 0 && (
        <EmptyState title="No projects configured" description="Go to Settings to select projects for analysis." />
      )}
      {state.status === 'loaded' && projects.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left">
              <th
                className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                onClick={() => dispatch({ type: 'SORT', field: 'projectName' })}
              >
                Project <SortIcon field="projectName" activeField={state.sortField} dir={state.sortDirection} />
              </th>
              <th
                className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                onClick={() => dispatch({ type: 'SORT', field: 'riskScore' })}
              >
                Risk Score <SortIcon field="riskScore" activeField={state.sortField} dir={state.sortDirection} />
              </th>
              {['Blocked', 'Velocity Drop', 'Scope Creep', 'Unassigned'].map(h => (
                <th key={h} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
              ))}
              <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Sprint Completion</th>
              <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Sprint</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr
                key={p.projectKey}
                className={`border-b border-gray-100 border-l-4 ${rowBorder[p.riskLevel]} hover:bg-gray-50 transition-colors`}
              >
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onProjectClick(p.projectKey)}
                    className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0 text-sm font-medium"
                  >
                    {p.projectName}
                  </button>
                  {p.partial && <span className="text-gray-400 text-xs ml-1.5">(partial)</span>}
                </td>
                <td className="px-3 py-2.5"><RiskBadge level={p.riskLevel} score={p.riskScore} /></td>
                <td className="px-3 py-2.5"><ScoreBadge score={p.breakdown.blockedRisk} /></td>
                <td className="px-3 py-2.5"><ScoreBadge score={p.breakdown.velocityRisk} /></td>
                <td className="px-3 py-2.5"><ScoreBadge score={p.breakdown.scopeCreepRisk} /></td>
                <td className="px-3 py-2.5"><ScoreBadge score={p.breakdown.unassignedRisk} /></td>
                <td className="px-3 py-2.5">
                  <ProbabilityBadge probability={p.completionProbability} confidence={p.completionConfidence} />
                </td>
                <td className="px-3 py-2.5 text-gray-400">{p.sprintName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

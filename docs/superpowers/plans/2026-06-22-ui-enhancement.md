# ProjectLens UI Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all inline styles in the ProjectLens Custom UI with Tailwind CSS v4 and add data-rich visual components (colored score badges, SVG velocity chart, progress bars, grouped settings).

**Architecture:** Pure frontend change — no resolver or backend modifications. Tailwind v4 is integrated via the `@tailwindcss/vite` plugin (zero config file). All risk-level colors are defined once as CSS custom properties in `index.css` and consumed by Tailwind utility classes. Two new components (`ScoreBadge`, `VelocityChart`) are added; five existing components are restyled; all three pages are fully rewritten using Tailwind classes.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), pure SVG for charts.

## Global Constraints

- All commands run from `ProjectLens/static/projectlens-ui/` unless stated otherwise
- No new runtime dependencies — Tailwind is build-time only
- No backend changes, no resolver changes, no new data fetched
- No dark mode
- TypeScript must compile cleanly after every task (`npm run build`)
- `App.css` is never imported — it will be deleted in Task 1

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modify | Add `tailwindcss`, `@tailwindcss/vite` devDeps |
| `vite.config.ts` | Modify | Add `@tailwindcss/vite` plugin |
| `src/index.css` | Replace | Tailwind import + CSS variables + `#root` reset |
| `src/App.css` | Delete | Unused Vite boilerplate |
| `src/utils/scoreColor.ts` | Create | `scoreColor(n)` → `'low' \| 'medium' \| 'high'` |
| `src/components/ScoreBadge.tsx` | Create | Colored number pill, optional `large` variant |
| `src/components/VelocityChart.tsx` | Create | SVG bar chart + stat row |
| `src/components/RiskBadge.tsx` | Replace | Tailwind classes, slightly larger |
| `src/components/ProbabilityBadge.tsx` | Replace | Stacked layout, optional `large` variant |
| `src/components/WarningList.tsx` | Replace | Amber card with `⚠` icon |
| `src/components/LoadingState.tsx` | Replace | Centered spinner + message |
| `src/components/EmptyState.tsx` | Replace | Centered card |
| `src/pages/DashboardPage.tsx` | Replace | Table with colored row borders, sort arrows, `ScoreBadge` columns |
| `src/pages/ProjectDetailPage.tsx` | Replace | Header card, 2×2 breakdown grid, `VelocityChart`, blocked list, recommendations panel |
| `src/pages/SettingsPage.tsx` | Replace | Three grouped sections, helper text, validation, save state machine |

---

## Task 1: Tailwind CSS v4 Setup

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Replace: `src/index.css`
- Delete: `src/App.css`

**Interfaces:**
- Produces: Tailwind utility classes available in all `.tsx` files; CSS custom properties `--risk-*` available globally

- [ ] **Step 1: Install Tailwind v4**

```bash
cd ProjectLens/static/projectlens-ui
npm install -D tailwindcss @tailwindcss/vite
```

Expected: packages added to `node_modules`, `package.json` devDependencies updated.

- [ ] **Step 2: Update `vite.config.ts`**

Replace the entire file:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'build',
  },
  base: './',
})
```

- [ ] **Step 3: Replace `src/index.css`**

Replace the entire file content:

```css
@import "tailwindcss";

:root {
  --risk-high-bg: #FFEBE6;
  --risk-high-text: #AE2A19;
  --risk-med-bg: #FFF7D6;
  --risk-med-text: #7F5F01;
  --risk-low-bg: #DFFCF0;
  --risk-low-text: #1F845A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #172B4D;
  background: #fff;
  -webkit-font-smoothing: antialiased;
}

#root {
  max-width: 100%;
  text-align: left;
}

body {
  margin: 0;
}
```

- [ ] **Step 4: Delete `src/App.css`**

Delete the file `src/App.css` — it is not imported anywhere and contains only Vite template boilerplate.

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: build completes with no errors. Output in `build/`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/index.css
git rm src/App.css
git commit -m "feat(ui): install Tailwind CSS v4, replace index.css, remove App.css"
```

---

## Task 2: scoreColor Utility + ScoreBadge Component

**Files:**
- Create: `src/utils/scoreColor.ts`
- Create: `src/components/ScoreBadge.tsx`

**Interfaces:**
- Produces:
  - `scoreColor(n: number): 'low' | 'medium' | 'high'` — thresholds: 0–39 → `'low'`, 40–69 → `'medium'`, 70–100 → `'high'`
  - `<ScoreBadge score={number} large?: boolean />` — colored pill badge

- [ ] **Step 1: Create `src/utils/scoreColor.ts`**

```typescript
export type ScoreLevel = 'low' | 'medium' | 'high';

export function scoreColor(n: number): ScoreLevel {
  if (n >= 70) return 'high';
  if (n >= 40) return 'medium';
  return 'low';
}
```

- [ ] **Step 2: Create `src/components/ScoreBadge.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/scoreColor.ts src/components/ScoreBadge.tsx
git commit -m "feat(ui): add scoreColor utility and ScoreBadge component"
```

---

## Task 3: Update Shared Components

**Files:**
- Replace: `src/components/RiskBadge.tsx`
- Replace: `src/components/ProbabilityBadge.tsx`
- Replace: `src/components/WarningList.tsx`
- Replace: `src/components/LoadingState.tsx`
- Replace: `src/components/EmptyState.tsx`

**Interfaces:**
- Consumes: `RiskLevel` from `../types/viewModels`; `WarningItem` from `../types/viewModels`
- Produces:
  - `<RiskBadge level={RiskLevel} score?: number />` — unchanged props, restyled
  - `<ProbabilityBadge probability={number|null} confidence={string} large?: boolean />` — new `large` prop
  - `<WarningList warnings={WarningItem[]} />` — unchanged props, restyled
  - `<LoadingState message?: string />` — unchanged props, restyled
  - `<EmptyState title={string} description?: string />` — unchanged props, restyled

- [ ] **Step 1: Replace `src/components/RiskBadge.tsx`**

```tsx
import type { RiskLevel } from '../types/viewModels';

const classes: Record<RiskLevel, string> = {
  HIGH:   'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW:    'bg-green-100 text-green-800',
};

const icons: Record<RiskLevel, string> = {
  HIGH: '▲', MEDIUM: '●', LOW: '▼',
};

interface Props { level: RiskLevel; score?: number }

export default function RiskBadge({ level, score }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${classes[level]}`}
      aria-label={`Risk level: ${level}`}
    >
      {icons[level]} {level}{score !== undefined ? ` (${score})` : ''}
    </span>
  );
}
```

- [ ] **Step 2: Replace `src/components/ProbabilityBadge.tsx`**

```tsx
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
```

- [ ] **Step 3: Replace `src/components/WarningList.tsx`**

```tsx
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
```

- [ ] **Step 4: Replace `src/components/LoadingState.tsx`**

```tsx
interface Props { message?: string }

export default function LoadingState({ message = 'Loading…' }: Props) {
  return (
    <div className="py-16 text-center text-gray-400 text-sm" aria-live="polite">
      <div className="inline-block w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3" />
      <p className="m-0">{message}</p>
    </div>
  );
}
```

- [ ] **Step 5: Replace `src/components/EmptyState.tsx`**

```tsx
interface Props { title: string; description?: string }

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="py-16 text-center">
      <p className="font-semibold text-gray-700 text-base m-0">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-2 m-0">{description}</p>}
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/RiskBadge.tsx src/components/ProbabilityBadge.tsx src/components/WarningList.tsx src/components/LoadingState.tsx src/components/EmptyState.tsx
git commit -m "feat(ui): restyle shared components with Tailwind classes"
```

---

## Task 4: VelocityChart Component

**Files:**
- Create: `src/components/VelocityChart.tsx`

**Interfaces:**
- Produces: `<VelocityChart history={number[]} />` — SVG bar chart + stat row; renders nothing if `history` is empty

- [ ] **Step 1: Create `src/components/VelocityChart.tsx`**

```tsx
interface Props { history: number[] }

export default function VelocityChart({ history }: Props) {
  if (history.length === 0) return null;

  const avg = history.reduce((s, v) => s + v, 0) / history.length;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const last = history[history.length - 1];

  let trend: string;
  let trendClass: string;
  if (last > avg * 1.1) {
    trend = '▲'; trendClass = 'text-teal-600';
  } else if (last < avg * 0.9) {
    trend = '▼'; trendClass = 'text-amber-600';
  } else {
    trend = '→'; trendClass = 'text-gray-400';
  }

  const svgH = 80;
  const barW = 24;
  const gap = 6;
  const svgW = history.length * (barW + gap) - gap;

  return (
    <div>
      <svg
        width={svgW}
        height={svgH + 2}
        className="block"
        aria-label="Velocity history bar chart"
        role="img"
      >
        {/* baseline */}
        <line x1={0} y1={svgH} x2={svgW} y2={svgH} stroke="#E2E8F0" strokeWidth={1} />
        {history.map((v, i) => {
          const barH = max > 0 ? Math.max(4, Math.round((v / max) * svgH)) : 4;
          const x = i * (barW + gap);
          const y = svgH - barH;
          const fill = v >= avg ? '#14B8A6' : '#F59E0B';
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={fill}
            />
          );
        })}
      </svg>
      <div className="flex gap-5 text-xs text-gray-500 mt-2">
        <span>Avg: <strong className="text-gray-700">{Math.round(avg)}</strong></span>
        <span>Min: <strong className="text-gray-700">{min}</strong></span>
        <span>Max: <strong className="text-gray-700">{max}</strong></span>
        <span>Trend: <strong className={trendClass}>{trend}</strong></span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/VelocityChart.tsx
git commit -m "feat(ui): add VelocityChart SVG component with stat row"
```

---

## Task 5: Dashboard Page Restyle

**Files:**
- Replace: `src/pages/DashboardPage.tsx`

**Interfaces:**
- Consumes:
  - `ScoreBadge` from `../components/ScoreBadge`
  - `RiskBadge` from `../components/RiskBadge`
  - `ProbabilityBadge` from `../components/ProbabilityBadge`
  - `LoadingState`, `EmptyState`, `WarningList` from `../components/`
  - `getDashboardData` from `../api/forgeApi`
  - `DashboardState`, `initialDashboardState` from `../state/dashboardState`
  - `ProjectRow` from `../types/viewModels`
- Produces: `<DashboardPage onProjectClick onSettingsClick />` — unchanged props

- [ ] **Step 1: Replace `src/pages/DashboardPage.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat(ui): restyle Dashboard page — colored row borders, ScoreBadge columns, sort arrows"
```

---

## Task 6: Project Detail Page Restyle

**Files:**
- Replace: `src/pages/ProjectDetailPage.tsx`

**Interfaces:**
- Consumes:
  - `RiskBadge` from `../components/RiskBadge` — `level: RiskLevel`, `score?: number`
  - `ScoreBadge` from `../components/ScoreBadge` — `score: number`, `large?: boolean`
  - `ProbabilityBadge` from `../components/ProbabilityBadge` — `probability: number|null`, `confidence: string`, `large?: boolean`
  - `VelocityChart` from `../components/VelocityChart` — `history: number[]`
  - `scoreColor` from `../utils/scoreColor` — `(n: number) => 'low' | 'medium' | 'high'`
  - `getProjectRiskDetail` from `../api/forgeApi`
- Produces: `<ProjectDetailPage projectKey={string} onBack={() => void} />` — unchanged props

- [ ] **Step 1: Replace `src/pages/ProjectDetailPage.tsx`**

```tsx
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
          className={`h-full rounded-full ${barColor[level]}`}
          style={{ width: `${score}%` }}
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
            <section className="bg-blue-50 rounded-lg p-5">
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProjectDetailPage.tsx
git commit -m "feat(ui): restyle Project Detail page — header card, breakdown grid, velocity chart, blocked list, recommendations"
```

---

## Task 7: Settings Page Restyle + Validation

**Files:**
- Replace: `src/pages/SettingsPage.tsx`

**Interfaces:**
- Consumes: `getSettings`, `saveSettings` from `../api/forgeApi`
- Produces: `<SettingsPage onBack={() => void} />` — unchanged props

- [ ] **Step 1: Replace `src/pages/SettingsPage.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { getSettings, saveSettings } from '../api/forgeApi';
import LoadingState from '../components/LoadingState';

interface Settings {
  selectedProjectKeys: string[];
  storyPointsFieldId: string;
  blockedStatusNames: string[];
  blockedAgeThresholdDays: number;
  velocityLookbackSprints: number;
  scopeCreepThresholdPercent: number;
  unassignedThresholdPercent: number;
  useIssueCountFallback: boolean;
}

function validateProjectKeys(keys: string[]): string | null {
  if (keys.length === 0) return 'At least one project key is required.';
  const invalid = keys.filter(k => !/^[A-Z][A-Z0-9]*$/.test(k));
  if (invalid.length > 0) return `Invalid keys: ${invalid.join(', ')} — use uppercase letters and numbers only (e.g. PROJ, BACKEND2).`;
  return null;
}

function FieldGroup({ label, helper, error, children }: { label: string; helper: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
        {children}
        <span className="block text-xs text-gray-400 mt-1">{helper}</span>
        {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
      </label>
    </div>
  );
}

interface Props { onBack: () => void }

export default function SettingsPage({ onBack }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'saving' | 'saved' | 'error'>('loading');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSettings()
      .then(result => { setSettings(result.data as Settings); setStatus('loaded'); })
      .catch(() => setStatus('error'));
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); };
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    if (status === 'saved') setStatus('loaded');
  }

  function handleKeysChange(raw: string) {
    const keys = raw.split(',').map(s => s.trim()).filter(Boolean);
    update('selectedProjectKeys', keys);
    setKeysError(validateProjectKeys(keys));
  }

  async function handleSave() {
    if (!settings) return;
    const err = validateProjectKeys(settings.selectedProjectKeys);
    if (err) { setKeysError(err); return; }
    setStatus('saving');
    setSaveError(null);
    const result = await saveSettings(settings as unknown as Record<string, unknown>);
    if (result.errors.length > 0) {
      setSaveError(result.errors[0].message);
      setStatus('loaded');
    } else {
      setStatus('saved');
      savedTimerRef.current = setTimeout(() => setStatus('loaded'), 3000);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
      hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`;

  const numberInputClass = 'w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';

  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={onBack}
        className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0 text-sm mb-5 block"
      >
        ← Back
      </button>
      <h1 className="text-xl font-semibold text-gray-900 mt-0 mb-6">ProjectLens Settings</h1>

      {status === 'loading' && <LoadingState message="Loading settings…" />}
      {status === 'error' && <p className="text-red-600 text-sm">Failed to load settings.</p>}

      {settings && (
        <div className="space-y-5">

          {/* Section: Projects */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 m-0 mb-1">Projects</h2>
            <FieldGroup
              label="Selected Project Keys"
              helper='Comma-separated Jira project keys, e.g. PROJ, BACKEND'
              error={keysError}
            >
              <input
                value={settings.selectedProjectKeys.join(', ')}
                onChange={e => handleKeysChange(e.target.value)}
                placeholder="PROJ1, PROJ2"
                className={inputClass(!!keysError)}
              />
            </FieldGroup>
          </div>

          {/* Section: Risk Thresholds */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 m-0 mb-1">Risk Thresholds</h2>
            <FieldGroup
              label="Blocked Status Names"
              helper='Status names that count as blocked, e.g. Blocked, Impediment'
            >
              <input
                value={settings.blockedStatusNames.join(', ')}
                onChange={e => update('blockedStatusNames', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className={inputClass(false)}
              />
            </FieldGroup>
            <FieldGroup
              label="Blocked Age Threshold (days)"
              helper='Issues blocked longer than this many days raise risk'
            >
              <input
                type="number" min={0} value={settings.blockedAgeThresholdDays}
                onChange={e => update('blockedAgeThresholdDays', Math.max(0, Number(e.target.value)))}
                className={numberInputClass}
              />
            </FieldGroup>
            <FieldGroup
              label="Scope Creep Threshold (%)"
              helper='Sprint scope increase above this % triggers a scope creep signal'
            >
              <input
                type="number" min={0} max={100} value={settings.scopeCreepThresholdPercent}
                onChange={e => update('scopeCreepThresholdPercent', Math.min(100, Math.max(0, Number(e.target.value))))}
                className={numberInputClass}
              />
            </FieldGroup>
            <FieldGroup
              label="Unassigned Threshold (%)"
              helper='% of sprint issues unassigned before risk is raised'
            >
              <input
                type="number" min={0} max={100} value={settings.unassignedThresholdPercent}
                onChange={e => update('unassignedThresholdPercent', Math.min(100, Math.max(0, Number(e.target.value))))}
                className={numberInputClass}
              />
            </FieldGroup>
          </div>

          {/* Section: Sprint & Velocity */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 m-0 mb-1">Sprint & Velocity</h2>
            <FieldGroup
              label="Story Points Field ID"
              helper='Custom field ID for story points, e.g. customfield_10016'
            >
              <input
                value={settings.storyPointsFieldId}
                onChange={e => update('storyPointsFieldId', e.target.value)}
                className={inputClass(false)}
              />
            </FieldGroup>
            <FieldGroup
              label="Velocity Lookback Sprints"
              helper='Number of past sprints used for Monte Carlo simulation (min 3 for HIGH confidence)'
            >
              <input
                type="number" min={1} max={20} value={settings.velocityLookbackSprints}
                onChange={e => update('velocityLookbackSprints', Math.min(20, Math.max(1, Number(e.target.value))))}
                className={numberInputClass}
              />
            </FieldGroup>
            <div className="flex items-start gap-3">
              <input
                id="fallback"
                type="checkbox"
                checked={settings.useIssueCountFallback}
                onChange={e => update('useIssueCountFallback', e.target.checked)}
                className="mt-0.5 cursor-pointer"
              />
              <label htmlFor="fallback" className="cursor-pointer">
                <span className="block text-sm font-semibold text-gray-700">Use Issue Count Fallback</span>
                <span className="block text-xs text-gray-400 mt-0.5">Fall back to counting issues when story points are not set on issues</span>
              </label>
            </div>
          </div>

          {/* Save */}
          {saveError && <p className="text-red-600 text-sm m-0">{saveError}</p>}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className={`px-6 py-2 text-sm font-semibold rounded cursor-pointer transition-colors disabled:cursor-not-allowed flex items-center gap-2 ${
                status === 'saved'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
              }`}
            >
              {status === 'saving' && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {status === 'saved' ? '✓ Saved' : status === 'saving' ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat(ui): restyle Settings page — grouped sections, helper text, validation, save state machine"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Tailwind setup ✓ · scoreColor ✓ · ScoreBadge ✓ · VelocityChart (SVG + stat row + trend rule) ✓ · RiskBadge updated ✓ · ProbabilityBadge stacked large variant ✓ · WarningList amber card ✓ · LoadingState spinner ✓ · EmptyState ✓ · Dashboard row borders + sort arrows + ScoreBadge columns ✓ · Detail header card + 2×2 grid + progress bars + velocity chart + blocked list + recommendations ✓ · Settings three sections + helper text + validation + save states ✓ · App.css deleted ✓ · `#root` reset ✓
- [x] **No placeholders:** All steps contain complete code.
- [x] **Type consistency:** `ScoreBadge` props (`score`, `large?`) used identically in Tasks 2, 5, 6. `ProbabilityBadge` `large?` prop added in Task 3, used in Task 6. `scoreColor` returns `ScoreLevel` used in Tasks 2 and 6.

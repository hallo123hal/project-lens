# ProjectLens MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Marketplace-ready Atlassian Forge app that shows PMOs a single cross-project portfolio risk dashboard with four risk signals, weighted risk scoring, and Monte Carlo sprint completion prediction.

**Architecture:** Forge Custom UI app — React/TypeScript frontend communicates exclusively via Forge bridge `invoke()` to resolver functions, which call Jira REST APIs through `jiraService`. Pure analytics services (`riskScoringService`, `monteCarloService`) are Jira-independent and unit-tested in isolation. Settings and cached derived metrics are persisted in Forge storage.

**Tech Stack:** Atlassian Forge (nodejs24.x), TypeScript, React 19, Vite 8, Jest (unit tests), @forge/api, @forge/resolver, @forge/bridge

## Global Constraints

- One `jira:globalPage` module in `manifest.yml` — adding a second causes deploy failure
- No external egress — `external.fetch` must never appear in the manifest
- Read-only Jira scopes only for MVP — no write scopes
- All Jira API calls in `src/services/jiraService.ts` only — never from resolvers or frontend
- Frontend never calls Jira APIs directly — only via `forgeApi.ts` `invoke()`
- Never store full issue payloads — only derived metrics and settings in Forge storage
- Always paginate Jira list endpoints — never assume one page is enough
- Never hard-code project keys, board IDs, sprint names, custom field IDs, status names, or user roles
- Risk scores: numeric 0–100; risk levels: uppercase `LOW` | `MEDIUM` | `HIGH`; confidence: uppercase `LOW` | `MEDIUM` | `HIGH`
- Dates cross boundaries as ISO 8601 strings; percentages as numeric 0–100

---

## File Map

**Root (Forge backend)**
- Create: `src/index.ts` — resolver entry point, registers all resolver functions
- Create: `src/resolvers/dashboardResolver.ts` — `getDashboardData` resolver
- Create: `src/resolvers/projectResolver.ts` — `getProjectRiskDetail` resolver
- Create: `src/resolvers/settingsResolver.ts` — `getSettings`, `saveSettings` resolvers
- Create: `src/resolvers/preferencesResolver.ts` — `getUserPreferences`, `saveUserPreferences` resolvers
- Create: `src/services/jiraService.ts` — all Jira REST calls, pagination helpers
- Create: `src/services/analysisService.ts` — orchestrates Jira data → risk scoring → cache
- Create: `src/services/riskScoringService.ts` — pure risk math functions
- Create: `src/services/monteCarloService.ts` — pure Monte Carlo simulation
- Create: `src/services/settingsService.ts` — settings defaults, validation, merge
- Create: `src/services/storageService.ts` — Forge storage read/write
- Create: `src/services/recommendationsService.ts` — rule-based recommendations from breakdown
- Create: `src/types/app.ts` — `ResolverResult<T>`, `AppWarning`, `AppError`, warning codes
- Create: `src/types/jira.ts` — raw Jira API response shapes
- Create: `src/types/risk.ts` — `RiskProjectSummary`, `RiskBreakdown`, `ProjectAnalysisResult`
- Create: `src/types/settings.ts` — `AppSettings`, `UserPreferences`
- Create: `src/utils/date.ts` — ISO date helpers
- Create: `src/utils/math.ts` — clamp, normalize helpers
- Create: `src/utils/pagination.ts` — Jira paginated fetch helper
- Create: `src/test/fixtures/jiraIssues.ts` — test fixture data
- Create: `src/test/fixtures/jiraSprints.ts` — test fixture data
- Create: `src/test/fixtures/settings.ts` — test fixture data
- Create: `src/test/riskScoringService.test.ts`
- Create: `src/test/monteCarloService.test.ts`
- Create: `src/test/settingsService.test.ts`
- Create: `src/test/analysisService.test.ts`
- Modify: `manifest.yml` — update resource path, add Jira scopes
- Modify: `package.json` — add TypeScript, Jest, @forge/api dependencies
- Create: `tsconfig.json`
- Create: `jest.config.js`

**Frontend (Custom UI)**
- Create: `static/projectlens-ui/` — Vite React TypeScript app (via `npm create vite`)
- Create: `static/projectlens-ui/src/api/forgeApi.ts` — typed `invoke()` wrappers
- Create: `static/projectlens-ui/src/types/viewModels.ts` — frontend view model types
- Create: `static/projectlens-ui/src/components/RiskBadge.tsx`
- Create: `static/projectlens-ui/src/components/ProbabilityBadge.tsx`
- Create: `static/projectlens-ui/src/components/LoadingState.tsx`
- Create: `static/projectlens-ui/src/components/EmptyState.tsx`
- Create: `static/projectlens-ui/src/components/WarningList.tsx`
- Create: `static/projectlens-ui/src/pages/DashboardPage.tsx`
- Create: `static/projectlens-ui/src/pages/ProjectDetailPage.tsx`
- Create: `static/projectlens-ui/src/pages/SettingsPage.tsx`
- Create: `static/projectlens-ui/src/state/dashboardState.ts`
- Modify: `static/projectlens-ui/src/App.tsx` — routing between three pages

---

## Task 1: Forge App Scaffolding & TypeScript Setup

**Files:**
- Modify: `ProjectLens/manifest.yml`
- Modify: `ProjectLens/package.json`
- Create: `ProjectLens/tsconfig.json`
- Create: `ProjectLens/jest.config.js`
- Create: `ProjectLens/src/index.ts`

**Interfaces:**
- Produces: `handler` export from `src/index.ts` consumed by `manifest.yml`

- [ ] **Step 1: Install backend dependencies**

Run inside `ProjectLens/` directory:
```bash
npm install --save-dev typescript @types/node ts-jest jest
npm install @forge/api @forge/resolver
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "build",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "build"]
}
```

- [ ] **Step 3: Create `jest.config.js`**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/test'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@forge/api$': '<rootDir>/src/test/__mocks__/@forge/api.ts',
    '^@forge/resolver$': '<rootDir>/src/test/__mocks__/@forge/resolver.ts',
  },
};
```

- [ ] **Step 4: Create Forge API mock for tests**

Create `src/test/__mocks__/@forge/api.ts`:
```ts
export const storage = {
  get: jest.fn(),
  set: jest.fn(),
};
export const requestJira = jest.fn();
export const route = jest.fn((strings: TemplateStringsArray, ...values: unknown[]) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
);
```

Create `src/test/__mocks__/@forge/resolver.ts`:
```ts
class Resolver {
  define(_name: string, _fn: unknown) { return this; }
  getDefinitions() { return {}; }
}
export default Resolver;
```

- [ ] **Step 5: Create stub `src/index.ts`**

```ts
import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getDashboardData', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('getProjectRiskDetail', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('getSettings', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('saveSettings', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('getUserPreferences', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('saveUserPreferences', async () => ({ data: null, warnings: [], errors: [], partial: false }));

export const handler = resolver.getDefinitions();
```

- [ ] **Step 6: Update `manifest.yml` to point to projectlens-ui build**

```yaml
modules:
  jira:globalPage:
    - key: projectlens-page
      resource: main
      resolver:
        function: resolver
      title: ProjectLens
  function:
    - key: resolver
      handler: index.handler
resources:
  - key: main
    path: static/projectlens-ui/build
app:
  runtime:
    name: nodejs24.x
    memoryMB: 256
    architecture: arm64
  id: ari:cloud:ecosystem::app/54ec593b-48a0-4a70-894c-846341527d6f
permissions:
  scopes:
    - read:jira-data
    - read:jira-work
```

- [ ] **Step 7: Add build script to root `package.json`**

```json
{
  "name": "projectlens",
  "version": "1.0.0",
  "main": "src/index.ts",
  "license": "MIT",
  "private": true,
  "scripts": {
    "test": "jest",
    "build:ui": "cd static/projectlens-ui && npm run build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@forge/api": "^4.0.0",
    "@forge/resolver": "^1.8.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

- [ ] **Step 8: Run `npx tsc --noEmit` to verify TypeScript setup**

Expected: no errors (stub file compiles)

- [ ] **Step 9: Commit**

```bash
git add manifest.yml package.json tsconfig.json jest.config.js src/index.ts src/test/__mocks__/
git commit -m "feat: convert Forge app to TypeScript, add Jest, stub resolver functions"
```

---

## Task 2: Vite React TypeScript Frontend Scaffold

**Files:**
- Create: `static/projectlens-ui/` (full Vite app)
- Create: `static/projectlens-ui/src/App.tsx`
- Create: `static/projectlens-ui/src/api/forgeApi.ts`

**Interfaces:**
- Produces: `invoke<T>(fn, payload?)` from `forgeApi.ts` used by all pages

- [ ] **Step 1: Scaffold Vite React TypeScript app**

Run inside `ProjectLens/static/` (remove existing `projectlens-ui/node_modules` first if present):
```bash
npm create vite@latest projectlens-ui -- --template react-ts
cd projectlens-ui
npm install
npm install @forge/bridge
```

- [ ] **Step 2: Create `static/projectlens-ui/src/api/forgeApi.ts`**

```ts
import bridge from '@forge/bridge';

export async function invoke<T>(functionName: string, payload?: unknown): Promise<T> {
  return bridge.invoke<T>(functionName, payload);
}
```

- [ ] **Step 3: Replace `src/App.tsx` with a three-page router**

```tsx
import { useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SettingsPage from './pages/SettingsPage';

type Page = { name: 'dashboard' } | { name: 'detail'; projectKey: string } | { name: 'settings' };

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'dashboard' });

  if (page.name === 'detail') {
    return <ProjectDetailPage projectKey={page.projectKey} onBack={() => setPage({ name: 'dashboard' })} />;
  }
  if (page.name === 'settings') {
    return <SettingsPage onBack={() => setPage({ name: 'dashboard' })} />;
  }
  return (
    <DashboardPage
      onProjectClick={(key) => setPage({ name: 'detail', projectKey: key })}
      onSettingsClick={() => setPage({ name: 'settings' })}
    />
  );
}
```

- [ ] **Step 4: Create stub pages so the app compiles**

Create `src/pages/DashboardPage.tsx`:
```tsx
interface Props {
  onProjectClick: (key: string) => void;
  onSettingsClick: () => void;
}
export default function DashboardPage({ onSettingsClick }: Props) {
  return <div><h1>Portfolio Risk Dashboard</h1><button onClick={onSettingsClick}>Settings</button></div>;
}
```

Create `src/pages/ProjectDetailPage.tsx`:
```tsx
interface Props { projectKey: string; onBack: () => void; }
export default function ProjectDetailPage({ projectKey, onBack }: Props) {
  return <div><button onClick={onBack}>Back</button><h1>Project: {projectKey}</h1></div>;
}
```

Create `src/pages/SettingsPage.tsx`:
```tsx
interface Props { onBack: () => void; }
export default function SettingsPage({ onBack }: Props) {
  return <div><button onClick={onBack}>Back</button><h1>Settings</h1></div>;
}
```

- [ ] **Step 5: Build the frontend**

```bash
cd static/projectlens-ui && npm run build
```

Expected: `build/` directory created with `index.html`

- [ ] **Step 6: Run `forge lint` from project root**

```bash
forge lint
```

Expected: no scope errors

- [ ] **Step 7: Commit**

```bash
git add static/projectlens-ui/
git commit -m "feat: scaffold Vite React TypeScript frontend with stub pages and forge bridge"
```

---

## Task 3: Domain Types

**Files:**
- Create: `src/types/app.ts`
- Create: `src/types/jira.ts`
- Create: `src/types/risk.ts`
- Create: `src/types/settings.ts`

**Interfaces:**
- Produces: all shared types consumed by every subsequent task

- [ ] **Step 1: Create `src/types/app.ts`**

```ts
export type WarningCode =
  | 'NO_ACTIVE_SPRINT'
  | 'INSUFFICIENT_VELOCITY_HISTORY'
  | 'STORY_POINTS_NOT_CONFIGURED'
  | 'USING_ISSUE_COUNT_FALLBACK'
  | 'BOARD_NOT_FOUND'
  | 'MULTIPLE_BOARDS_FOUND'
  | 'BOARD_NOT_ACCESSIBLE'
  | 'PARTIAL_DATA_DUE_TO_PERMISSIONS'
  | 'PROJECT_ANALYSIS_FAILED';

export interface AppWarning {
  code: WarningCode;
  message: string;
  severity: 'warning' | 'info';
  projectKey?: string;
}

export interface AppError {
  code: string;
  message: string;
  projectKey?: string;
}

export interface ResolverResult<T> {
  data?: T;
  warnings: AppWarning[];
  errors: AppError[];
  partial: boolean;
}
```

- [ ] **Step 2: Create `src/types/jira.ts`**

```ts
export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: 'scrum' | 'kanban' | string;
  location?: { projectKey: string };
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { key: string } };
    assignee: { accountId: string; displayName: string } | null;
    [storyPointsField: string]: unknown;
  };
}

export interface JiraPaginatedResponse<T> {
  values?: T[];
  issues?: T[];
  total: number;
  maxResults: number;
  startAt: number;
  isLast?: boolean;
}
```

- [ ] **Step 3: Create `src/types/risk.ts`**

```ts
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskBreakdown {
  blockedRisk: number;
  velocityRisk: number;
  scopeCreepRisk: number;
  unassignedRisk: number;
}

export interface RiskProjectSummary {
  projectKey: string;
  projectName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  breakdown: RiskBreakdown;
  completionProbability: number | null;
  completionConfidence: ConfidenceLevel;
  sprintName: string | null;
  lastUpdated: string;
  partial: boolean;
}

export interface ProjectAnalysisResult {
  project: RiskProjectSummary;
  breakdown: RiskBreakdown;
  blockedIssues: { key: string; summary: string; daysBlocked: number }[];
  velocityHistory: number[];
  scopeCreepPercent: number;
  unassignedCount: number;
  recommendations: string[];
  errors: import('./app').AppError[];
  warnings: import('./app').AppWarning[];
  partial: boolean;
}
```

- [ ] **Step 4: Create `src/types/settings.ts`**

```ts
export interface ProjectBoardMapping {
  projectKey: string;
  boardId: number;
}

export interface AppSettings {
  selectedProjectKeys: string[];
  projectBoardMappings: ProjectBoardMapping[];
  storyPointsFieldId: string;
  blockedStatusNames: string[];
  blockedAgeThresholdDays: number;
  includedIssueTypes: string[];
  excludedIssueTypes: string[];
  velocityLookbackSprints: number;
  scopeCreepThresholdPercent: number;
  unassignedThresholdPercent: number;
  useIssueCountFallback: boolean;
  includeProjectsWithoutActiveSprint: boolean;
}

export interface UserPreferences {
  sortField: 'riskScore' | 'projectName' | 'completionProbability';
  sortDirection: 'asc' | 'desc';
  favoriteProjectKeys: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  selectedProjectKeys: [],
  projectBoardMappings: [],
  storyPointsFieldId: 'story_points',
  blockedStatusNames: ['Blocked', 'Impediment'],
  blockedAgeThresholdDays: 2,
  includedIssueTypes: [],
  excludedIssueTypes: ['Epic', 'Sub-task'],
  velocityLookbackSprints: 5,
  scopeCreepThresholdPercent: 10,
  unassignedThresholdPercent: 20,
  useIssueCountFallback: true,
  includeProjectsWithoutActiveSprint: false,
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  sortField: 'riskScore',
  sortDirection: 'desc',
  favoriteProjectKeys: [],
};
```

- [ ] **Step 5: Run `npx tsc --noEmit` to verify types compile**

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/types/
git commit -m "feat: add shared domain types — app, jira, risk, settings"
```

---

## Task 4: Pure Services — Risk Scoring

**Files:**
- Create: `src/utils/math.ts`
- Create: `src/services/riskScoringService.ts`
- Create: `src/test/fixtures/settings.ts`
- Create: `src/test/riskScoringService.test.ts`

**Interfaces:**
- Consumes: `RiskLevel`, `RiskBreakdown` from `src/types/risk.ts`; `AppSettings` from `src/types/settings.ts`
- Produces:
  - `calculateBlockedRisk(blockedIssueCount: number, totalIssueCount: number, avgDaysBlocked: number, threshold: number): number`
  - `calculateVelocityDropRisk(velocityHistory: number[]): number`
  - `calculateScopeCreepRisk(addedIssues: number, originalIssueCount: number, threshold: number): number`
  - `calculateUnassignedRisk(unassignedCount: number, totalIssueCount: number, threshold: number): number`
  - `calculateRiskScore(breakdown: RiskBreakdown): number`
  - `calculateRiskLevel(score: number): RiskLevel`

- [ ] **Step 1: Write failing tests**

Create `src/test/fixtures/settings.ts`:
```ts
import { AppSettings, DEFAULT_SETTINGS } from '../../types/settings';
export const testSettings: AppSettings = { ...DEFAULT_SETTINGS };
```

Create `src/test/riskScoringService.test.ts`:
```ts
import {
  calculateBlockedRisk, calculateVelocityDropRisk, calculateScopeCreepRisk,
  calculateUnassignedRisk, calculateRiskScore, calculateRiskLevel,
} from '../../services/riskScoringService';

describe('calculateRiskLevel', () => {
  it('returns LOW for scores 0–39', () => expect(calculateRiskLevel(39)).toBe('LOW'));
  it('returns MEDIUM for scores 40–69', () => expect(calculateRiskLevel(40)).toBe('MEDIUM'));
  it('returns HIGH for scores 70–100', () => expect(calculateRiskLevel(70)).toBe('HIGH'));
});

describe('calculateRiskScore', () => {
  it('applies weighted formula', () => {
    const score = calculateRiskScore({ blockedRisk: 100, velocityRisk: 0, scopeCreepRisk: 0, unassignedRisk: 0 });
    expect(score).toBeCloseTo(35);
  });
  it('clamps to 0–100', () => {
    expect(calculateRiskScore({ blockedRisk: 200, velocityRisk: 200, scopeCreepRisk: 200, unassignedRisk: 200 })).toBe(100);
  });
});

describe('calculateBlockedRisk', () => {
  it('returns 0 when no blocked issues', () => expect(calculateBlockedRisk(0, 10, 0, 2)).toBe(0));
  it('returns high risk when all issues are blocked', () => expect(calculateBlockedRisk(10, 10, 5, 2)).toBeGreaterThan(70));
});

describe('calculateVelocityDropRisk', () => {
  it('returns 0 for stable velocity', () => expect(calculateVelocityDropRisk([10, 10, 10, 10, 10])).toBe(0));
  it('returns high risk for 80% drop in last sprint', () => {
    expect(calculateVelocityDropRisk([10, 10, 10, 10, 2])).toBeGreaterThan(70);
  });
  it('returns 0 for fewer than 2 sprints', () => expect(calculateVelocityDropRisk([10])).toBe(0));
});

describe('calculateScopeCreepRisk', () => {
  it('returns 0 when no new issues added', () => expect(calculateScopeCreepRisk(0, 10, 10)).toBe(0));
  it('returns HIGH when creep exceeds threshold significantly', () => {
    expect(calculateScopeCreepRisk(5, 10, 10)).toBeGreaterThan(70);
  });
});

describe('calculateUnassignedRisk', () => {
  it('returns 0 when all issues are assigned', () => expect(calculateUnassignedRisk(0, 10, 20)).toBe(0));
  it('returns HIGH when most issues unassigned', () => {
    expect(calculateUnassignedRisk(8, 10, 20)).toBeGreaterThan(70);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=riskScoringService
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/utils/math.ts`**

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}
```

- [ ] **Step 4: Create `src/services/riskScoringService.ts`**

```ts
import { clamp } from '../utils/math';
import type { RiskBreakdown, RiskLevel } from '../types/risk';

export function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function calculateRiskScore(breakdown: RiskBreakdown): number {
  const raw =
    breakdown.blockedRisk * 0.35 +
    breakdown.velocityRisk * 0.25 +
    breakdown.scopeCreepRisk * 0.25 +
    breakdown.unassignedRisk * 0.15;
  return clamp(Math.round(raw), 0, 100);
}

export function calculateBlockedRisk(
  blockedIssueCount: number,
  totalIssueCount: number,
  avgDaysBlocked: number,
  thresholdDays: number
): number {
  if (totalIssueCount === 0) return 0;
  const ratio = blockedIssueCount / totalIssueCount;
  const ageMultiplier = avgDaysBlocked > thresholdDays ? Math.min(avgDaysBlocked / thresholdDays, 3) : 1;
  return clamp(Math.round(ratio * ageMultiplier * 100), 0, 100);
}

export function calculateVelocityDropRisk(velocityHistory: number[]): number {
  if (velocityHistory.length < 2) return 0;
  const recent = velocityHistory[velocityHistory.length - 1];
  const baseline =
    velocityHistory.slice(0, -1).reduce((a, b) => a + b, 0) /
    (velocityHistory.length - 1);
  if (baseline === 0) return 0;
  const dropRatio = Math.max(0, (baseline - recent) / baseline);
  return clamp(Math.round(dropRatio * 100), 0, 100);
}

export function calculateScopeCreepRisk(
  addedIssues: number,
  originalIssueCount: number,
  thresholdPercent: number
): number {
  if (originalIssueCount === 0) return 0;
  const creepPercent = (addedIssues / originalIssueCount) * 100;
  if (creepPercent <= thresholdPercent) return 0;
  const excess = creepPercent - thresholdPercent;
  return clamp(Math.round((excess / thresholdPercent) * 70 + 30), 0, 100);
}

export function calculateUnassignedRisk(
  unassignedCount: number,
  totalIssueCount: number,
  thresholdPercent: number
): number {
  if (totalIssueCount === 0) return 0;
  const unassignedPercent = (unassignedCount / totalIssueCount) * 100;
  if (unassignedPercent <= thresholdPercent) return 0;
  const excess = unassignedPercent - thresholdPercent;
  return clamp(Math.round((excess / (100 - thresholdPercent)) * 100), 0, 100);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=riskScoringService
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/utils/math.ts src/services/riskScoringService.ts src/test/
git commit -m "feat: add risk scoring pure functions with unit tests"
```

---

## Task 5: Pure Services — Monte Carlo Simulation

**Files:**
- Create: `src/services/monteCarloService.ts`
- Create: `src/test/monteCarloService.test.ts`
- Create: `src/test/fixtures/jiraSprints.ts`

**Interfaces:**
- Consumes: `ConfidenceLevel` from `src/types/risk.ts`
- Produces:
  - `calculateCompletionProbability(remainingPoints: number, velocityHistory: number[], iterations?: number, sampler?: () => number): { probability: number; confidence: ConfidenceLevel }`

- [ ] **Step 1: Create fixture and write failing tests**

Create `src/test/fixtures/jiraSprints.ts`:
```ts
export const stableVelocityHistory = [20, 22, 18, 21, 20];
export const unstableVelocityHistory = [20, 5, 30, 3, 25];
export const shortVelocityHistory = [20, 21];
export const singleSprintHistory = [20];
```

Create `src/test/monteCarloService.test.ts`:
```ts
import { calculateCompletionProbability } from '../../services/monteCarloService';
import { stableVelocityHistory, unstableVelocityHistory, shortVelocityHistory, singleSprintHistory } from './fixtures/jiraSprints';

describe('calculateCompletionProbability', () => {
  it('returns HIGH confidence with 3+ completed sprints', () => {
    const result = calculateCompletionProbability(15, stableVelocityHistory);
    expect(result.confidence).toBe('HIGH');
  });

  it('returns MEDIUM confidence with 2 sprints', () => {
    const result = calculateCompletionProbability(15, shortVelocityHistory);
    expect(result.confidence).toBe('MEDIUM');
  });

  it('returns LOW confidence with 1 sprint', () => {
    const result = calculateCompletionProbability(15, singleSprintHistory);
    expect(result.confidence).toBe('LOW');
  });

  it('returns high probability when remaining is well below average velocity', () => {
    const result = calculateCompletionProbability(5, stableVelocityHistory);
    expect(result.probability).toBeGreaterThan(90);
  });

  it('returns low probability when remaining far exceeds average velocity', () => {
    const result = calculateCompletionProbability(200, stableVelocityHistory);
    expect(result.probability).toBeLessThan(10);
  });

  it('accepts injectable sampler for deterministic tests', () => {
    const sampler = jest.fn().mockReturnValue(0.5);
    const result = calculateCompletionProbability(15, stableVelocityHistory, 100, sampler);
    expect(sampler).toHaveBeenCalled();
    expect(result.probability).toBeGreaterThanOrEqual(0);
    expect(result.probability).toBeLessThanOrEqual(100);
  });

  it('returns null-equivalent when velocity history is empty', () => {
    const result = calculateCompletionProbability(15, []);
    expect(result.probability).toBe(0);
    expect(result.confidence).toBe('LOW');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=monteCarloService
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/services/monteCarloService.ts`**

```ts
import type { ConfidenceLevel } from '../types/risk';

export interface MonteCarloResult {
  probability: number;
  confidence: ConfidenceLevel;
}

export function calculateCompletionProbability(
  remainingPoints: number,
  velocityHistory: number[],
  iterations = 1000,
  sampler: () => number = Math.random
): MonteCarloResult {
  if (velocityHistory.length === 0) {
    return { probability: 0, confidence: 'LOW' };
  }

  const confidence: ConfidenceLevel =
    velocityHistory.length >= 3 ? 'HIGH' :
    velocityHistory.length >= 2 ? 'MEDIUM' : 'LOW';

  let completedCount = 0;
  const n = velocityHistory.length;

  for (let i = 0; i < iterations; i++) {
    const sampledIndex = Math.floor(sampler() * n);
    const sampledVelocity = velocityHistory[sampledIndex];
    if (sampledVelocity >= remainingPoints) {
      completedCount++;
    }
  }

  const probability = Math.round((completedCount / iterations) * 100);
  return { probability, confidence };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=monteCarloService
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/monteCarloService.ts src/test/monteCarloService.test.ts src/test/fixtures/jiraSprints.ts
git commit -m "feat: add Monte Carlo sprint completion simulation with injectable sampler"
```

---

## Task 6: Settings Service

**Files:**
- Create: `src/services/settingsService.ts`
- Create: `src/test/settingsService.test.ts`

**Interfaces:**
- Consumes: `AppSettings`, `UserPreferences`, `DEFAULT_SETTINGS`, `DEFAULT_USER_PREFERENCES` from `src/types/settings.ts`
- Produces:
  - `mergeWithDefaults(partial: Partial<AppSettings>): AppSettings`
  - `mergeUserPreferencesWithDefaults(partial: Partial<UserPreferences>): UserPreferences`
  - `validateSettings(settings: AppSettings): string[]` — returns array of validation error messages

- [ ] **Step 1: Write failing tests**

Create `src/test/settingsService.test.ts`:
```ts
import { mergeWithDefaults, mergeUserPreferencesWithDefaults, validateSettings } from '../../services/settingsService';
import { DEFAULT_SETTINGS } from '../../types/settings';

describe('mergeWithDefaults', () => {
  it('returns defaults when empty object passed', () => {
    expect(mergeWithDefaults({})).toEqual(DEFAULT_SETTINGS);
  });

  it('overrides only provided fields', () => {
    const result = mergeWithDefaults({ blockedAgeThresholdDays: 5 });
    expect(result.blockedAgeThresholdDays).toBe(5);
    expect(result.velocityLookbackSprints).toBe(DEFAULT_SETTINGS.velocityLookbackSprints);
  });

  it('replaces arrays rather than merging them', () => {
    const result = mergeWithDefaults({ blockedStatusNames: ['Custom'] });
    expect(result.blockedStatusNames).toEqual(['Custom']);
  });
});

describe('validateSettings', () => {
  it('returns empty array for valid settings', () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toHaveLength(0);
  });

  it('returns error when velocityLookbackSprints is less than 1', () => {
    const errors = validateSettings({ ...DEFAULT_SETTINGS, velocityLookbackSprints: 0 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error when blockedAgeThresholdDays is negative', () => {
    const errors = validateSettings({ ...DEFAULT_SETTINGS, blockedAgeThresholdDays: -1 });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('mergeUserPreferencesWithDefaults', () => {
  it('returns defaults when empty object passed', () => {
    const result = mergeUserPreferencesWithDefaults({});
    expect(result.sortField).toBe('riskScore');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=settingsService
```

Expected: FAIL — module not found

- [ ] **Step 3: Create `src/services/settingsService.ts`**

```ts
import { AppSettings, UserPreferences, DEFAULT_SETTINGS, DEFAULT_USER_PREFERENCES } from '../types/settings';

export function mergeWithDefaults(partial: Partial<AppSettings>): AppSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}

export function mergeUserPreferencesWithDefaults(partial: Partial<UserPreferences>): UserPreferences {
  return { ...DEFAULT_USER_PREFERENCES, ...partial };
}

export function validateSettings(settings: AppSettings): string[] {
  const errors: string[] = [];
  if (settings.velocityLookbackSprints < 1) {
    errors.push('velocityLookbackSprints must be at least 1');
  }
  if (settings.blockedAgeThresholdDays < 0) {
    errors.push('blockedAgeThresholdDays must be 0 or greater');
  }
  if (settings.scopeCreepThresholdPercent < 0 || settings.scopeCreepThresholdPercent > 100) {
    errors.push('scopeCreepThresholdPercent must be between 0 and 100');
  }
  if (settings.unassignedThresholdPercent < 0 || settings.unassignedThresholdPercent > 100) {
    errors.push('unassignedThresholdPercent must be between 0 and 100');
  }
  return errors;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=settingsService
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/settingsService.ts src/test/settingsService.test.ts
git commit -m "feat: add settings service with merge, validate, and defaults"
```

---

## Task 7: Storage Service & Resolver Stubs with Mock Data

**Files:**
- Create: `src/utils/pagination.ts`
- Create: `src/services/storageService.ts`
- Create: `src/resolvers/settingsResolver.ts`
- Create: `src/resolvers/preferencesResolver.ts`
- Create: `src/resolvers/dashboardResolver.ts`
- Create: `src/resolvers/projectResolver.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: all types from Task 3; `mergeWithDefaults`, `validateSettings` from Task 6
- Produces: resolvers that return typed `ResolverResult<T>` shapes (with mock data initially)

- [ ] **Step 1: Create `src/utils/pagination.ts`**

```ts
import { requestJira, route } from '@forge/api';

export async function fetchAllPages<T>(
  path: string,
  extractItems: (body: Record<string, unknown>) => T[],
  pageSize = 50
): Promise<T[]> {
  const results: T[] = [];
  let startAt = 0;
  let isLast = false;

  while (!isLast) {
    const separator = path.includes('?') ? '&' : '?';
    const response = await requestJira(route`${path}${separator}startAt=${startAt}&maxResults=${pageSize}`);
    const body = await response.json() as Record<string, unknown>;
    const items = extractItems(body);
    results.push(...items);
    const total = (body.total as number) ?? 0;
    const maxResults = (body.maxResults as number) ?? pageSize;
    isLast = (body.isLast as boolean) ?? (startAt + maxResults >= total);
    startAt += maxResults;
    if (items.length === 0) break;
  }

  return results;
}
```

- [ ] **Step 2: Create `src/services/storageService.ts`**

```ts
import { storage } from '@forge/api';
import type { AppSettings, UserPreferences } from '../types/settings';
import type { ProjectAnalysisResult } from '../types/risk';

const KEYS = {
  siteSettings: 'settings:site',
  userPreferences: (accountId: string) => `preferences:user:${accountId}`,
  projectAnalysis: (projectKey: string) => `analysis:project:${projectKey}`,
  portfolioLast: 'analysis:portfolio:last',
};

export async function getSettings(): Promise<Partial<AppSettings>> {
  return (await storage.get(KEYS.siteSettings)) ?? {};
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await storage.set(KEYS.siteSettings, settings);
}

export async function getUserPreferences(accountId: string): Promise<Partial<UserPreferences>> {
  return (await storage.get(KEYS.userPreferences(accountId))) ?? {};
}

export async function saveUserPreferences(accountId: string, prefs: UserPreferences): Promise<void> {
  await storage.set(KEYS.userPreferences(accountId), prefs);
}

export async function getCachedProjectAnalysis(projectKey: string): Promise<ProjectAnalysisResult | null> {
  return (await storage.get(KEYS.projectAnalysis(projectKey))) ?? null;
}

export async function setCachedProjectAnalysis(projectKey: string, result: ProjectAnalysisResult): Promise<void> {
  const payload = {
    project: result.project,
    breakdown: result.breakdown,
    recommendations: result.recommendations,
    warnings: result.warnings,
    errors: result.errors,
    partial: result.partial,
  };
  await storage.set(KEYS.projectAnalysis(projectKey), payload);
}
```

- [ ] **Step 3: Create `src/resolvers/settingsResolver.ts`**

```ts
import type { ResolverResult } from '../types/app';
import type { AppSettings, UserPreferences } from '../types/settings';
import * as storageService from '../services/storageService';
import { mergeWithDefaults, mergeUserPreferencesWithDefaults, validateSettings } from '../services/settingsService';

export async function getSettingsHandler(): Promise<ResolverResult<AppSettings>> {
  const stored = await storageService.getSettings();
  return { data: mergeWithDefaults(stored), warnings: [], errors: [], partial: false };
}

export async function saveSettingsHandler(payload: Partial<AppSettings>): Promise<ResolverResult<AppSettings>> {
  const merged = mergeWithDefaults(payload);
  const validationErrors = validateSettings(merged);
  if (validationErrors.length > 0) {
    return {
      errors: validationErrors.map(msg => ({ code: 'VALIDATION_ERROR', message: msg })),
      warnings: [],
      partial: false,
    };
  }
  await storageService.saveSettings(merged);
  return { data: merged, warnings: [], errors: [], partial: false };
}

export async function getUserPreferencesHandler(accountId: string): Promise<ResolverResult<UserPreferences>> {
  const stored = await storageService.getUserPreferences(accountId);
  return { data: mergeUserPreferencesWithDefaults(stored), warnings: [], errors: [], partial: false };
}

export async function saveUserPreferencesHandler(accountId: string, payload: Partial<UserPreferences>): Promise<ResolverResult<UserPreferences>> {
  const { mergeUserPreferencesWithDefaults } = await import('../services/settingsService');
  const merged = mergeUserPreferencesWithDefaults(payload);
  await storageService.saveUserPreferences(accountId, merged);
  return { data: merged, warnings: [], errors: [], partial: false };
}
```

- [ ] **Step 4: Create `src/resolvers/preferencesResolver.ts`**

```ts
import type { ResolverResult } from '../types/app';
import type { UserPreferences } from '../types/settings';
import * as storageService from '../services/storageService';
import { mergeUserPreferencesWithDefaults } from '../services/settingsService';

export async function getUserPreferencesHandler(accountId: string): Promise<ResolverResult<UserPreferences>> {
  const stored = await storageService.getUserPreferences(accountId);
  return { data: mergeUserPreferencesWithDefaults(stored), warnings: [], errors: [], partial: false };
}

export async function saveUserPreferencesHandler(accountId: string, payload: Partial<UserPreferences>): Promise<ResolverResult<UserPreferences>> {
  const merged = mergeUserPreferencesWithDefaults(payload);
  await storageService.saveUserPreferences(accountId, merged);
  return { data: merged, warnings: [], errors: [], partial: false };
}
```

- [ ] **Step 5: Create `src/resolvers/dashboardResolver.ts` with mock data**

```ts
import type { ResolverResult } from '../types/app';
import type { RiskProjectSummary } from '../types/risk';

export interface DashboardData {
  projects: RiskProjectSummary[];
  lastRefreshed: string;
}

const MOCK_PROJECTS: RiskProjectSummary[] = [
  {
    projectKey: 'DEMO',
    projectName: 'Demo Project',
    riskScore: 72,
    riskLevel: 'HIGH',
    breakdown: { blockedRisk: 80, velocityRisk: 60, scopeCreepRisk: 50, unassignedRisk: 30 },
    completionProbability: 42,
    completionConfidence: 'HIGH',
    sprintName: 'Sprint 5',
    lastUpdated: new Date().toISOString(),
    partial: false,
  },
];

export async function getDashboardDataHandler(): Promise<ResolverResult<DashboardData>> {
  return {
    data: { projects: MOCK_PROJECTS, lastRefreshed: new Date().toISOString() },
    warnings: [],
    errors: [],
    partial: false,
  };
}
```

- [ ] **Step 6: Create `src/resolvers/projectResolver.ts` with mock data**

```ts
import type { ResolverResult } from '../types/app';
import type { ProjectAnalysisResult } from '../types/risk';

export async function getProjectRiskDetailHandler(projectKey: string): Promise<ResolverResult<ProjectAnalysisResult>> {
  return {
    data: {
      project: {
        projectKey,
        projectName: `Project ${projectKey}`,
        riskScore: 72,
        riskLevel: 'HIGH',
        breakdown: { blockedRisk: 80, velocityRisk: 60, scopeCreepRisk: 50, unassignedRisk: 30 },
        completionProbability: 42,
        completionConfidence: 'HIGH',
        sprintName: 'Sprint 5',
        lastUpdated: new Date().toISOString(),
        partial: false,
      },
      breakdown: { blockedRisk: 80, velocityRisk: 60, scopeCreepRisk: 50, unassignedRisk: 30 },
      blockedIssues: [{ key: `${projectKey}-42`, summary: 'Blocked task example', daysBlocked: 4 }],
      velocityHistory: [20, 18, 22, 15],
      scopeCreepPercent: 15,
      unassignedCount: 3,
      recommendations: ['Unblock DEMO-42 or reassign it', 'Address velocity drop this sprint'],
      errors: [],
      warnings: [],
      partial: false,
    },
    warnings: [],
    errors: [],
    partial: false,
  };
}
```

- [ ] **Step 7: Wire resolvers into `src/index.ts`**

```ts
import Resolver from '@forge/resolver';
import { getDashboardDataHandler } from './resolvers/dashboardResolver';
import { getProjectRiskDetailHandler } from './resolvers/projectResolver';
import { getSettingsHandler, saveSettingsHandler } from './resolvers/settingsResolver';
import { getUserPreferencesHandler, saveUserPreferencesHandler } from './resolvers/preferencesResolver';

const resolver = new Resolver();

resolver.define('getDashboardData', () => getDashboardDataHandler());
resolver.define('getProjectRiskDetail', ({ payload }: { payload: { projectKey: string } }) =>
  getProjectRiskDetailHandler(payload.projectKey));
resolver.define('getSettings', () => getSettingsHandler());
resolver.define('saveSettings', ({ payload }) => saveSettingsHandler(payload));
resolver.define('getUserPreferences', ({ context }: { context: { accountId: string } }) =>
  getUserPreferencesHandler(context.accountId));
resolver.define('saveUserPreferences', ({ payload, context }: { payload: unknown; context: { accountId: string } }) =>
  saveUserPreferencesHandler(context.accountId, payload as never));

export const handler = resolver.getDefinitions();
```

- [ ] **Step 8: Run `npx tsc --noEmit`**

Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add src/resolvers/ src/services/storageService.ts src/utils/pagination.ts src/index.ts
git commit -m "feat: add storage service, pagination util, resolver stubs with mock data"
```

---

## Task 8: Frontend Shared Components & View Types

**Files:**
- Create: `static/projectlens-ui/src/types/viewModels.ts`
- Create: `static/projectlens-ui/src/components/RiskBadge.tsx`
- Create: `static/projectlens-ui/src/components/ProbabilityBadge.tsx`
- Create: `static/projectlens-ui/src/components/LoadingState.tsx`
- Create: `static/projectlens-ui/src/components/EmptyState.tsx`
- Create: `static/projectlens-ui/src/components/WarningList.tsx`
- Modify: `static/projectlens-ui/src/api/forgeApi.ts`

**Interfaces:**
- Consumes: `invoke` from `forgeApi.ts`
- Produces: shared components and typed API calls used by all three pages

- [ ] **Step 1: Create `src/types/viewModels.ts`**

```ts
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskBreakdown {
  blockedRisk: number;
  velocityRisk: number;
  scopeCreepRisk: number;
  unassignedRisk: number;
}

export interface ProjectRow {
  projectKey: string;
  projectName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  breakdown: RiskBreakdown;
  completionProbability: number | null;
  completionConfidence: ConfidenceLevel;
  sprintName: string | null;
  partial: boolean;
}

export interface WarningItem {
  code: string;
  message: string;
  severity: 'warning' | 'info';
}
```

- [ ] **Step 2: Update `src/api/forgeApi.ts` with typed resolver calls**

```ts
import bridge from '@forge/bridge';
import type { ProjectRow, WarningItem } from '../types/viewModels';

interface ResolverResult<T> {
  data?: T;
  warnings: WarningItem[];
  errors: { code: string; message: string }[];
  partial: boolean;
}

export interface DashboardData {
  projects: ProjectRow[];
  lastRefreshed: string;
}

export async function getDashboardData(): Promise<ResolverResult<DashboardData>> {
  return bridge.invoke('getDashboardData');
}

export async function getProjectRiskDetail(projectKey: string): Promise<ResolverResult<unknown>> {
  return bridge.invoke('getProjectRiskDetail', { projectKey });
}

export async function getSettings(): Promise<ResolverResult<unknown>> {
  return bridge.invoke('getSettings');
}

export async function saveSettings(settings: unknown): Promise<ResolverResult<unknown>> {
  return bridge.invoke('saveSettings', settings);
}

export async function getUserPreferences(): Promise<ResolverResult<unknown>> {
  return bridge.invoke('getUserPreferences');
}
```

- [ ] **Step 3: Create `src/components/RiskBadge.tsx`**

```tsx
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
```

- [ ] **Step 4: Create `src/components/ProbabilityBadge.tsx`**

```tsx
interface Props { probability: number | null; confidence: string }

export default function ProbabilityBadge({ probability, confidence }: Props) {
  if (probability === null) return <span style={{ color: '#626F86', fontSize: 12 }}>—</span>;
  return (
    <span style={{ fontSize: 12 }} title={`Confidence: ${confidence}`}>
      {probability}% <span style={{ color: '#626F86' }}>({confidence})</span>
    </span>
  );
}
```

- [ ] **Step 5: Create `src/components/LoadingState.tsx`**

```tsx
interface Props { message?: string }

export default function LoadingState({ message = 'Loading…' }: Props) {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: '#626F86' }} aria-live="polite">
      {message}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/components/EmptyState.tsx`**

```tsx
interface Props { title: string; description?: string }

export default function EmptyState({ title, description }: Props) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>{title}</p>
      {description && <p style={{ color: '#626F86', marginTop: 8 }}>{description}</p>}
    </div>
  );
}
```

- [ ] **Step 7: Create `src/components/WarningList.tsx`**

```tsx
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
```

- [ ] **Step 8: Build the frontend to verify no compile errors**

```bash
cd static/projectlens-ui && npm run build
```

Expected: build succeeds

- [ ] **Step 9: Commit**

```bash
git add static/projectlens-ui/src/
git commit -m "feat: add shared UI components — RiskBadge, ProbabilityBadge, LoadingState, EmptyState, WarningList"
```

---

## Task 9: Dashboard Page (UI against mock resolver data)

**Files:**
- Modify: `static/projectlens-ui/src/pages/DashboardPage.tsx`
- Create: `static/projectlens-ui/src/state/dashboardState.ts`

**Interfaces:**
- Consumes: `getDashboardData` from `forgeApi.ts`; `RiskBadge`, `ProbabilityBadge`, `LoadingState`, `EmptyState`, `WarningList`

- [ ] **Step 1: Create `src/state/dashboardState.ts`**

```ts
import type { DashboardData } from '../api/forgeApi';
import type { WarningItem } from '../types/viewModels';

export type DashboardStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface DashboardState {
  status: DashboardStatus;
  data: DashboardData | null;
  warnings: WarningItem[];
  errors: { code: string; message: string }[];
  partial: boolean;
  sortField: 'riskScore' | 'projectName';
  sortDirection: 'asc' | 'desc';
}

export const initialDashboardState: DashboardState = {
  status: 'idle',
  data: null,
  warnings: [],
  errors: [],
  partial: false,
  sortField: 'riskScore',
  sortDirection: 'desc',
};
```

- [ ] **Step 2: Replace `src/pages/DashboardPage.tsx` with full implementation**

```tsx
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
    case 'FETCH_SUCCESS': return { ...action.payload, status: 'loaded' };
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
      {state.status === 'error' && <EmptyState title="Failed to load dashboard" description={state.errors[0]?.message} />}
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
```

- [ ] **Step 3: Build frontend**

```bash
cd static/projectlens-ui && npm run build
```

Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add static/projectlens-ui/src/
git commit -m "feat: implement Dashboard page with risk table, sort, partial states"
```

---

## Task 10: Project Detail & Settings Pages

**Files:**
- Modify: `static/projectlens-ui/src/pages/ProjectDetailPage.tsx`
- Modify: `static/projectlens-ui/src/pages/SettingsPage.tsx`

**Interfaces:**
- Consumes: `getProjectRiskDetail`, `getSettings`, `saveSettings` from `forgeApi.ts`

- [ ] **Step 1: Replace `ProjectDetailPage.tsx` with full implementation**

```tsx
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
                {[['Blocked Issues', data.breakdown.blockedRisk],['Velocity Drop', data.breakdown.velocityRisk],['Scope Creep', data.breakdown.scopeCreepRisk],['Unassigned Work', data.breakdown.unassignedRisk]].map(([label, score]) => (
                  <tr key={label as string} style={{ borderBottom: '1px solid #EBECF0' }}>
                    <td style={{ padding: '6px 12px' }}>{label}</td>
                    <td style={{ padding: '6px 12px' }}>{score}</td>
                  </tr>
                ))}
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
```

- [ ] **Step 2: Replace `SettingsPage.tsx` with full implementation**

```tsx
import { useEffect, useState } from 'react';
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

interface Props { onBack: () => void }

export default function SettingsPage({ onBack }: Props) {
  const [status, setStatus] = useState<'loading'|'loaded'|'saving'|'saved'|'error'>('loading');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(result => { setSettings(result.data as Settings); setStatus('loaded'); })
      .catch(() => setStatus('error'));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setStatus('saving');
    setSaveError(null);
    const result = await saveSettings(settings);
    if (result.errors.length > 0) {
      setSaveError(result.errors[0].message);
      setStatus('loaded');
    } else {
      setStatus('saved');
    }
  }

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    if (status === 'saved') setStatus('loaded');
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 700 }}>
      <button onClick={onBack} style={{ marginBottom: 16, cursor: 'pointer' }}>← Back</button>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>ProjectLens Settings</h1>
      {status === 'loading' && <LoadingState message="Loading settings…" />}
      {status === 'error' && <p style={{ color: '#AE2A19' }}>Failed to load settings.</p>}
      {settings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Story Points Field ID</div>
            <input value={settings.storyPointsFieldId} onChange={e => update('storyPointsFieldId', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Blocked Status Names (comma-separated)</div>
            <input value={settings.blockedStatusNames.join(', ')}
              onChange={e => update('blockedStatusNames', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Blocked Age Threshold (days)</div>
            <input type="number" min={0} value={settings.blockedAgeThresholdDays}
              onChange={e => update('blockedAgeThresholdDays', Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Velocity Lookback Sprints</div>
            <input type="number" min={1} max={20} value={settings.velocityLookbackSprints}
              onChange={e => update('velocityLookbackSprints', Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Scope Creep Threshold (%)</div>
            <input type="number" min={0} max={100} value={settings.scopeCreepThresholdPercent}
              onChange={e => update('scopeCreepThresholdPercent', Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Unassigned Threshold (%)</div>
            <input type="number" min={0} max={100} value={settings.unassignedThresholdPercent}
              onChange={e => update('unassignedThresholdPercent', Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={settings.useIssueCountFallback}
              onChange={e => update('useIssueCountFallback', e.target.checked)} />
            Use issue count as fallback when story points are not configured
          </label>
          {saveError && <p style={{ color: '#AE2A19' }}>{saveError}</p>}
          {status === 'saved' && <p style={{ color: '#1F845A' }}>Settings saved.</p>}
          <button onClick={handleSave} disabled={status === 'saving'}
            style={{ padding: '8px 24px', cursor: status === 'saving' ? 'not-allowed' : 'pointer', width: 'fit-content' }}>
            {status === 'saving' ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build frontend**

```bash
cd static/projectlens-ui && npm run build
```

Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add static/projectlens-ui/src/pages/
git commit -m "feat: implement ProjectDetail and Settings pages against resolver contracts"
```

---

## Task 11: Jira Service Integration

**Files:**
- Create: `src/services/jiraService.ts`
- Modify: `src/test/fixtures/jiraIssues.ts`

**Interfaces:**
- Consumes: `fetchAllPages` from `src/utils/pagination.ts`; types from `src/types/jira.ts`
- Produces:
  - `getProjectBoards(projectKey: string): Promise<JiraBoard[]>`
  - `getActiveSprint(boardId: number): Promise<JiraSprint | null>`
  - `getClosedSprints(boardId: number, limit: number): Promise<JiraSprint[]>`
  - `getSprintIssues(sprintId: number, storyPointsField: string, excludedTypes: string[]): Promise<JiraIssue[]>`
  - `getProjectIssues(projectKey: string, jql?: string): Promise<JiraIssue[]>`

- [ ] **Step 1: Create test fixtures**

Create `src/test/fixtures/jiraIssues.ts`:
```ts
import type { JiraIssue, JiraBoard, JiraSprint } from '../../types/jira';

export const mockBoards: JiraBoard[] = [
  { id: 1, name: 'DEMO board', type: 'scrum', location: { projectKey: 'DEMO' } },
];

export const mockActiveSprint: JiraSprint = {
  id: 101,
  name: 'Sprint 5',
  state: 'active',
  startDate: '2026-06-01T00:00:00.000Z',
  endDate: '2026-06-14T00:00:00.000Z',
};

export const mockClosedSprints: JiraSprint[] = [
  { id: 98, name: 'Sprint 2', state: 'closed', startDate: '2026-04-07T00:00:00.000Z', endDate: '2026-04-20T00:00:00.000Z', completeDate: '2026-04-20T00:00:00.000Z' },
  { id: 99, name: 'Sprint 3', state: 'closed', startDate: '2026-04-21T00:00:00.000Z', endDate: '2026-05-04T00:00:00.000Z', completeDate: '2026-05-04T00:00:00.000Z' },
  { id: 100, name: 'Sprint 4', state: 'closed', startDate: '2026-05-05T00:00:00.000Z', endDate: '2026-05-18T00:00:00.000Z', completeDate: '2026-05-18T00:00:00.000Z' },
];

export const mockSprintIssues: JiraIssue[] = [
  { id: '1', key: 'DEMO-1', fields: { summary: 'Task A', status: { name: 'In Progress', statusCategory: { key: 'indeterminate' } }, assignee: { accountId: 'u1', displayName: 'Alice' }, story_points: 5 } },
  { id: '2', key: 'DEMO-2', fields: { summary: 'Blocked task', status: { name: 'Blocked', statusCategory: { key: 'indeterminate' } }, assignee: null, story_points: 3 } },
  { id: '3', key: 'DEMO-3', fields: { summary: 'Done task', status: { name: 'Done', statusCategory: { key: 'done' } }, assignee: { accountId: 'u2', displayName: 'Bob' }, story_points: 8 } },
];
```

- [ ] **Step 2: Create `src/services/jiraService.ts`**

```ts
import { requestJira, route } from '@forge/api';
import type { JiraBoard, JiraIssue, JiraSprint, JiraPaginatedResponse } from '../types/jira';

async function getJson<T>(path: string): Promise<T> {
  const res = await requestJira(route`${path}`);
  if (!res.ok) throw new Error(`Jira API error ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

async function fetchAllPages<T>(
  buildUrl: (startAt: number) => string,
  extractItems: (body: JiraPaginatedResponse<T>) => T[],
  pageSize = 50
): Promise<T[]> {
  const results: T[] = [];
  let startAt = 0;
  let isLast = false;

  while (!isLast) {
    const body = await getJson<JiraPaginatedResponse<T>>(buildUrl(startAt));
    const items = extractItems(body);
    results.push(...items);
    const total = body.total ?? 0;
    const maxResults = body.maxResults ?? pageSize;
    isLast = body.isLast ?? (startAt + maxResults >= total);
    startAt += maxResults;
    if (items.length === 0) break;
  }

  return results;
}

export async function getProjectBoards(projectKey: string): Promise<JiraBoard[]> {
  return fetchAllPages<JiraBoard>(
    (s) => `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&startAt=${s}&maxResults=50`,
    (body) => (body.values ?? []) as JiraBoard[]
  );
}

export async function getActiveSprint(boardId: number): Promise<JiraSprint | null> {
  type SprintResponse = { values: JiraSprint[] };
  const body = await getJson<SprintResponse>(`/rest/agile/1.0/board/${boardId}/sprint?state=active&maxResults=1`);
  return body.values?.[0] ?? null;
}

export async function getClosedSprints(boardId: number, limit: number): Promise<JiraSprint[]> {
  return fetchAllPages<JiraSprint>(
    (s) => `/rest/agile/1.0/board/${boardId}/sprint?state=closed&startAt=${s}&maxResults=${limit}`,
    (body) => (body.values ?? []) as JiraSprint[]
  );
}

export async function getSprintIssues(sprintId: number, storyPointsField: string, excludedTypes: string[] = []): Promise<JiraIssue[]> {
  const typeFilter = excludedTypes.length > 0
    ? ` AND issueType NOT IN (${excludedTypes.map(t => `"${t}"`).join(',')})`
    : '';
  const jql = encodeURIComponent(`sprint = ${sprintId}${typeFilter}`);
  const fields = `summary,status,assignee,${storyPointsField}`;
  return fetchAllPages<JiraIssue>(
    (s) => `/rest/api/3/search?jql=${jql}&fields=${fields}&startAt=${s}&maxResults=100`,
    (body) => (body.issues ?? []) as JiraIssue[]
  );
}

export async function getProjectIssues(projectKey: string, extraJql = '', fields = 'summary,status,assignee'): Promise<JiraIssue[]> {
  const jql = encodeURIComponent(`project = ${projectKey}${extraJql ? ' AND ' + extraJql : ''}`);
  return fetchAllPages<JiraIssue>(
    (s) => `/rest/api/3/search?jql=${jql}&fields=${fields}&startAt=${s}&maxResults=100`,
    (body) => (body.issues ?? []) as JiraIssue[]
  );
}
```

- [ ] **Step 3: Run `npx tsc --noEmit`**

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/services/jiraService.ts src/test/fixtures/jiraIssues.ts
git commit -m "feat: add Jira service — boards, sprints, issues with pagination"
```

---

## Task 12: Analysis Service (ties Jira + Scoring + Monte Carlo)

**Files:**
- Create: `src/services/analysisService.ts`
- Create: `src/services/recommendationsService.ts`
- Create: `src/test/analysisService.test.ts`

**Interfaces:**
- Consumes: `jiraService`, `riskScoringService`, `monteCarloService`, all types
- Produces:
  - `analyzeProject(projectKey: string, settings: AppSettings): Promise<ProjectAnalysisResult>`
  - `analyzePortfolio(settings: AppSettings): Promise<{ projects: RiskProjectSummary[]; partial: boolean; warnings: AppWarning[] }>`

- [ ] **Step 1: Create `src/services/recommendationsService.ts`**

```ts
import type { RiskBreakdown } from '../types/risk';

export function generateRecommendations(breakdown: RiskBreakdown, blockedIssueKeys: string[]): string[] {
  const recommendations: string[] = [];
  if (breakdown.blockedRisk >= 70) {
    recommendations.push(`Unblock or reassign ${blockedIssueKeys.slice(0, 3).join(', ')} — they have been blocked for multiple days.`);
  }
  if (breakdown.velocityRisk >= 70) {
    recommendations.push('Velocity has dropped significantly this sprint. Run a quick team sync to identify impediments.');
  }
  if (breakdown.scopeCreepRisk >= 40) {
    recommendations.push('Scope has grown since sprint start. Review newly added issues with the Product Owner.');
  }
  if (breakdown.unassignedRisk >= 40) {
    recommendations.push('Several sprint issues are unassigned. Assign them before mid-sprint to avoid delivery risk.');
  }
  return recommendations;
}
```

- [ ] **Step 2: Write failing tests for analysis service**

Create `src/test/analysisService.test.ts`:
```ts
import { analyzeProject } from '../../services/analysisService';
import { mockBoards, mockActiveSprint, mockClosedSprints, mockSprintIssues } from './fixtures/jiraIssues';
import { DEFAULT_SETTINGS } from '../../types/settings';

jest.mock('../../services/jiraService', () => ({
  getProjectBoards: jest.fn().mockResolvedValue(mockBoards),
  getActiveSprint: jest.fn().mockResolvedValue(mockActiveSprint),
  getClosedSprints: jest.fn().mockResolvedValue(mockClosedSprints),
  getSprintIssues: jest.fn().mockResolvedValue(mockSprintIssues),
  getProjectIssues: jest.fn().mockResolvedValue(mockSprintIssues),
}));

describe('analyzeProject', () => {
  it('returns a valid ProjectAnalysisResult', async () => {
    const result = await analyzeProject('DEMO', { ...DEFAULT_SETTINGS, selectedProjectKeys: ['DEMO'] });
    expect(result.project.projectKey).toBe('DEMO');
    expect(result.project.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.project.riskScore).toBeLessThanOrEqual(100);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.project.riskLevel);
  });

  it('marks result partial when board not found', async () => {
    const { getProjectBoards } = require('../../services/jiraService');
    getProjectBoards.mockResolvedValueOnce([]);
    const result = await analyzeProject('DEMO', DEFAULT_SETTINGS);
    expect(result.partial).toBe(true);
    expect(result.warnings.some(w => w.code === 'BOARD_NOT_FOUND')).toBe(true);
  });

  it('uses issue count fallback when story points field not populated', async () => {
    const { getSprintIssues } = require('../../services/jiraService');
    const issuesWithoutPoints = mockSprintIssues.map(i => ({ ...i, fields: { ...i.fields, story_points: null } }));
    getSprintIssues.mockResolvedValueOnce(issuesWithoutPoints);
    const result = await analyzeProject('DEMO', { ...DEFAULT_SETTINGS, useIssueCountFallback: true });
    expect(result.warnings.some(w => w.code === 'STORY_POINTS_NOT_CONFIGURED' || w.code === 'USING_ISSUE_COUNT_FALLBACK')).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- --testPathPattern=analysisService
```

Expected: FAIL — module not found

- [ ] **Step 4: Create `src/services/analysisService.ts`**

```ts
import * as jiraService from './jiraService';
import * as riskScoringService from './riskScoringService';
import { calculateCompletionProbability } from './monteCarloService';
import { generateRecommendations } from './recommendationsService';
import type { AppSettings } from '../types/settings';
import type { ProjectAnalysisResult, RiskProjectSummary, RiskBreakdown } from '../types/risk';
import type { AppWarning, AppError } from '../types/app';

function getStoryPoints(issue: { fields: Record<string, unknown> }, fieldId: string): number | null {
  const val = issue.fields[fieldId];
  if (typeof val === 'number') return val;
  return null;
}

export async function analyzeProject(projectKey: string, settings: AppSettings): Promise<ProjectAnalysisResult> {
  const warnings: AppWarning[] = [];
  const errors: AppError[] = [];
  let partial = false;

  const boards = await jiraService.getProjectBoards(projectKey);
  if (boards.length === 0) {
    warnings.push({ code: 'BOARD_NOT_FOUND', message: `No board found for project ${projectKey}.`, severity: 'warning', projectKey });
    partial = true;
    return buildEmptyResult(projectKey, warnings, errors, partial);
  }
  if (boards.length > 1) {
    warnings.push({ code: 'MULTIPLE_BOARDS_FOUND', message: `Multiple boards found for ${projectKey}; using the first.`, severity: 'info', projectKey });
  }
  const board = boards[0];

  const activeSprint = await jiraService.getActiveSprint(board.id).catch(() => null);
  if (!activeSprint) {
    warnings.push({ code: 'NO_ACTIVE_SPRINT', message: `No active sprint for ${projectKey}.`, severity: 'warning', projectKey });
    if (!settings.includeProjectsWithoutActiveSprint) {
      partial = true;
      return buildEmptyResult(projectKey, warnings, errors, partial);
    }
  }

  const sprintIssues = activeSprint
    ? await jiraService.getSprintIssues(activeSprint.id, settings.storyPointsFieldId, settings.excludedIssueTypes).catch(() => [])
    : [];

  const today = new Date();
  const blockedIssues = sprintIssues
    .filter(i => settings.blockedStatusNames.includes(i.fields.status.name))
    .map(i => {
      const sprintStart = activeSprint?.startDate ? new Date(activeSprint.startDate) : today;
      const daysBlocked = Math.floor((today.getTime() - sprintStart.getTime()) / 86400000);
      return { key: i.key, summary: i.fields.summary, daysBlocked };
    });

  const unassignedCount = sprintIssues.filter(i => !i.fields.assignee).length;
  const totalIssueCount = sprintIssues.length;

  const closedSprints = await jiraService.getClosedSprints(board.id, settings.velocityLookbackSprints).catch(() => []);
  const velocityHistory: number[] = [];
  for (const sprint of closedSprints.slice(-settings.velocityLookbackSprints)) {
    const issues = await jiraService.getSprintIssues(sprint.id, settings.storyPointsFieldId, settings.excludedIssueTypes).catch(() => []);
    const doneIssues = issues.filter(i => i.fields.status.statusCategory.key === 'done');
    const hasPoints = doneIssues.some(i => getStoryPoints(i, settings.storyPointsFieldId) !== null);
    if (hasPoints) {
      const sprintVelocity = doneIssues.reduce((sum, i) => sum + (getStoryPoints(i, settings.storyPointsFieldId) ?? 0), 0);
      velocityHistory.push(sprintVelocity);
    } else if (settings.useIssueCountFallback) {
      velocityHistory.push(doneIssues.length);
      warnings.push({ code: 'USING_ISSUE_COUNT_FALLBACK', message: 'Story points not configured; using issue count for velocity.', severity: 'info', projectKey });
    }
  }

  if (velocityHistory.length < 3) {
    warnings.push({ code: 'INSUFFICIENT_VELOCITY_HISTORY', message: 'Fewer than 3 completed sprints available for velocity analysis.', severity: 'info', projectKey });
  }

  const hasPoints = sprintIssues.some(i => getStoryPoints(i, settings.storyPointsFieldId) !== null);
  if (!hasPoints && sprintIssues.length > 0) {
    warnings.push({ code: 'STORY_POINTS_NOT_CONFIGURED', message: `Story points field "${settings.storyPointsFieldId}" not found.`, severity: 'warning', projectKey });
  }

  const remainingPoints = hasPoints
    ? sprintIssues.filter(i => i.fields.status.statusCategory.key !== 'done')
        .reduce((sum, i) => sum + (getStoryPoints(i, settings.storyPointsFieldId) ?? 0), 0)
    : sprintIssues.filter(i => i.fields.status.statusCategory.key !== 'done').length;

  const { probability: completionProbability, confidence: completionConfidence } =
    velocityHistory.length > 0 ? calculateCompletionProbability(remainingPoints, velocityHistory) : { probability: null as unknown as number, confidence: 'LOW' as const };

  const avgDaysBlocked = blockedIssues.length > 0
    ? blockedIssues.reduce((s, i) => s + i.daysBlocked, 0) / blockedIssues.length
    : 0;

  const breakdown: RiskBreakdown = {
    blockedRisk: riskScoringService.calculateBlockedRisk(blockedIssues.length, totalIssueCount, avgDaysBlocked, settings.blockedAgeThresholdDays),
    velocityRisk: riskScoringService.calculateVelocityDropRisk(velocityHistory),
    scopeCreepRisk: riskScoringService.calculateScopeCreepRisk(0, totalIssueCount, settings.scopeCreepThresholdPercent),
    unassignedRisk: riskScoringService.calculateUnassignedRisk(unassignedCount, totalIssueCount, settings.unassignedThresholdPercent),
  };
  const riskScore = riskScoringService.calculateRiskScore(breakdown);
  const riskLevel = riskScoringService.calculateRiskLevel(riskScore);

  const summary: RiskProjectSummary = {
    projectKey,
    projectName: projectKey,
    riskScore,
    riskLevel,
    breakdown,
    completionProbability: typeof completionProbability === 'number' ? completionProbability : null,
    completionConfidence,
    sprintName: activeSprint?.name ?? null,
    lastUpdated: new Date().toISOString(),
    partial,
  };

  return {
    project: summary,
    breakdown,
    blockedIssues,
    velocityHistory,
    scopeCreepPercent: 0,
    unassignedCount,
    recommendations: generateRecommendations(breakdown, blockedIssues.map(i => i.key)),
    errors,
    warnings,
    partial,
  };
}

export async function analyzePortfolio(settings: AppSettings): Promise<{ projects: RiskProjectSummary[]; partial: boolean; warnings: AppWarning[] }> {
  const allWarnings: AppWarning[] = [];
  let portfolioPartial = false;
  const summaries: RiskProjectSummary[] = [];

  await Promise.allSettled(
    settings.selectedProjectKeys.map(async (projectKey) => {
      try {
        const result = await analyzeProject(projectKey, settings);
        summaries.push(result.project);
        allWarnings.push(...result.warnings);
        if (result.partial) portfolioPartial = true;
      } catch {
        portfolioPartial = true;
        allWarnings.push({ code: 'PROJECT_ANALYSIS_FAILED', message: `Analysis failed for ${projectKey}.`, severity: 'warning', projectKey });
      }
    })
  );

  return { projects: summaries, partial: portfolioPartial, warnings: allWarnings };
}

function buildEmptyResult(projectKey: string, warnings: AppWarning[], errors: AppError[], partial: boolean): ProjectAnalysisResult {
  const summary: RiskProjectSummary = {
    projectKey,
    projectName: projectKey,
    riskScore: 0,
    riskLevel: 'LOW',
    breakdown: { blockedRisk: 0, velocityRisk: 0, scopeCreepRisk: 0, unassignedRisk: 0 },
    completionProbability: null,
    completionConfidence: 'LOW',
    sprintName: null,
    lastUpdated: new Date().toISOString(),
    partial,
  };
  return { project: summary, breakdown: summary.breakdown, blockedIssues: [], velocityHistory: [], scopeCreepPercent: 0, unassignedCount: 0, recommendations: [], errors, warnings, partial };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=analysisService
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/analysisService.ts src/services/recommendationsService.ts src/test/analysisService.test.ts
git commit -m "feat: add analysis service — orchestrates Jira data, risk scoring, Monte Carlo, recommendations"
```

---

## Task 13: Wire Resolvers to Live Analysis Service

**Files:**
- Modify: `src/resolvers/dashboardResolver.ts`
- Modify: `src/resolvers/projectResolver.ts`

**Interfaces:**
- Consumes: `analyzePortfolio`, `analyzeProject` from `analysisService.ts`; `getSettings` from `storageService.ts`; `mergeWithDefaults` from `settingsService.ts`

- [ ] **Step 1: Update `dashboardResolver.ts` to use live analysis**

```ts
import type { ResolverResult } from '../types/app';
import type { RiskProjectSummary } from '../types/risk';
import { analyzePortfolio } from '../services/analysisService';
import * as storageService from '../services/storageService';
import { mergeWithDefaults } from '../services/settingsService';

export interface DashboardData {
  projects: RiskProjectSummary[];
  lastRefreshed: string;
}

export async function getDashboardDataHandler(): Promise<ResolverResult<DashboardData>> {
  const stored = await storageService.getSettings();
  const settings = mergeWithDefaults(stored);

  if (settings.selectedProjectKeys.length === 0) {
    return {
      data: { projects: [], lastRefreshed: new Date().toISOString() },
      warnings: [{ code: 'BOARD_NOT_FOUND', message: 'No projects configured. Go to Settings to select projects.', severity: 'info' }],
      errors: [],
      partial: false,
    };
  }

  const { projects, partial, warnings } = await analyzePortfolio(settings);
  return {
    data: { projects, lastRefreshed: new Date().toISOString() },
    warnings,
    errors: [],
    partial,
  };
}
```

- [ ] **Step 2: Update `projectResolver.ts` to use live analysis**

```ts
import type { ResolverResult } from '../types/app';
import type { ProjectAnalysisResult } from '../types/risk';
import { analyzeProject } from '../services/analysisService';
import * as storageService from '../services/storageService';
import { mergeWithDefaults } from '../services/settingsService';

export async function getProjectRiskDetailHandler(projectKey: string): Promise<ResolverResult<ProjectAnalysisResult>> {
  const stored = await storageService.getSettings();
  const settings = mergeWithDefaults(stored);

  const result = await analyzeProject(projectKey, settings);
  await storageService.setCachedProjectAnalysis(projectKey, result);

  return {
    data: result,
    warnings: result.warnings,
    errors: result.errors,
    partial: result.partial,
  };
}
```

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 4: Run `npx tsc --noEmit`**

Expected: no errors

- [ ] **Step 5: Build UI**

```bash
cd static/projectlens-ui && npm run build
```

Expected: build succeeds

- [ ] **Step 6: Run `forge lint`**

```bash
forge lint
```

Expected: no scope violations

- [ ] **Step 7: Commit**

```bash
git add src/resolvers/dashboardResolver.ts src/resolvers/projectResolver.ts
git commit -m "feat: wire resolvers to live analysis service — end-to-end data flow complete"
```

---

## Self-Review Against Spec

**Spec coverage check:**
- FR-1–4 (Portfolio Dashboard): Task 9 + Task 13 ✓
- FR-5–10 (Project Detail): Task 10 + Task 12 ✓
- FR-11–13 (Risk Scoring): Task 4 ✓
- FR-14–15 (Monte Carlo): Task 5 ✓
- FR-16–20 (Settings/Onboarding): Task 6 + Task 7 + Task 10 ✓
- FR-21–23 (Marketplace-ready): Task 11 + Task 12 (partial flags, permission handling, paginated APIs) ✓

**Gaps:**
- Scope creep calculation in `analysisService` uses `addedIssues: 0` — sprint issue history comparison is left as a stub. Full scope creep requires fetching sprint contents at start-of-sprint via Jira sprint report API, which is a sprint-specific detail and left as a known gap with `scopeCreepPercent: 0` until that API is integrated.
- `projectName` in `analyzeProject` uses `projectKey` as placeholder — a Jira project detail call (`/rest/api/3/project/{projectKey}`) should populate this. Add it as a follow-up in `jiraService`.
- `forge deploy` and `forge install` are manual developer operations not automated in this plan; they require a Jira Cloud developer site.

**Placeholder scan:** No "TBD" or "TODO" found in task steps. All code blocks are complete.

**Type consistency:** `RiskBreakdown`, `AppWarning`, `AppError`, `ResolverResult<T>` are defined in Task 3 and referenced consistently across all tasks. `DashboardData` is defined in Task 7 and used in Task 9.

---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-ProjectLens-2026-06-08/prd.md
  - _bmad-output/planning-artifacts/prds/prd-ProjectLens-2026-06-08/addendum.md
  - _bmad-output/planning-artifacts/prds/prd-ProjectLens-2026-06-08/review-rubric.md
  - docs/project-context.md
  - docs/resolve-open-questions.md
workflowType: architecture
project_name: ProjectLens
user_name: Tung
date: 2026-06-08
lastStep: 8
status: complete
completedAt: 2026-06-08
---

# Architecture Decision Document: ProjectLens

## 1. Project Context Analysis

### Requirements Overview

ProjectLens is a Jira Cloud Marketplace app for cross-project portfolio risk intelligence. The MVP has 23 functional requirements grouped around:

- Portfolio Risk Dashboard: cross-project summaries, filtering, sorting, refresh, and drill-in.
- Project Risk Detail: risk breakdown, blocked work evidence, velocity, scope creep, unassigned work, and rule-based recommendations.
- Risk Scoring: normalized sub-risks, weighted Risk Score, and Risk Level mapping.
- Sprint Completion Prediction: Monte Carlo simulation using historical sprint velocity.
- Settings and Onboarding: admin-managed Site-wide Settings plus non-calculation User Preferences.
- Marketplace-ready data handling: permission-aware access, partial analysis, missing-data fallback, Scrum-first support, and Kanban graceful degradation.

The architecture must optimize for correctness under Jira variability, not for a perfect demo tenant. Project keys, board IDs, workflows, custom fields, roles, and sprint configurations must be discovered or configured.

### Non-Functional Requirements

Architecture-driving NFRs:

- Least-privilege Forge scopes.
- No external egress in MVP.
- No external backend in MVP.
- Permission-aware data access.
- Forge storage for settings and derived cached results.
- Avoid storing full issue payloads where derived metrics are enough.
- Partial project failure must not break portfolio analysis.
- Performance targets: under 3 seconds for 10 Selected Projects, under 5 seconds for 20, under 10 seconds for 50, with partial results preferred over complete failure.
- Accessibility: Risk Level indicators use color, text label, and icon or badge.
- Testability: scoring, simulation, settings merge, fallback, and permission-handling logic must be unit-testable.

### Scale and Complexity

- Primary domain: Atlassian Forge app with Custom UI, resolver backend, Jira REST integration, and Forge storage.
- Complexity level: medium-high for MVP because external infrastructure is small, but Jira permission/data variability is high.
- Estimated architectural components: manifest, resolver entrypoint, Jira API service, settings service, analysis orchestration service, risk scoring service, Monte Carlo service, storage/cache service, frontend API client, dashboard page, detail page, settings page, shared UI components, shared domain types, tests.

### Technical Constraints and Dependencies

- Use Atlassian Forge.
- Use one `jira:globalPage` module. Atlassian documentation states deployment fails if more than one `jira:globalPage` entry is defined.
- Use Custom UI for the richer dashboard.
- Use Forge resolver functions for Jira access and protected logic.
- Use Forge storage for Site-wide Settings, User Preferences, and cached derived analysis.
- Use Jira REST and Jira Software Agile REST APIs through Forge APIs.
- No external service calls or external egress in MVP.

### Cross-Cutting Concerns

- Authorization is enforced in resolvers, not only UI controls.
- Every resolver response carries warnings/errors/partial/confidence metadata.
- Jira API pagination is mandatory for list endpoints.
- Missing data is represented as typed fallback states, never thrown through to the UI as generic failure.
- Data minimization applies to cache and logs.
- Risk calculations are pure functions with deterministic test fixtures.

## 2. Starter Template Evaluation

### Primary Technology Domain

The primary technology domain is an Atlassian Forge Custom UI application:

- Backend/runtime: Forge resolver functions in TypeScript.
- Frontend: React Custom UI built with Vite.
- Persistence: Forge storage.
- External integration: Jira REST APIs via Forge.

This is not a generic web SaaS starter. The foundation should be the Forge CLI app structure plus a Vite React Custom UI resource.

### Selected Starter

Use a Forge Custom UI app scaffold with React and TypeScript, then shape it into the ProjectLens structure defined below.

Recommended initialization intent for the first implementation story:

```bash
forge create
```

Select a Jira Custom UI template where available. If the installed Forge CLI template set does not provide the exact target structure, initialize the closest Custom UI app and replace the Custom UI resource with a Vite React TypeScript app.

For the Custom UI app:

```bash
npm create vite@latest static/projectlens-ui -- --template react-ts
```

### Version Guidance

Use current stable versions at implementation time, pinned in `package.json` after scaffold:

- React: React 19 line is current according to React version documentation.
- Vite: Vite 8 line is current according to Vite release documentation.
- TypeScript: use the latest stable version compatible with Forge and Vite at scaffold time.

Avoid canary, beta, or experimental versions for MVP.

### Architectural Decisions Provided by Starter

**Language and Runtime**

- TypeScript for resolver and Custom UI.
- React for frontend rendering.
- Forge runtime for resolver execution.

**Build Tooling**

- Forge CLI for deployment, linting, manifest validation, and tunneling.
- Vite for Custom UI development and production build.

**Code Organization**

- Root Forge app owns `manifest.yml`, resolver source, shared domain code, and root package scripts.
- Custom UI lives under `static/projectlens-ui`.
- Cross-boundary types live in root `src/types` and are consumed by resolver code. Frontend may duplicate or import generated/shared types only if the build setup supports it cleanly.

**Testing**

- Unit tests for pure services in root source.
- Frontend component tests are optional in early skeleton but structure should allow them.
- Integration tests with Jira should be fixture-driven first; live Jira tests are a later hardening step.

## 3. Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions**

- Forge app with a single Jira global page.
- Custom UI React frontend with internal routing.
- Resolver-mediated Jira access.
- Forge storage for settings and derived cache.
- Pure TypeScript services for risk scoring and simulation.
- Typed resolver contracts with warnings, errors, partial, and confidence fields.
- Permission checks and partial-analysis handling in resolver/service layer.

**Important Decisions**

- Vite React TypeScript Custom UI.
- Feature-oriented frontend pages with shared components.
- No charting library for MVP unless simple table/badge UI becomes insufficient.
- Cached derived metrics, not full issue payloads.
- Co-located unit tests for pure services.

**Deferred Decisions**

- Marketplace licensing.
- External analytics or reporting backend.
- AI-generated recommendations.
- Notifications.
- Per-project threshold overrides.
- Priority/time-weighted unassigned risk beyond the basic MVP count.

### Data Architecture

Forge storage keys:

```txt
settings:site
preferences:user:{accountId}
analysis:project:{projectKey}
analysis:portfolio:last
```

Site-wide Settings shape follows the PRD:

- Selected project keys.
- Project-board mapping.
- Story point field ID.
- Blocked status names.
- Included/excluded issue types.
- Thresholds.
- Issue-count fallback flag.
- Include projects without active sprint flag.

User Preferences are non-calculation preferences only:

- Dashboard filters.
- Sorting preference.
- Favorite project keys.
- UI display preferences.

Cached ProjectAnalysisResult stores derived metrics, warnings, errors, confidence, partial flag, and last updated timestamp. Do not store issue descriptions, comments, attachments, or unrestricted full issue payloads.

### Authentication and Security

Authentication is delegated to Jira/Forge. ProjectLens does not implement its own auth.

Authorization rules:

- Resolver functions must assume the caller is the current Jira user.
- Site-wide settings mutation requires Jira Administrator verification before writing.
- UI should hide or disable admin controls for Regular Users, but resolver authorization remains the source of truth.
- Resolver responses must not include data from inaccessible projects, boards, sprints, or issues.

Security posture:

- Least-privilege scopes only.
- Read-only Jira scopes for MVP except Forge storage permissions.
- No external egress.
- No frontend secrets.
- No sensitive Jira payload logging.

### API and Communication Patterns

Frontend uses Forge bridge `invoke` only through a typed wrapper in `static/projectlens-ui/src/api/forgeApi.ts`.

Resolver functions:

- `getDashboardData`
- `getProjectRiskDetail`
- `getSettings`
- `saveSettings`
- `getUserPreferences`
- `saveUserPreferences`

Resolver response wrapper:

```ts
export interface ResolverResult<T> {
  data?: T;
  warnings: AppWarning[];
  errors: AppError[];
  partial: boolean;
}
```

Project analysis response:

```ts
export interface ProjectAnalysisResult {
  project: RiskProjectSummary;
  breakdown: RiskBreakdown;
  errors: AppError[];
  warnings: AppWarning[];
  partial: boolean;
}
```

Errors are for failed capabilities. Warnings are for degraded or fallback behavior.

### Frontend Architecture

Use lightweight internal routing in React state or a small router only if needed. MVP has three views:

- Dashboard.
- Project Detail.
- Settings.

Frontend state is local React state plus reducer-style state where view complexity requires it. Avoid global state libraries for MVP.

UI principles:

- Dashboard is a dense operational table, not a marketing layout.
- Risk indicators include color, text, and icon/badge.
- Empty, loading, partial, and error states are first-class components.
- Do not expose admin controls as usable actions for Regular Users.

### Infrastructure and Deployment

Deployment target is Atlassian Forge. No separate backend, database, containers, or cloud infrastructure are required for MVP.

Development commands should cover:

- Root TypeScript validation.
- Root unit tests.
- Custom UI build.
- Forge lint.
- Forge deploy/install/tunnel as manual developer workflows.

Performance measurement:

- Measure resolver total duration for `getDashboardData`.
- Measure frontend time from invoke start to rendered dashboard state.
- Report cache status in development logs without logging sensitive issue data.
- Treat PRD performance targets as warm-cache targets for 10/20/50 Selected Projects. Cold Jira API latency is tracked separately because Atlassian-side response time is not fully controlled by ProjectLens.

## 4. Implementation Patterns and Consistency Rules

### Naming Patterns

- TypeScript files: `camelCase.ts` for services/utilities, `PascalCase.tsx` for React components.
- React components: `PascalCase`.
- Types and interfaces: `PascalCase`.
- Functions and variables: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE` only for true constants; otherwise `camelCase`.
- Storage keys: colon-delimited lowercase prefixes, for example `settings:site`.
- Resolver names: verb-object names, for example `getDashboardData`.

### Structure Patterns

- Business logic lives in root `src/services`.
- Jira API normalization lives in `src/services/jiraService.ts` and related helpers.
- Pure risk math lives in `src/services/riskScoringService.ts` and `src/services/monteCarloService.ts`.
- Settings defaults and merge behavior live in `src/services/settingsService.ts`.
- Resolver functions orchestrate services; they do not contain scoring math or UI-specific formatting.
- Frontend pages live in `static/projectlens-ui/src/pages`.
- Frontend shared display components live in `static/projectlens-ui/src/components`.

### Format Patterns

- JSON fields use `camelCase`.
- Dates cross boundaries as ISO 8601 strings.
- Percentages are numeric 0-100 values unless a field name explicitly says ratio.
- Risk scores are numeric 0-100 values.
- Risk levels are uppercase enum strings: `LOW`, `MEDIUM`, `HIGH`.
- Confidence values are uppercase enum strings: `LOW`, `MEDIUM`, `HIGH`.

### Error and Warning Patterns

Use structured codes, not free-text-only errors.

Example warning:

```ts
{
  code: "BOARD_NOT_ACCESSIBLE",
  message: "Board data is unavailable for this project.",
  severity: "warning",
  projectKey: "ABC"
}
```

Common codes:

- `NO_ACTIVE_SPRINT`
- `INSUFFICIENT_VELOCITY_HISTORY`
- `STORY_POINTS_NOT_CONFIGURED`
- `USING_ISSUE_COUNT_FALLBACK`
- `BOARD_NOT_FOUND`
- `MULTIPLE_BOARDS_FOUND`
- `BOARD_NOT_ACCESSIBLE`
- `PARTIAL_DATA_DUE_TO_PERMISSIONS`
- `PROJECT_ANALYSIS_FAILED`

### Loading and Partial State Patterns

- A dashboard-level loading state is used only before any portfolio data is available.
- During refresh, keep stale data visible and mark refresh in progress.
- Per-project analysis failures render row-level fallback states.
- Detail view can show stale cached analysis with a refresh warning if live refresh fails.

### Testing Patterns

- Pure service tests use deterministic fixtures.
- Monte Carlo tests use injectable pseudo-random sampling or fixed sample arrays to avoid flaky tests.
- Jira service tests mock paginated Jira responses.
- Permission/fallback tests assert warning codes and partial flags, not only success data.
- UI tests focus on rendering risk labels, warning states, and admin/regular-user control visibility.

### Enforcement Guidelines

All implementation agents must:

- Keep Jira REST access behind `jiraService`.
- Keep scoring and simulation pure and unit-tested.
- Use typed warning/error codes for fallback behavior.
- Avoid storing full issue payloads.
- Avoid hard-coded Jira tenant assumptions.
- Keep resolver authorization checks even when the UI hides controls.

## 5. Project Structure and Boundaries

### Complete Project Directory Structure

```txt
ProjectLens/
|-- manifest.yml
|-- package.json
|-- tsconfig.json
|-- jest.config.js
|-- README.md
|-- src/
|   |-- index.ts
|   |-- resolvers/
|   |   |-- dashboardResolver.ts
|   |   |-- projectResolver.ts
|   |   |-- settingsResolver.ts
|   |   |-- preferencesResolver.ts
|   |-- services/
|   |   |-- analysisService.ts
|   |   |-- jiraService.ts
|   |   |-- monteCarloService.ts
|   |   |-- recommendationsService.ts
|   |   |-- riskScoringService.ts
|   |   |-- settingsService.ts
|   |   |-- storageService.ts
|   |-- types/
|   |   |-- app.ts
|   |   |-- jira.ts
|   |   |-- risk.ts
|   |   |-- settings.ts
|   |-- utils/
|   |   |-- date.ts
|   |   |-- math.ts
|   |   |-- pagination.ts
|   |-- test/
|       |-- fixtures/
|       |   |-- jiraIssues.ts
|       |   |-- jiraSprints.ts
|       |   |-- settings.ts
|       |-- monteCarloService.test.ts
|       |-- riskScoringService.test.ts
|       |-- settingsService.test.ts
|       |-- analysisService.test.ts
|-- static/
|   |-- projectlens-ui/
|       |-- package.json
|       |-- tsconfig.json
|       |-- vite.config.ts
|       |-- index.html
|       |-- src/
|           |-- App.tsx
|           |-- main.tsx
|           |-- api/
|           |   |-- forgeApi.ts
|           |-- components/
|           |   |-- EmptyState.tsx
|           |   |-- LoadingState.tsx
|           |   |-- ProbabilityBadge.tsx
|           |   |-- RiskBadge.tsx
|           |   |-- RiskHeatmap.tsx
|           |   |-- WarningList.tsx
|           |-- pages/
|           |   |-- DashboardPage.tsx
|           |   |-- ProjectDetailPage.tsx
|           |   |-- SettingsPage.tsx
|           |-- state/
|           |   |-- dashboardState.ts
|           |-- styles/
|           |   |-- app.css
|           |-- types/
|               |-- viewModels.ts
|-- docs/
|   |-- project-context.md
|   |-- resolve-open-questions.md
|-- _bmad-output/
```

### Architectural Boundaries

**Frontend boundary**

The frontend renders data and manages view state. It does not call Jira REST APIs directly and does not calculate authoritative Risk Scores.

**Resolver boundary**

Resolvers authorize, orchestrate services, shape resolver responses, and protect data access. They should be thin enough to test through service units.

**Jira service boundary**

`jiraService` owns Jira REST paths, pagination, field extraction, board/sprint lookup, and permission-related API handling.

**Analysis boundary**

`analysisService` coordinates settings, Jira data, risk scoring, simulation, recommendations, warnings, and cache writes.

**Pure domain boundary**

`riskScoringService`, `monteCarloService`, `date`, and `math` utilities are pure and independent of Forge, Jira, and React.

**Storage boundary**

`storageService` owns Forge storage key formats and read/write behavior.

### Requirements to Structure Mapping

- FR-1 through FR-4: `dashboardResolver.ts`, `analysisService.ts`, `DashboardPage.tsx`, dashboard components.
- FR-5 through FR-10: `projectResolver.ts`, `analysisService.ts`, `recommendationsService.ts`, `ProjectDetailPage.tsx`.
- FR-11 through FR-13: `riskScoringService.ts`, risk tests.
- FR-14 through FR-15: `monteCarloService.ts`, simulation tests.
- FR-16 through FR-20: `settingsResolver.ts`, `settingsService.ts`, `SettingsPage.tsx`.
- FR-21 through FR-23: `jiraService.ts`, `analysisService.ts`, warning/error types, permission/fallback tests.
- User Preferences from FR-2 and resolved decisions: `preferencesResolver.ts`, `storageService.ts`, dashboard state.

### Data Flow

Dashboard load:

```txt
DashboardPage
-> forgeApi.getDashboardData()
-> resolver getDashboardData
-> settingsService.getSettings()
-> analysisService.analyzePortfolio()
-> jiraService fetches allowed Jira data
-> riskScoringService + monteCarloService
-> storageService caches derived result
-> ResolverResult<DashboardData>
-> DashboardPage renders rows, warnings, partial states
```

Settings save:

```txt
SettingsPage
-> forgeApi.saveSettings()
-> resolver saveSettings
-> verify Jira Administrator
-> settingsService.validateAndMerge()
-> storageService writes settings:site
-> ResolverResult<AppSettings>
```

Project detail:

```txt
ProjectDetailPage
-> forgeApi.getProjectRiskDetail(projectKey)
-> resolver getProjectRiskDetail
-> analysisService.analyzeProject()
-> Jira, scoring, simulation, recommendations
-> detail view model with warnings/errors/partial/confidence
```

## 6. Architecture Validation Results

### Coherence Validation

**Decision compatibility:** The stack is coherent: Forge hosts the app, Custom UI handles the dashboard, resolvers protect Jira access, Forge storage handles settings/cache, and pure TypeScript services keep analytics testable.

**Pattern consistency:** Naming, response wrappers, warning codes, storage keys, and service boundaries align with the Forge resolver model.

**Structure alignment:** The proposed tree maps directly to PRD features and separates UI, resolver orchestration, Jira access, storage, and pure risk logic.

### Requirements Coverage Validation

**Functional requirements:** All FR-1 through FR-23 have an architectural home in resolvers, services, frontend pages, shared types, or tests.

**NFRs:** Least privilege, privacy, no egress, resilience, performance measurement, accessibility, and testability are explicitly addressed.

**Resolved PRD decisions:** Admin-only settings, User Preferences, Kanban degradation, historical lookback, site-wide thresholds, risk indicators, and Marketplace positioning are represented.

### Gap Analysis Results

**Critical gaps:** None.

**Important gaps:**

- Exact Forge scopes must be finalized during implementation by running Forge lint against actual Jira API usage.
- Jira Administrator verification method must be implemented and tested against Forge/Jira permission APIs.
- Performance targets need benchmark fixtures and a warm-cache/cold-cache distinction in test reporting.
- Live Jira integration tests require a test Jira Cloud site and cannot be fully proven by unit tests alone.

**Minor gaps:**

- Marketplace listing copy is deferred.
- UX visual design specification is still needed.
- Priority/time-weighted unassigned risk remains deferred beyond the basic MVP count.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High for MVP skeleton and service architecture; medium for live Jira permission behavior until verified against a real Jira Cloud site.

**Key Strengths**

- Clear Forge-only MVP architecture with no external backend.
- Permission and partial-data behavior treated as architecture, not UI afterthought.
- Pure analytics services are testable before live Jira integration.
- Project structure is specific enough for story generation and AI implementation.

**Areas for Future Enhancement**

- Per-project threshold overrides.
- More advanced blocker detection beyond status names.
- Trend history and report exports.
- Marketplace licensing.
- External notifications if later approved.

### Implementation Handoff

AI implementation agents must:

- Scaffold the Forge app first.
- Implement typed models and pure services before real Jira integration.
- Keep resolver contracts stable.
- Add Jira integration incrementally behind `jiraService`.
- Preserve fallback and warning behavior from the first dashboard story.

First implementation priority:

1. Scaffold Forge Custom UI app and manifest with one `jira:globalPage`.
2. Add shared TypeScript domain models.
3. Implement `riskScoringService`, `monteCarloService`, and `settingsService` with unit tests.
4. Add resolver stubs returning mock dashboard/settings data.
5. Build Dashboard, Detail, and Settings UI against resolver contracts.
6. Replace mock data with Jira API integration incrementally.


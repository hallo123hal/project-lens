# Project Context: ProjectLens — Cross-project Portfolio Risk Intelligence

## 1. Product Summary

ProjectLens is a lightweight Atlassian Forge app for Jira that helps PMOs, Engineering Managers, Delivery Managers, Project Managers, Scrum Masters, and Tech Leads monitor delivery risks across multiple Jira projects.

The core idea is a cross-project portfolio risk radar. Instead of opening 10–20 Jira boards manually and consolidating data in Excel, users can view a single dashboard showing risk status, risk score, and sprint completion probability across selected projects.

The app should be simple, fast, configurable, and Marketplace-ready. It is not intended to replace heavyweight portfolio tools such as BigPicture, Structure, Advanced Roadmaps, or enterprise planning suites.

---

## 2. Market Pain Point

PMO and Engineering Managers often manage 10–20 Jira projects at the same time, but they do not have an easy way to get a holistic view of cross-project delivery risks.

Current workflow is usually manual:

- Open each Jira board one by one.
- Check sprint progress manually.
- Look for blocked issues manually.
- Compare velocity manually.
- Consolidate data into Excel or status reports.

Existing portfolio apps can be powerful, but they are often too heavy, complex, or expensive for small and mid-sized teams.

ProjectLens should focus on one clear question:

> Which projects are at risk right now, and why?

---

## 3. Product Vision

Build a lightweight portfolio risk radar for Jira.

The app should:

- Automatically detect delivery risks across multiple Jira projects.
- Calculate a Risk Score for each project.
- Display a cross-project heatmap.
- Highlight the top risk reasons per project.
- Predict sprint completion probability using Monte Carlo simulation based on historical velocity.
- Help managers quickly identify which projects need attention.

---

## 4. Significant Requirement: Marketplace-readiness

ProjectLens must be designed as a Marketplace-ready Forge app from the beginning.

This means the app must not be built only for one internal Jira instance, one fixed project setup, one specific workflow, or one specific team convention. It should work reliably across different Jira Cloud sites, users, projects, boards, workflows, custom fields, permissions, and data quality levels.

The most important product and engineering rule is:

> Build ProjectLens as a real Marketplace app, not an internal single-tenant script. Every project, board, field, workflow, and permission assumption must either be discovered dynamically or configurable by the user.

### 4.1 Marketplace-readiness Principles

The app must support:

- Multiple Jira Cloud sites with different project structures.
- Multiple users with different Jira permissions.
- Multiple projects, boards, and active sprints.
- Company-managed and team-managed projects where possible.
- Different workflow status names and status categories.
- Different story point field configurations.
- Projects that do not use story points.
- Projects that do not use Scrum or active sprints.
- Jira instances with incomplete, inconsistent, or missing data.
- Customers with many projects and large issue volumes.

The app must avoid hard-coded assumptions such as:

- Fixed project keys.
- Fixed board IDs.
- Fixed sprint names.
- Fixed custom field IDs.
- Fixed blocked status names.
- Fixed workflow structures.
- Fixed story point fields.
- Fixed user roles.
- Fixed issue types.
- Fixed estimation methods.

Any tenant-specific behavior must be configurable through the app settings.

### 4.2 Permission and Access Behavior

ProjectLens must respect Jira permissions.

A user should only see projects, issues, boards, and sprint data they are allowed to access in Jira.

If a user does not have access to a project or board, the app must not expose that data.

If data is partially unavailable because of permissions, the app should show a clear partial-access or insufficient-permission state instead of failing silently.

Examples of expected states:

- `Insufficient project permission`
- `Board not accessible`
- `Partial data due to permissions`
- `Some projects could not be analyzed`

### 4.3 Configuration Requirements

The app should allow each Jira site or admin user to configure:

- Which projects are included in portfolio analysis.
- Which board is associated with each project, if multiple boards exist.
- Which field is used for story points.
- Which statuses indicate blocked work.
- Which issue types should be included or excluded.
- Risk thresholds.
- Whether to use story points or issue count fallback.
- Whether projects without sprint data should still appear in the dashboard.

### 4.4 Data Resilience Requirements

The app must handle missing or inconsistent Jira data gracefully.

Examples:

- No active sprint.
- No completed historical sprints.
- No story point field.
- No assignee.
- No board found for a project.
- Multiple boards found for one project.
- Missing sprint start date.
- Missing sprint end date.
- No issues returned.
- User has limited project access.
- Jira API pagination returns partial results.

The app should never crash because of missing Jira data. It should show a clear fallback state such as:

- `No active sprint`
- `Insufficient velocity history`
- `Story points not configured`
- `Using issue count fallback`
- `Partial data due to permissions`
- `Board configuration required`

### 4.5 Scalability Requirements

The app should be designed for real Marketplace customers, not only small demo data.

It should avoid unnecessary API calls and must support:

- Pagination.
- Batching where possible.
- Caching derived risk results.
- Manual refresh.
- Loading states.
- Rate-limit-aware API usage.
- Graceful degradation when some projects fail to load.

One failed project analysis must not break the entire portfolio dashboard.

### 4.6 Security and Privacy Requirements

The app must follow Marketplace-grade security expectations.

The app should:

- Use least-privilege Forge scopes.
- Avoid storing full issue payloads unless necessary.
- Store derived metrics instead of sensitive issue content where possible.
- Avoid logging personal or sensitive Jira data.
- Never expose tokens, secrets, or internal implementation details in frontend code.
- Keep tenant data isolated.
- Avoid external egress unless explicitly required.
- Be ready for future Marketplace security review.

### 4.7 Marketplace UX Expectations

The app should feel self-service for a new customer.

A first-time user should be able to:

1. Open ProjectLens from Jira Apps.
2. See an onboarding or empty state.
3. Select projects to monitor.
4. Configure story point and blocked-status settings if needed.
5. Run the first portfolio risk analysis.
6. Understand any missing-data or permission issues.
7. View useful risk results without developer support.

The app should include helpful messages for configuration problems instead of assuming the user understands the internal data model.

---

## 5. Target Users

Primary users:

- PMO
- Engineering Manager
- Delivery Manager
- Project Manager
- Scrum Master
- Tech Lead managing multiple Jira projects

Typical user problem:

- They manage many Jira projects at the same time.
- They need to know which projects are at risk this week.
- They do not want to open every board manually.
- They currently export or copy data into Excel.
- Existing Jira portfolio apps are often too heavy, complex, or expensive for small and mid-sized teams.

---

## 6. MVP Scope

The first version should focus on one Jira global page dashboard.

Use Atlassian Forge with Custom UI.

Recommended module:

```yaml
jira:globalPage
```

The app should appear under the Jira Apps navigation as `ProjectLens`.

MVP screens:

1. Portfolio Risk Dashboard
2. Project Risk Detail
3. Settings / Project Selection

---

## 7. Core Risk Signals

Implement the following risk rules first.

### 7.1 Blocked Issues Risk

Detect issues that have been blocked for more than 3 days.

Possible detection methods:

- Issue status category or status name contains `Blocked`.
- Issue has a blocker flag.
- Issue has a custom field configured as blocker indicator.
- Issue has links of type `blocks` or `is blocked by`.

MVP can start with configurable status-name detection and later support more advanced configuration.

Default threshold:

```ts
blockedIssueAgeDays > 3
```

Risk impact:

- High if multiple issues are blocked.
- Higher if blocked issues are in the active sprint.
- Higher if blocked issues are high priority.

### 7.2 Velocity Drop Risk

Detect when recent velocity drops by more than 20% compared with historical average velocity.

Default rule:

```ts
currentSprintCompletedStoryPoints < historicalAverageVelocity * 0.8
```

Use completed story points from previous sprints when available.

Fallback:

- If story points are not available, use issue count as a temporary proxy.
- Mark this clearly as lower confidence.

### 7.3 Sprint Scope Creep Risk

Detect when sprint scope increases by more than 15% after sprint start.

Default rule:

```ts
addedScopeAfterSprintStart / originalSprintScope > 0.15
```

Scope can be measured by:

- Story points if available.
- Issue count as fallback.

### 7.4 Unassigned Issues in Active Sprint

Detect issues in active sprint with no assignee.

Default rule:

```ts
issue.assignee == null && issue.sprint.state == 'active'
```

Risk impact:

- Medium by default.
- Higher if issue has high priority or is near sprint end.

---

## 8. Risk Score Model

Each project should have a risk score from 0 to 100.

Suggested MVP scoring:

```ts
riskScore =
  blockedRisk * 0.35 +
  velocityRisk * 0.25 +
  scopeCreepRisk * 0.25 +
  unassignedRisk * 0.15;
```

Each sub-risk should also be normalized from 0 to 100.

Risk levels:

```txt
0 - 39   = Low
40 - 69  = Medium
70 - 100 = High
```

Dashboard color logic:

- Low: safe
- Medium: warning
- High: critical

Do not hard-code business meaning only in the UI. Keep risk calculation in a separate service/module so it can be tested.

---

## 9. Monte Carlo Sprint Completion Prediction

The app should estimate sprint completion probability using Monte Carlo simulation.

Goal:

Estimate the probability that the active sprint can complete its remaining scope based on historical velocity.

Inputs:

- Historical sprint velocities
- Remaining sprint scope
- Remaining sprint days
- Current sprint progress
- Optional: current scope creep

Simple MVP approach:

1. Collect historical velocities from completed sprints.
2. Randomly sample historical velocity many times.
3. Simulate whether the sampled velocity can cover remaining work.
4. Return completion probability as a percentage.

Example:

```ts
completionProbability = successfulSimulations / totalSimulations;
```

Default simulation count:

```ts
1000
```

Output examples:

- `82% likely to complete`
- `54% at risk`
- `28% unlikely to complete`

Confidence handling:

- If fewer than 3 historical sprints exist, show `Low confidence`.
- If story points are missing, show `Using issue count proxy`.

---

## 10. Main Dashboard Requirements

The global dashboard should show a cross-project heatmap/table.

Columns:

- Project name
- Project key
- Active sprint
- Risk score
- Risk level
- Completion probability
- Blocked issues count
- Velocity trend
- Scope creep percentage
- Unassigned issues count
- Top risk reason
- Last updated time

Expected interactions:

- Filter by project
- Filter by risk level
- Sort by risk score
- Click project row to open risk detail
- Refresh analysis manually
- Show loading, empty, and error states clearly

---

## 11. Project Detail View

For each project, show:

- Overall risk score
- Risk breakdown by category
- List of blocked issues
- Scope creep details
- Velocity comparison
- Unassigned active sprint issues
- Sprint completion probability
- Recommended action summary

Example recommended actions:

- `Resolve or reassign 3 blocked issues older than 3 days.`
- `Review scope change. Sprint scope increased by 22% after start.`
- `Assign owners to 5 issues in the active sprint.`
- `Completion probability is low. Consider reducing sprint scope.`

---

## 12. Settings View

Allow users to configure:

- Included Jira projects
- Board mapping per project
- Risk thresholds
- Story point field
- Blocked status names
- Included issue types
- Excluded issue types
- Whether to use story points or issue count fallback
- Whether to include projects without active sprint data
- Refresh behavior

Default thresholds:

```ts
blockedIssueAgeDays = 3;
velocityDropPercent = 20;
scopeCreepPercent = 15;
monteCarloSimulationCount = 1000;
```

Persist settings using Forge storage.

---

## 13. Technical Stack

Use:

- Atlassian Forge
- Custom UI
- React
- TypeScript
- Forge resolver
- Forge bridge
- Jira REST APIs
- Forge storage

Suggested structure:

```txt
.
├── manifest.yml
├── package.json
├── src
│   ├── index.ts
│   ├── resolvers
│   │   ├── dashboardResolver.ts
│   │   ├── projectResolver.ts
│   │   └── settingsResolver.ts
│   ├── services
│   │   ├── jiraService.ts
│   │   ├── riskScoringService.ts
│   │   ├── monteCarloService.ts
│   │   └── settingsService.ts
│   ├── types
│   │   ├── jira.ts
│   │   ├── risk.ts
│   │   └── settings.ts
│   └── utils
│       ├── date.ts
│       └── math.ts
└── static
    └── projectlens-ui
        ├── src
        │   ├── App.tsx
        │   ├── pages
        │   │   ├── DashboardPage.tsx
        │   │   ├── ProjectDetailPage.tsx
        │   │   └── SettingsPage.tsx
        │   ├── components
        │   │   ├── RiskHeatmap.tsx
        │   │   ├── RiskBadge.tsx
        │   │   ├── ProbabilityBadge.tsx
        │   │   └── EmptyState.tsx
        │   └── api
        │       └── forgeApi.ts
        └── package.json
```

---

## 14. Forge Rules and Constraints

Follow current Forge best practices.

### 14.1 Manifest

All app modules, resources, resolvers, and permissions must be declared in `manifest.yml`.

Use one Jira global page module for the main dashboard.

Do not create multiple `jira:globalPage` modules. If subpages are needed, handle routing inside the Custom UI app.

### 14.2 Permissions

Use least privilege.

Only request Jira scopes that are required by the REST APIs used.

Start with read-only scopes for MVP.

Avoid write scopes unless a feature explicitly needs to update Jira data.

Expected permissions may include reading:

- Projects
- Issues
- Boards
- Sprints
- Agile reports or sprint data where available

Run Forge lint and update scopes properly.

### 14.3 Resolver Layer

Do not call Jira APIs directly from arbitrary frontend code when the logic should be protected or normalized.

Use Forge resolver functions for:

- Fetching Jira project data
- Aggregating risk signals
- Running risk scoring
- Running Monte Carlo calculation
- Reading and writing settings

Frontend should call resolvers using Forge bridge `invoke`.

### 14.4 Custom UI

Use Custom UI because the app needs a richer dashboard, heatmap, charts, and interactive filtering.

Keep the UI lightweight.

Avoid unnecessary heavy chart libraries unless needed.

Prefer simple tables, badges, and minimal charts for MVP.

### 14.5 External Egress

Do not call external services in MVP.

Do not add external egress permissions unless there is a clear requirement.

All data should stay within Atlassian Forge/Jira and Forge storage.

### 14.6 Storage

Use Forge storage for app settings and cached analysis results.

Do not store unnecessary personal data.

Do not store full issue payloads if only derived risk metrics are needed.

Recommended storage:

- Selected project keys
- Project-board mapping
- Risk thresholds
- Story point field ID
- Blocked status names
- Included/excluded issue types
- Last analysis result per project
- Last updated timestamp

### 14.7 Security and Privacy

Do not expose tokens or secrets in frontend code.

Do not log sensitive Jira issue content.

Do not persist full descriptions, comments, attachments, or personal data unless required.

Use derived metrics whenever possible.

### 14.8 Performance

The app may analyze many projects, so avoid excessive Jira API calls.

Use batching where possible.

Use pagination correctly.

Cache results with timestamps.

Provide manual refresh.

Avoid blocking the UI during analysis.

For MVP, it is acceptable to analyze selected projects only instead of every project in the Jira instance.

---

## 15. Data Model

### RiskProjectSummary

```ts
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type DataConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskProjectSummary {
  projectId: string;
  projectKey: string;
  projectName: string;
  activeSprintName?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  completionProbability?: number;
  confidence: DataConfidence;
  blockedIssuesCount: number;
  velocityDropPercent?: number;
  scopeCreepPercent?: number;
  unassignedIssuesCount: number;
  topRiskReason?: string;
  lastUpdatedAt: string;
  warnings?: string[];
}
```

### RiskBreakdown

```ts
export interface RiskBreakdown {
  blockedRisk: number;
  velocityRisk: number;
  scopeCreepRisk: number;
  unassignedRisk: number;
}
```

### AppSettings

```ts
export interface AppSettings {
  selectedProjectKeys: string[];
  projectBoardMapping: Record<string, number | undefined>;
  storyPointFieldId?: string;
  blockedStatusNames: string[];
  includedIssueTypes?: string[];
  excludedIssueTypes?: string[];
  thresholds: {
    blockedIssueAgeDays: number;
    velocityDropPercent: number;
    scopeCreepPercent: number;
    monteCarloSimulationCount: number;
  };
  useIssueCountFallback: boolean;
  includeProjectsWithoutActiveSprint: boolean;
}
```

### ProjectAnalysisResult

```ts
export interface ProjectAnalysisResult {
  project: RiskProjectSummary;
  breakdown: RiskBreakdown;
  errors: string[];
  warnings: string[];
  partial: boolean;
}
```

---

## 16. Coding Guidelines

Use TypeScript strictly.

Prefer small pure functions for risk calculation.

Keep Jira API mapping separate from business logic.

Do not mix UI rendering with risk scoring logic.

Write unit tests for:

- Risk score calculation
- Risk level mapping
- Velocity drop calculation
- Scope creep calculation
- Monte Carlo probability calculation
- Settings default merge logic
- Missing data fallback logic
- Partial permission handling

Use clear function names.

Examples:

```ts
calculateRiskScore();
calculateRiskLevel();
calculateVelocityDropRisk();
calculateScopeCreepRisk();
calculateCompletionProbability();
normalizeRiskValue();
resolveStoryPointField();
resolveProjectBoardMapping();
```

---

## 17. MVP Acceptance Criteria

The MVP is complete when:

1. The Forge app installs successfully in Jira.
2. The app appears as `ProjectLens` in Jira Apps navigation.
3. User can open the global dashboard.
4. User can select Jira projects to monitor.
5. Dashboard shows risk summary for selected projects.
6. App detects:
   - blocked issues older than 3 days
   - velocity drop over 20%
   - sprint scope creep over 15%
   - unassigned issues in active sprint
7. App calculates risk score per project.
8. App shows risk level: Low, Medium, High.
9. App shows completion probability using Monte Carlo simulation.
10. App shows low-confidence state when data is insufficient.
11. Settings are persisted using Forge storage.
12. App uses least-privilege Forge permissions.
13. App does not require an external backend.
14. App works across different Jira projects, boards, workflows, and story point configurations.
15. App handles missing data and permission limitations gracefully.

---

## 18. Out of Scope for MVP

Do not implement these in the first version:

- AI-generated recommendations
- Slack or Teams notifications
- Jira issue updates
- Custom JQL builder
- Advanced Roadmaps integration
- Cross-instance portfolio analytics
- Billing or Marketplace licensing
- External backend
- Long-term warehouse analytics
- Complex dependency graph visualization

---

## 19. Future Enhancements

Possible future features:

- Weekly portfolio risk report
- Risk trend over time
- Jira Automation integration
- Slack notification for high-risk projects
- Custom risk rule builder
- Team capacity input
- Dependency risk detection
- Release-level risk score
- Marketplace licensing
- Export to CSV/PDF
- AI-generated executive summary

---

## 20. Development Task for Codex

Build the initial Forge app skeleton for ProjectLens.

Start with:

1. Create Forge Custom UI app structure.
2. Configure `manifest.yml` with one `jira:globalPage`.
3. Add resolver functions:
   - `getDashboardData`
   - `getProjectRiskDetail`
   - `getSettings`
   - `saveSettings`
4. Add TypeScript models.
5. Add risk scoring service.
6. Add Monte Carlo service.
7. Add React dashboard page with mock data first.
8. Replace mock data with Jira API data incrementally.
9. Add basic settings persistence using Forge storage.
10. Keep all API scopes minimal and read-only.

Important:

- Prioritize a working skeleton over perfect analytics.
- Keep modules small and testable.
- Do not introduce external backend services.
- Do not add external egress permissions.
- Do not request unnecessary Jira write scopes.
- Keep the UI simple and useful for PMO/Engineering Manager users.
- Build the app as Marketplace-ready from day one.
- Do not implement logic that only works for a single Jira instance, single project, single board, or fixed field ID.

Every data access path should consider:

- Does this work across different Jira sites?
- Does this respect the current user’s permissions?
- What happens if the field, board, sprint, or project is missing?
- Can this handle multiple projects without excessive API calls?
- Is this safe for Marketplace distribution?

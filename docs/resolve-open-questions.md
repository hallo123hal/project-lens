## Product Decisions (Resolved)

The following decisions are intentionally fixed for the MVP to eliminate ambiguity and enable autonomous implementation.

### Settings Ownership

ProjectLens settings are site-wide administrative settings.

Only Jira administrators may modify global ProjectLens configuration.

Regular users may view risk dashboards but cannot modify global settings.

### Settings Scope

Two settings scopes exist:

1. Site-wide settings (admin managed)
   - Risk thresholds
   - Story point field mapping
   - Blocked status mapping
   - Default project selection behavior

2. User preferences
   - Dashboard filters
   - Sorting preferences
   - Favorite projects
   - UI preferences

User preferences must never affect calculations for other users.

### Permission Model

ProjectLens must always respect Jira permissions.

Users can only see projects, boards, issues, sprints, and analytics that Jira allows them to access.

If a project is visible but sprint or board information is unavailable, ProjectLens should:

- Show partial analysis.
- Display a warning indicator.
- Continue calculating available metrics.
- Never fail the entire dashboard.

### Privacy Model

The MVP is analytics-first.

Dashboard views should display:

- Aggregated metrics
- Counts
- Risk indicators
- Risk reasons

Project detail views may display issue keys and issue summaries when the user already has Jira permission to view those issues.

ProjectLens must never bypass Jira permissions.

### Supported Project Types

MVP primarily targets Scrum projects.

Kanban projects are supported through graceful degradation:

- Sprint-specific metrics become unavailable.
- Sprint completion probability is hidden.
- Risk scoring uses available project metrics.
- UI clearly indicates which metrics are unavailable.

### Historical Data Window

Default historical lookback:

- Last 6 completed sprints

Fallback:

- Use all available completed sprints if fewer than 6 exist.
- Mark confidence as LOW if fewer than 3 sprints exist.

### Risk Threshold Scope

Risk thresholds are site-wide by default.

Future versions may support project-level overrides.

MVP should not implement per-project threshold customization.

### Performance Targets

Target performance:

- 10 projects: < 3 seconds
- 20 projects: < 5 seconds
- 50 projects: < 10 seconds

Dashboard must remain usable even if some project analyses fail.

Partial results are preferred over complete failure.

### Accessibility and Risk Indicators

Risk levels:

- LOW
- MEDIUM
- HIGH

The UI must not rely on color alone.

Each risk indicator must include:

- Color
- Text label
- Icon or badge

ProjectLens should meet WCAG accessibility expectations where practical.

### Product Positioning

Marketplace positioning:

"Cross-project Portfolio Risk Intelligence for Jira"

Core value proposition:

"Automatically identify delivery risks across Jira projects and help engineering leaders focus on the projects that need attention most."

### Marketplace Principle

Every feature must be evaluated against the following rule:

> ProjectLens is a multi-tenant Marketplace product, not an internal Jira customization.

No implementation may assume:
- specific project keys
- specific board IDs
- specific workflows
- specific custom fields
- specific user roles
- specific sprint configurations

All tenant-specific behavior must be configurable or dynamically discovered.
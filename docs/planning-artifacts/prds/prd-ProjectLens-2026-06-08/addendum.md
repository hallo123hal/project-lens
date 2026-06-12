# ProjectLens PRD Addendum

This addendum preserves implementation guidance from `docs/project-context.md` that is useful for architecture and story creation but should not crowd the product requirements.

## Recommended Technical Direction

- Use Atlassian Forge with Custom UI.
- Use a single `jira:globalPage` module named ProjectLens.
- Route Dashboard, Project Risk Detail, and Settings inside the Custom UI app instead of adding multiple global pages.
- Use React and TypeScript for Custom UI.
- Use Forge resolver functions for protected and normalized Jira data access.
- Use Forge bridge `invoke` from the frontend.
- Use Forge storage for settings and cached derived analysis results.
- Do not add external egress permissions for MVP.

## Suggested Resolver Functions

- `getDashboardData`
- `getProjectRiskDetail`
- `getSettings`
- `saveSettings`

## Suggested Service Boundaries

- `jiraService` for Jira REST API access and pagination.
- `riskScoringService` for pure risk calculations.
- `monteCarloService` for simulation.
- `settingsService` for defaults, persistence, and settings merge behavior.

## Suggested Type Families

- Jira API mapping types.
- Risk domain types.
- Settings types.
- Resolver response types that include warnings, errors, confidence, and partial-analysis flags.

## Testing Priorities

- Risk score calculation.
- Risk level mapping.
- Velocity drop calculation.
- Scope creep calculation.
- Monte Carlo probability calculation.
- Settings default merge logic.
- Missing data fallback logic.
- Partial permission handling.

## External Research Notes

- Atlassian Marketplace search results still show several heavyweight Jira portfolio and PPM apps, including Structure by Tempo, BigPicture by Appfire, Projectrak by Deiser, and other roadmap, capacity, and PPM tools. ProjectLens should stay positioned as a lightweight delivery risk radar rather than a full PPM suite.
- Atlassian Forge and Jira Software scope documentation reinforces that app scopes do not override user permissions. ProjectLens should treat permission-aware fallback states as first-class product behavior.


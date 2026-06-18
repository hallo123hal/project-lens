## Open Questions (Pending Decision)

### OQ-1: Dashboard Gadget Scope

**Question:** Are `jira:dashboardGadget` modules in scope for MVP or deferred to Phase 2?

**Context:** Gadgets allow PMO users to embed Portfolio Risk Summary and Top At-Risk Projects widgets directly on existing Jira dashboards without navigating to the global page. Each gadget requires its own manifest entry and Custom UI resource — additional frontend build complexity. All data would flow through the existing `getDashboardData` resolver with no new API paths.

**Options:**
- Defer to Phase 2 (recommended — keeps MVP scope clean; gadgets are read-only display surfaces that don't block core value)
- Include in MVP — requires manifest and frontend changes before launch

**Decision needed from:** Product Owner

---

### OQ-2: Executive-Only / Summary-Only View

**Question:** Is a summary-only view (no issue-level detail) needed for executives who should not see project issue keys?

**Context:** The current permission model has two roles: Jira Admin (configure) and Regular User (view). PMO governance may require read-only access for executives who should not see issue-level details. FR-21 already enforces that issue keys and summaries are only shown when the user has Jira permission — this OQ is about whether a separate UX mode is needed for users who technically *have* Jira access but should only see risk-level summaries.

**Options:**
- Defer post-MVP — current permission model handles the core case; a summary-only mode can be added in Phase 3
- Add a "summary-only" toggle to user roles in MVP

**Decision needed from:** Product Owner

---

### OQ-3: Sub-risk Normalization Sign-off

**Question:** Are the sub-risk normalization breakpoints in PRD Section 4.3 (FR-11) approved as the canonical specification?

**Context:** The normalization tables define exactly how each raw Jira signal (blocked count, velocity drop %, scope creep %, unassigned count) maps to a 0–100 sub-risk value. Without sign-off, different implementations will produce different scores for the same Jira state, making the score non-auditable. The breakpoints in FR-11 are proposed defaults; they can be made configurable in Phase 2 for per-organization tuning.

**Decision needed from:** Product Owner / Lead Engineer

---

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
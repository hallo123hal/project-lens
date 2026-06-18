---
title: ProjectLens
status: draft
created: 2026-06-08
updated: 2026-06-08
---

# PRD: ProjectLens

## 0. Document Purpose

This PRD defines the MVP requirements for ProjectLens, a Marketplace-ready Jira Cloud app that helps delivery leaders identify cross-project delivery risk without manually checking each Jira board. It is intended for product, UX, architecture, and implementation planning. Requirements are grouped by capability with stable Functional Requirement IDs, explicit assumptions, and open questions for follow-up.

## 1. Vision

ProjectLens is Cross-project Portfolio Risk Intelligence for Jira. It gives PMOs, Engineering Managers, Delivery Managers, Project Managers, Scrum Masters, and Tech Leads a single place to see which Jira projects are currently at risk, why they are at risk, and how likely active sprints are to complete.

The product thesis is that many teams do not need a full portfolio management suite to answer the weekly operational question: "Which projects need attention right now?" Existing Jira portfolio tools commonly emphasize roadmaps, hierarchy, Gantt planning, capacity, and enterprise planning workflows. ProjectLens focuses narrowly on near-term delivery risk detection across selected Jira projects.

ProjectLens must be built as a real Atlassian Marketplace app from the beginning. It must work across varied Jira Cloud sites, permissions, project types, boards, workflows, custom fields, and incomplete data. Marketplace-readiness is a product requirement, not only an engineering preference. Automatically identifying delivery risks across Jira projects and helping engineering leaders focus on the projects that need attention most is the core value proposition.

## 2. Target User

### 2.1 Jobs To Be Done

- When I manage many Jira projects, I need to quickly identify which ones are at delivery risk so I can focus attention where it matters.
- When I prepare portfolio or status updates, I need a consistent risk summary instead of manually opening every board and consolidating notes in spreadsheets.
- When risk appears in Jira data, I need to understand the top reason quickly enough to decide whether to intervene.
- When Jira data is incomplete or inaccessible, I need a clear explanation rather than a broken dashboard or misleading score.
- When I onboard a new Jira site, I need to configure projects, boards, risk thresholds, story point fields, and blocked-status rules without developer support.

### 2.2 Non-Users for MVP

- Enterprise portfolio teams needing full roadmap planning, dependency planning, capacity planning, or financial portfolio management.
- Teams needing Jira issue updates, workflow automation, or write-back actions.
- Organizations needing cross-instance portfolio analytics in MVP.
- Users without Jira project access to the data they expect to view.

### 2.3 Stakeholder Access Matrix

| Role | Dashboard View | Project Detail | Settings | Issue Keys / Summaries |
|---|---|---|---|---|
| Jira Admin | Full | Full (own Jira permission) | Read + Write | Per Jira permission |
| Regular User (e.g., PM, EM) | Full | Full (own Jira permission) | Read-only | Per Jira permission |
| User without project access | Partial (fallback state per project) | Restricted fallback state | Read-only | Never |

PMO and executive users are Regular Users who have full dashboard access. A summary-only view for executives who should not see issue-level detail is deferred to post-MVP. FR-21 enforces that issue keys and summaries are only shown when the current user already has Jira permission to view those issues.

### 2.4 Key User Journeys

- **UJ-1. Maya scans the portfolio before weekly delivery review.**
  - **Persona + context:** Maya is an Engineering Manager responsible for 12 Jira projects.
  - **Entry state:** Maya opens ProjectLens from Jira Apps after authenticating into Jira.
  - **Path:** She views the Portfolio Risk Dashboard, filters to High and Medium risk projects, sorts by Risk Score, and opens the highest-risk project.
  - **Climax:** She sees that the project is high risk because several active-sprint issues have been blocked for more than three days and sprint completion probability is low.
  - **Resolution:** Maya knows which project to discuss first and what action to request from the team.
  - **Edge case:** If some projects cannot be analyzed because of permissions, the dashboard shows partial-access warnings without hiding the rest of the portfolio.

- **UJ-2. Daniel configures ProjectLens for a new Jira site.**
  - **Persona + context:** Daniel is a Jira admin setting up ProjectLens for delivery managers.
  - **Entry state:** Daniel opens ProjectLens for the first time and no projects are configured.
  - **Path:** He selects projects, chooses board mappings when multiple boards exist, confirms the story point field, configures blocked statuses, and saves risk thresholds.
  - **Climax:** ProjectLens runs the first analysis and shows useful results or configuration warnings per project.
  - **Resolution:** The site has a reusable ProjectLens configuration stored for future dashboard use.
  - **Edge case:** If a project has no Scrum board or active sprint, Daniel can decide whether it should still appear with a clear fallback state.

- **UJ-3. Priya investigates why one project is trending poorly.**
  - **Persona + context:** Priya is a Scrum Master reviewing a project flagged by the dashboard.
  - **Entry state:** Priya clicks a project row from the dashboard.
  - **Path:** She reviews risk breakdown, blocked issues count, scope creep, unassigned active-sprint issues, velocity comparison, and completion probability.
  - **Climax:** She sees a recommended action summary tied to the highest risk signals.
  - **Resolution:** Priya leaves with a concrete next action, such as resolving blockers, assigning owners, or reducing sprint scope.

## 3. Glossary

- **ProjectLens** - The Jira Cloud app defined by this PRD.
- **Jira Administrator** - A Jira user with administrative permission to modify site-wide ProjectLens settings.
- **Regular User** - A Jira user who can view allowed ProjectLens dashboards and details but cannot modify site-wide ProjectLens settings.
- **Portfolio Risk Dashboard** - The cross-project view showing selected projects, risk scores, risk levels, completion probability, and top risk reasons.
- **Project Risk Detail** - The project-level view showing risk breakdown and supporting evidence for one project.
- **Settings View** - The configuration surface for selected projects, board mapping, fields, thresholds, issue type filters, and fallback behavior.
- **Site-wide Settings** - Administrative ProjectLens configuration that affects risk calculations for the Jira site.
- **User Preferences** - User-specific dashboard display preferences that never affect calculations for other users.
- **Risk Score** - A normalized 0 to 100 project-level score calculated from risk signals.
- **Risk Level** - The Low, Medium, or High category derived from Risk Score.
- **Risk Signal** - A measurable condition that contributes to Risk Score, such as blocked issues, velocity drop, scope creep, or unassigned sprint work.
- **Completion Probability** - A percentage estimate of active sprint completion likelihood based on historical velocity simulation.
- **Confidence** - A Low, Medium, or High indicator describing whether the available Jira data is sufficient for reliable analysis.
- **Fallback State** - A user-visible state explaining unavailable, missing, or lower-confidence data.
- **Selected Project** - A Jira project configured by a user or admin for inclusion in ProjectLens analysis.
- **Board Mapping** - The configured association between a Selected Project and the Jira board ProjectLens should use for sprint analysis.

## 4. Features

### 4.1 Portfolio Risk Dashboard

**Description:** The Portfolio Risk Dashboard is the primary ProjectLens surface. It shows a cross-project risk table or heatmap for Selected Projects and lets users scan, filter, sort, refresh, and drill into Project Risk Detail. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Display selected project risk summaries

Users can view one summary row per Selected Project with Project name, Project key, active sprint, Risk Score, Risk Level, Completion Probability, Confidence, blocked issue count, velocity trend, scope creep percentage, unassigned issue count, top risk reason, Last Updated time, and warnings.

**Consequences:**
- The dashboard shows a row for every Selected Project that the current user is allowed to access.
- One failed project analysis does not prevent other project rows from rendering.
- If a project cannot be fully analyzed, its row shows a Fallback State instead of disappearing silently.
- A portfolio health summary header above the project table shows total project counts by Risk Level (HIGH / MEDIUM / LOW). This header reuses data already fetched for this FR; no additional API calls are needed. It gives PMO and executive users an at-a-glance RAG rollup and updates on every refresh.

#### FR-2: Filter and sort portfolio risk

Users can filter the Portfolio Risk Dashboard by project and Risk Level, and sort by Risk Score.

**Consequences:**
- Users can isolate High Risk projects in one interaction.
- Sort and filter behavior works with partial and fallback rows.
- Filter, sort, favorite project, and UI display choices are stored as User Preferences where persistence is supported.
- User Preferences must not affect Site-wide Settings or risk calculations for other users.

#### FR-3: Manually refresh analysis

Users can manually refresh portfolio analysis.

**Consequences:**
- The dashboard shows a loading state during refresh.
- A refreshed result updates Last Updated time.
- If refresh partially fails, successful project results remain visible and failed projects show warnings.

#### FR-4: Open Project Risk Detail

Users can open Project Risk Detail from a dashboard row.

**Consequences:**
- The selected project context is preserved when moving from the dashboard to detail.
- Inaccessible projects show an insufficient-permission state instead of exposing hidden data.

### 4.2 Project Risk Detail

**Description:** Project Risk Detail explains the evidence behind one project's Risk Score and gives users a practical action summary. Realizes UJ-3.

**Functional Requirements:**

#### FR-5: Show risk breakdown

Users can view a breakdown of blocked-issue risk, velocity-drop risk, scope-creep risk, and unassigned-work risk for one project.

**Consequences:**
- Each sub-risk is normalized from 0 to 100.
- The overall Risk Score can be traced back to its component Risk Signals.

#### FR-6: Show blocked work evidence

Users can see blocked issue counts and relevant blocked-work evidence for the project.

**Consequences:**
- MVP detects blocked issues using configurable blocked status names.
- Blocked issues older than the configured threshold contribute to Risk Score.
- The view avoids exposing issue details the current user is not permitted to access.
- Project Risk Detail may show issue keys and issue summaries only when the current user already has Jira permission to view those issues.
- Portfolio Risk Dashboard stays analytics-first and shows aggregate metrics, counts, Risk Signals, and risk reasons rather than detailed issue lists.

#### FR-7: Show velocity comparison

Users can compare current sprint completed scope against historical average velocity.

**Consequences:**
- Velocity drop over the configured threshold contributes to Risk Score.
- If story points are unavailable and issue-count fallback is enabled, the UI clearly labels the result as lower confidence.
- If historical sprint data is insufficient, the UI shows an insufficient-history Fallback State.

#### FR-8: Show sprint scope creep

Users can see whether active sprint scope increased after sprint start.

**Consequences:**
- Scope creep over the configured threshold contributes to Risk Score.
- Scope may be measured by story points or issue count fallback.
- Missing sprint start dates result in a clear Fallback State.

#### FR-9: Show unassigned active-sprint work

Users can see the count of active-sprint issues with no assignee.

**Consequences:**
- Unassigned active-sprint issues contribute to Risk Score.
- The risk impact can increase when an issue is high priority or near sprint end. [ASSUMPTION: priority-weighted unassigned risk is included after the basic MVP count is working.]

#### FR-10: Show recommended action summary

Users can see short recommended actions based on the top Risk Signals.

**Consequences:**
- Recommendations are deterministic, rule-based summaries in MVP.
- Recommendations do not use AI-generated text in MVP.
- Each recommendation ties to visible evidence in Project Risk Detail.

### 4.3 Risk Scoring

**Description:** ProjectLens calculates a consistent Risk Score and Risk Level per project from configured Risk Signals.

**Functional Requirements:**

#### FR-11: Calculate normalized sub-risks

ProjectLens calculates blocked-issue risk, velocity-drop risk, scope-creep risk, and unassigned-work risk as values from 0 to 100.

**Consequences:**
- Missing data never produces a runtime failure.
- Missing data produces warnings, confidence reduction, or Fallback States.

**Sub-risk normalization specification** (canonical; must be implemented as-is in `src/services/riskScoringService.ts`):

**Blocked Risk (0–100)**
- Input: count of active-sprint issues with blocked status older than configured threshold (default: 1 day)
- 0 blocked → 0; 1–2 → 20–40 (linear); 3–5 → 40–70 (linear); 6+ → 70–100 (capped)
- Modifier: +15 if any blocked issue is older than 3× the threshold (stale-blocker amplifier)
- Missing data: returns 0 with `NO_ACTIVE_SPRINT` warning

**Velocity Risk (0–100)**
- Input: current sprint completed points vs. rolling average of last N completed sprints
- Current ≥ average → 0; drop 1–20% → 10–30; drop 21–40% → 30–60; drop 41–60% → 60–80; drop >60% → 80–100
- Fallback: use issue count if story points unavailable; mark confidence LOW
- Missing data (< 3 sprints): returns 0 with `INSUFFICIENT_VELOCITY_HISTORY` warning

**Scope Creep Risk (0–100)**
- Input: issue count (or points) added to sprint after sprint start
- 0% creep → 0; 1–10% added → 0–30; 11–25% added → 30–60; >25% added → 60–100
- Missing sprint start date: returns 0 with `MISSING_SPRINT_START_DATE` warning

**Unassigned Risk (0–100)**
- Input: count of active-sprint issues with no assignee
- 0 unassigned → 0; 1–2 → 15–30; 3–5 → 30–60; 6+ → 60–100
- Post-MVP: weight by issue priority (high-priority unassigned = amplifier)

#### FR-12: Calculate overall Risk Score

ProjectLens calculates overall Risk Score using weighted sub-risks.

**Consequences:**
- MVP default weighting is blocked risk 35%, velocity risk 25%, scope creep risk 25%, and unassigned risk 15%.
- Overall Risk Score is clamped between 0 and 100.
- Risk scoring logic is testable independently from UI rendering.

#### FR-13: Map Risk Score to Risk Level

ProjectLens maps Risk Score to Low, Medium, or High.

**Consequences:**
- Scores 0-39 map to Low.
- Scores 40-69 map to Medium.
- Scores 70-100 map to High.
- Thresholds are consistent across dashboard and detail views unless configured otherwise in a future version.

### 4.4 Sprint Completion Prediction

**Description:** ProjectLens estimates active sprint completion likelihood using historical velocity simulation.

**Functional Requirements:**

#### FR-14: Calculate Completion Probability

ProjectLens calculates Completion Probability using Monte Carlo simulation against historical sprint velocities and remaining active-sprint scope.

**Consequences:**
- MVP default simulation count is 1,000.
- MVP uses the last six completed sprints by default.
- If fewer than six completed sprints are available, ProjectLens uses all available completed sprints.
- The output is displayed as a percentage.
- If fewer than three historical completed sprints are available, ProjectLens shows Low Confidence.

#### FR-15: Support issue-count fallback

ProjectLens can use issue count as a fallback when story points are unavailable and fallback is enabled.

**Consequences:**
- The UI explicitly labels fallback results as issue-count proxy results.
- Fallback results reduce Confidence.
- If fallback is disabled, the affected analysis shows a story-points-not-configured Fallback State.

### 4.5 Settings and Onboarding

**Description:** The Settings View lets new customers configure ProjectLens without developer support. Realizes UJ-2.

**Functional Requirements:**

#### FR-16: Configure selected projects

Jira Administrators can select which Jira projects are included in portfolio analysis.

**Consequences:**
- Only projects visible to the Jira Administrator are selectable.
- Empty selection produces an onboarding or empty state.
- Regular Users can view allowed dashboard data but cannot modify Selected Projects.

#### FR-17: Configure board mapping

Jira Administrators can configure which board should be used for each Selected Project when Board Mapping is ambiguous.

**Consequences:**
- If no board is found, ProjectLens shows Board not found or Board configuration required.
- If multiple boards are found, ProjectLens asks for Board Mapping rather than choosing silently.

#### FR-18: Configure story point field

Jira Administrators can configure the story point field ProjectLens should use.

**Consequences:**
- ProjectLens does not assume a fixed custom field ID.
- Missing story point configuration produces a Fallback State or issue-count fallback based on settings.

#### FR-19: Configure blocked statuses

Jira Administrators can configure status names that indicate blocked work.

**Consequences:**
- MVP supports configurable status-name detection.
- ProjectLens does not assume a single workflow or hard-coded blocked status.

#### FR-20: Configure risk thresholds and fallback behavior

Jira Administrators can configure blocked issue age threshold, velocity drop threshold, scope creep threshold, simulation count, issue-count fallback behavior, issue type filters, and whether projects without active sprint data should appear.

**Consequences:**
- Defaults are available before customization.
- Saved settings are reused on future dashboard loads.
- Risk thresholds are Site-wide Settings in MVP.
- MVP does not support per-project threshold overrides.

### 4.6 Marketplace-Ready Data Handling

**Description:** ProjectLens must handle real Jira Cloud variability, permissions, and data quality safely.

**Functional Requirements:**

#### FR-21: Respect Jira permissions

ProjectLens only shows projects, issues, boards, and sprint data the current Jira user is allowed to access.

**Consequences:**
- Insufficient permissions show a clear Fallback State.
- If a project is visible but sprint or board information is unavailable, ProjectLens shows partial analysis, displays a warning indicator, continues calculating available metrics, and does not fail the entire dashboard.
- ProjectLens does not infer or expose restricted project data through aggregate views.

#### FR-22: Handle missing and inconsistent Jira data

ProjectLens handles no active sprint, no completed sprints, no story point field, no assignee, no board, multiple boards, missing sprint dates, no issues, partial API results, and permission-limited data.

**Consequences:**
- No missing-data condition crashes the dashboard or detail view.
- Each unsupported or incomplete condition produces a user-visible warning or Fallback State.
- MVP primarily targets Scrum projects.
- Kanban projects are supported through graceful degradation: sprint-specific metrics are unavailable, Completion Probability is hidden, Risk Score uses available project metrics, and the UI clearly indicates unavailable metrics.

#### FR-23: Analyze multiple projects resiliently

ProjectLens analyzes multiple Selected Projects without allowing one failed project to break the whole portfolio.

**Consequences:**
- Errors are scoped to the affected project where possible.
- Dashboard-level errors are reserved for failures that prevent the whole app from loading.

## 5. Cross-Cutting Non-Functional Requirements

- **NFR-1: Marketplace readiness.** Every tenant-specific assumption must be discovered dynamically or configurable by the user.
- **NFR-2: Least privilege.** ProjectLens must request only the Jira and Forge scopes required for MVP read-only analysis and settings storage.
- **NFR-3: Privacy.** ProjectLens must avoid storing full issue payloads unless required. Derived metrics and settings are preferred.
- **NFR-4: Data isolation.** Tenant data must remain isolated within Forge/Jira storage boundaries.
- **NFR-5: No external egress for MVP.** MVP must not call external services.
- **NFR-6: Resilience.** Missing, partial, or inaccessible data must produce Fallback States rather than crashes.
- **NFR-7: Performance.** ProjectLens must support pagination, avoid unnecessary Jira API calls, cache derived results where appropriate, and provide manual refresh.
- **NFR-8: Testability.** Risk scoring, threshold logic, fallback logic, settings merge behavior, and simulation logic must be unit-testable.
- **NFR-9: Accessibility.** Risk status must not rely on color alone; each Risk Level indicator must include color, text label, and an icon or badge. ProjectLens should meet WCAG accessibility expectations where practical.
- **NFR-10: Performance targets.** Portfolio Risk Dashboard target load time is under 3 seconds for 10 Selected Projects, under 5 seconds for 20 Selected Projects, and under 10 seconds for 50 Selected Projects. Partial results are preferred over complete failure.

## 6. Constraints and Guardrails

### 6.1 Product Guardrails

- ProjectLens must stay focused on operational delivery risk, not broad portfolio planning.
- MVP must use one Jira app entry point and route subviews internally.
- The app must be useful with partial data and explicit about confidence.
- Every feature must be evaluated against this rule: ProjectLens is a multi-tenant Marketplace product, not an internal Jira customization.
- No implementation may assume specific project keys, board IDs, workflows, custom fields, user roles, or sprint configurations.

### 6.2 Security and Privacy Guardrails

- Do not expose tokens, secrets, or internal implementation details in frontend code.
- Do not log personal or sensitive Jira issue content.
- Do not store issue descriptions, comments, attachments, or unnecessary personal data in MVP.
- Do not bypass Jira permissions when showing issue keys, issue summaries, analytics, boards, sprints, or project data.

### 6.3 Competitive Positioning Guardrails

- ProjectLens should not compete head-on with heavyweight PPM suites on Gantt planning, resource planning, enterprise roadmap hierarchy, or financial portfolio management.
- ProjectLens should differentiate through fast setup, narrow risk radar focus, clear fallback states, and Marketplace-safe Jira variability handling.
- Marketplace positioning phrase: "Cross-project Portfolio Risk Intelligence for Jira."

## 7. MVP Scope

### 7.1 In Scope

- Jira global app surface named ProjectLens.
- Portfolio Risk Dashboard.
- Project Risk Detail.
- Settings View for project selection and core configuration.
- Site-wide administrative settings and non-calculation User Preferences.
- Risk Signals for blocked issues, velocity drop, sprint scope creep, and unassigned active-sprint issues.
- Risk Score and Risk Level calculation.
- Monte Carlo Completion Probability.
- Basic deterministic recommended action summary.
- Forge storage for settings and cached derived analysis results.
- Permission-aware and missing-data-aware fallback states.
- Graceful degradation for Kanban projects.

### 7.2 Out of Scope for MVP

- AI-generated recommendations.
- Slack or Teams notifications.
- Jira issue updates or workflow actions.
- Custom JQL builder.
- Advanced Roadmaps integration.
- Cross-instance portfolio analytics.
- Billing or Marketplace licensing.
- External backend.
- Long-term warehouse analytics.
- Complex dependency graph visualization.
- CSV or PDF export.

## 8. Success Metrics

**Primary**

- **SM-1: First useful dashboard.** A new configured Jira site can show at least one analyzed Selected Project or a clear project-level Fallback State after setup. Validates FR-1, FR-16, FR-17, FR-18, FR-19, FR-20.
- **SM-2: Risk detection coverage.** For projects with sufficient data, ProjectLens detects all four MVP Risk Signals and calculates Risk Score, Risk Level, and Completion Probability. Validates FR-5 through FR-15.
- **SM-3: Resilient portfolio analysis.** If one Selected Project fails analysis, other Selected Projects still render. Validates FR-1, FR-21, FR-22, FR-23.

**Secondary**

- **SM-4: Configuration clarity.** Jira Administrators can identify and resolve missing Board Mapping, story point field, blocked status, and fallback settings from the Settings View. Validates FR-16 through FR-20.
- **SM-5: Confidence clarity.** Low-confidence and fallback results are visibly labeled wherever they appear. Validates FR-7, FR-14, FR-15, FR-22.
- **SM-6: Performance envelope.** Portfolio Risk Dashboard meets target load times for 10, 20, and 50 Selected Projects while preserving partial results when individual analyses fail. Validates FR-1, FR-3, FR-23, NFR-10.

**Counter-metrics**

- **SM-C1: False precision.** ProjectLens should not optimize for showing a numeric score when data quality is insufficient; explicit low-confidence states are better than misleading precision.
- **SM-C2: Scope expansion.** ProjectLens should not optimize for feature breadth at the cost of fast setup and reliable cross-site behavior.

## 9. Risks and Mitigations

- **Risk: Jira data variability makes risk scoring inconsistent.** Mitigation: require configurable fields, thresholds, board mappings, issue filters, and explicit Confidence labels.
- **Risk: Permission limitations create misleading aggregate results.** Mitigation: show partial-access states and avoid exposing restricted aggregates.
- **Risk: Heavy Jira API usage slows the app or hits limits.** Mitigation: analyze Selected Projects only, use pagination, cache derived results, and support manual refresh.
- **Risk: Risk Score appears more authoritative than the evidence supports.** Mitigation: show Risk Signal breakdown, Confidence, warnings, and top risk reasons.
- **Risk: MVP drifts into heavyweight portfolio management.** Mitigation: preserve the v1 non-goals and defer roadmap, resource, financial, and dependency planning.

## 10. Resolved MVP Decisions

1. ProjectLens settings are site-wide administrative settings. Only Jira Administrators may modify global ProjectLens configuration.
2. Regular Users may view allowed risk dashboards and Project Risk Detail but cannot modify Site-wide Settings.
3. ProjectLens supports two settings scopes: Site-wide Settings for calculation-affecting configuration and User Preferences for dashboard display preferences.
4. User Preferences must never affect calculations for other users.
5. If a project is visible but sprint or board information is unavailable, ProjectLens shows partial analysis, displays a warning, calculates available metrics, and never fails the entire dashboard.
6. Portfolio Risk Dashboard is analytics-first and shows aggregated metrics, counts, Risk Signals, and risk reasons.
7. Project Risk Detail may show issue keys and summaries when the user already has Jira permission to view those issues.
8. MVP primarily targets Scrum projects.
9. Kanban projects are supported through graceful degradation: sprint-specific metrics unavailable, Completion Probability hidden, Risk Score based on available project metrics, and unavailable metrics clearly indicated.
10. Default historical lookback is the last six completed sprints. If fewer than six exist, use all available completed sprints. If fewer than three exist, mark Confidence as Low.
11. Risk thresholds are site-wide by default. MVP does not implement per-project threshold customization.
12. Performance targets are under 3 seconds for 10 Selected Projects, under 5 seconds for 20 Selected Projects, and under 10 seconds for 50 Selected Projects.
13. Risk indicators must include color, text label, and icon or badge, and must not rely on color alone.
14. Marketplace positioning is "Cross-project Portfolio Risk Intelligence for Jira."

## 11. Assumptions Index

- Section 4.2, FR-9: [ASSUMPTION: priority-weighted unassigned risk is included after the basic MVP count is working.]

# Feedback Follow-up: ProjectLens Solution Review

**Date:** 2026-06-17  
**Based on:** `docs/feedback.md` review of the solution outline and PRD

---

## 1. Gadgets Beyond the Global Page

**Feedback:** Consider using gadgets beside the global page so users can surface application-specific charts and metrics directly on a consolidated project dashboard.

**Current state:** The solution mandates a single `jira:globalPage` module. All views (Dashboard, Project Risk Detail, Settings) route internally within that one React app.

**Gap:** High-risk users (PMOs managing executive dashboards in native Jira) cannot embed ProjectLens metrics into their existing Jira dashboards. They must navigate to the global page separately.

**Suggested changes:**

- **Phase 2:** Add `jira:dashboardGadget` modules to `manifest.yml` for embeddable, read-only widgets. Initial gadgets candidates:
  - **Portfolio Risk Summary gadget** — shows count of HIGH / MEDIUM / LOW risk projects across configured portfolio
  - **Top At-Risk Projects gadget** — shows top 3–5 projects by Risk Score with drill-down link to global page

- **Design constraint:** Gadgets must be read-only display surfaces. All data fetching still flows through the same resolver layer (`getDashboardData`). No new API paths needed.

- **Scope decision needed:** Confirm whether gadgets are in scope for MVP or deferred. If deferred, update the Phase 2 roadmap in `docs/solution-outline.md` to explicitly list gadgets as a Phase 2 deliverable.

- **Manifest implication:** Each gadget module requires its own entry in `manifest.yml`. A gadget is a separate Custom UI resource from the global page — budget additional frontend build complexity.

---

## 2. Value Proposition vs. Native Jira Dashboards

**Feedback:** Clarify what limitations of native Jira dashboards are being addressed and which capabilities require custom gadget development.

**Current state:** The PRD states the problem (manually opening boards, inconsistent reporting) but does not explicitly document what native Jira dashboards cannot do.

**Suggested changes — add this framing to the PRD or product brief:**

| Capability | Native Jira Dashboard | ProjectLens |
|---|---|---|
| Cross-project risk aggregate | Manual, per-gadget setup | Automatic, configured once |
| Risk Score calculation | Not available | Weighted formula across 4 signals |
| Velocity drop detection | Manual chart inspection | Automated sub-risk signal |
| Scope creep detection | Not available natively | Calculated from sprint start vs current |
| Monte Carlo completion probability | Not available | 1,000-iteration simulation |
| Blocked work risk signal | Not available | Configurable age threshold detection |
| Fallback states for missing data | No — broken gadgets | First-class, labeled states |
| Multi-site, marketplace-safe | Not applicable | Built-in from day one |

**Custom gadget development required for:** Risk Score formula, Monte Carlo simulation, cross-project risk aggregation, velocity sub-risk normalization, scope creep detection. These cannot be replicated with native Jira gadget primitives.

**Suggested action:** Add a "Differentiation" subsection to `docs/brief-description.md` or the PRD Section 1 (Vision) that explicitly names these gaps. This helps product marketing and reduces reviewer confusion about whether ProjectLens is "just a dashboard wrapper."

---

## 3. PMO Perspective — Governance, Portfolio Visibility, Executive Reporting

**Feedback:** Revisit the solution from a PMO perspective. Align features with PMO pain points and reporting needs. Consider governance, portfolio visibility, and executive reporting requirements. Validate permission and access restrictions for different stakeholder groups.

**Current state:** The primary persona in UJ-1 is Maya (Engineering Manager), not a PMO or executive. The PRD lists PMO as a target user but does not define distinct PMO-specific features or permission roles beyond "Regular User can view."

**Gaps identified:**

1. **No executive-friendly summary view.** The dashboard is a table/heatmap of projects with scores. A PMO or executive typically wants a one-screen RAG status rollup, not raw scores. Consider: a portfolio health header (e.g., "3 HIGH, 5 MEDIUM, 4 LOW" with trend arrow) as the first element on the Dashboard page.

2. **No time-trend visibility.** PMO governance requires knowing whether risk is improving or worsening over time. Current design shows only point-in-time Risk Score. Adding a `trendDirection` field (`IMPROVING` / `STABLE` / `WORSENING`) derived from cached previous analysis would address this without major scope increase.

3. **Permission model gap for exec-only view.** The current model has two roles: Jira Admin (can configure) and Regular User (can view). PMO governance often requires:
   - Read-only access for executives who should NOT see issue-level detail
   - No issue keys or summaries on Project Risk Detail for users without Jira project access (FR-21 handles this, but needs explicit UX callout)
   - Consider whether a "summary-only" mode or a separate exec report view is needed post-MVP

4. **No export or shareable artifact.** PMO status reporting requires delivering a snapshot outside Jira (email, slide, Confluence). CSV/PDF export is explicitly out of scope for MVP — this is acceptable, but should be positioned clearly as a Phase 3 addition with a Confluence page publish option.

**Suggested changes:**

- **MVP (no scope expansion):** Add a portfolio health summary header to `DashboardPage` showing total project counts by Risk Level. This reuses existing data, zero new API calls.
- **Post-MVP:** Add `trendDirection` field to `RiskProjectSummary` type; compute from comparing current score against `analysis:project:{key}` cached previous result.
- **Post-MVP:** Add Confluence page publish option (requires `write:confluence-content` scope — separate from MVP read-only scopes, must be additive).
- **Documentation:** Add a "Stakeholder Access Matrix" table to the PRD or a separate section in `resolve-open-questions.md`:

| Role | Dashboard View | Project Detail | Settings | Issue Keys/Summaries |
|---|---|---|---|---|
| Jira Admin | Full | Full (own permission) | Read + Write | Per Jira permission |
| Regular User (e.g., PM) | Full | Full (own permission) | Read-only | Per Jira permission |
| User without project access | Partial (fallback state) | Restricted state | Read-only | Never |

---

## 4. Risk Score Calculation Methodology

**Feedback:** Define the Risk Score calculation methodology — input metrics and weighting logic, thresholds for Low / Medium / High risk, flexibility for future customization.

**Current state:** The solution defines the weighted formula and level thresholds. What is NOT defined is **how each sub-risk is normalized to 0–100**. This is the most critical missing piece.

**Gap:** Without sub-risk normalization rules, the same Jira state produces different scores depending on implementation assumptions. This makes the score unpredictable and non-auditable.

**Suggested sub-risk normalization spec (to be added to `riskScoringService.ts` docs and PRD Section 4.3):**

### Blocked Risk (0–100)
- Input: count of active-sprint issues with blocked status older than configured threshold (default: 1 day)
- Normalization:
  - 0 blocked → 0
  - 1–2 blocked → 20–40 (linear)
  - 3–5 blocked → 40–70 (linear)
  - 6+ blocked → 70–100 (capped at 100)
- Modifier: +15 if any blocked issue is older than 3× the threshold (stale blocker amplifier)
- Missing data: returns 0 with `NO_ACTIVE_SPRINT` warning

### Velocity Risk (0–100)
- Input: current sprint completed points vs. rolling average of last N completed sprints
- Normalization:
  - Current ≥ average → 0
  - Drop 1–20% → 10–30
  - Drop 21–40% → 30–60
  - Drop 41–60% → 60–80
  - Drop >60% → 80–100
- Fallback: use issue count if story points unavailable; mark confidence LOW
- Missing data (< 3 sprints): returns 0 with `INSUFFICIENT_VELOCITY_HISTORY` warning

### Scope Creep Risk (0–100)
- Input: issue count (or points) added to sprint after sprint start
- Normalization:
  - 0% creep → 0
  - 1–10% added → 0–30
  - 11–25% added → 30–60
  - >25% added → 60–100
- Missing sprint start date: returns 0 with `MISSING_SPRINT_START_DATE` warning

### Unassigned Risk (0–100)
- Input: count of active-sprint issues with no assignee
- Normalization:
  - 0 unassigned → 0
  - 1–2 unassigned → 15–30
  - 3–5 unassigned → 30–60
  - 6+ unassigned → 60–100
- Post-MVP: weight by issue priority (high-priority unassigned = amplifier)

### Overall Formula (already defined, included for completeness)
```
riskScore = blocked×0.35 + velocity×0.25 + scopeCreep×0.25 + unassigned×0.15
```
Levels: 0–39 = LOW | 40–69 = MEDIUM | 70–100 = HIGH

**Suggested actions:**
- Add the above normalization tables to `src/services/riskScoringService.ts` as the authoritative spec comment block (single source of truth alongside the code)
- Make normalization breakpoints configurable in Phase 2 (advanced threshold settings) to allow per-organization tuning
- Add a "How Risk Score is Calculated" section to the Settings View help text so admins can explain the score to their teams

---

## 5. Configuration and Administration Details

**Feedback:** Provide details on dashboard setup and gadget configuration, management of metrics/thresholds/reporting rules, and operational effort for maintenance.

**Current state:** The PRD defines what is configurable (FR-16–FR-20) but not the admin experience, maintenance workflow, or operational burden.

**Gaps and suggested additions:**

### 5.1 Admin Onboarding Flow (Settings UX spec needed)

The Settings View needs a clear linear flow for first-time setup. Suggested wizard steps:

1. **Select Projects** — multi-select from projects visible to the admin. Show project key + name.
2. **Board Mapping** — for each selected project, auto-detect board. If none found → "Board not found" warning with manual input. If multiple found → dropdown to pick one.
3. **Story Point Field** — auto-detect common field names (`story_points`, `story-points`, `customfield_10016`). Show detected field with override option.
4. **Blocked Statuses** — show all statuses across configured projects; admin checks which count as blocked. Default suggestion: any status named "Blocked", "Impediment", "On Hold".
5. **Thresholds** — show defaults with explanation. Allow override. Reset-to-defaults button.
6. **Review & Save** — summary of configuration. Trigger first analysis on save.

### 5.2 Maintenance Effort Estimate

| Task | Frequency | Effort |
|---|---|---|
| Add/remove a project | Ad hoc | 1 min — Settings > Select Projects |
| Update board mapping after board rename | When board renamed in Jira | 2 min — Settings > Board Mapping |
| Update story point field after Jira field change | Rare | 2 min — Settings > Story Point Field |
| Update blocked status names after workflow change | When workflow changes | 3 min — Settings > Blocked Statuses |
| Adjust risk thresholds | Quarterly or on stakeholder request | 5 min — Settings > Thresholds |
| No automated maintenance needed | — | Forge storage persists settings indefinitely |

**Key message for reviewers:** Zero-infrastructure maintenance. No servers, no scheduled jobs, no database migrations. Only admin interaction required is when Jira config changes (board, field, workflow). This is a significant operational advantage vs. self-hosted portfolio tools.

### 5.3 Threshold Management

Thresholds are stored in `settings:site` Forge storage (admin-only write). Document these explicitly:

| Threshold | Default | Configurable range | Effect |
|---|---|---|---|
| Blocked issue age | 1 day | 0–14 days | Minimum age before issue counts as "blocked risk" |
| Velocity drop | 20% | 0–80% | Drop below this triggers velocity risk |
| Scope creep | 10% | 0–50% | Issues added above this % trigger scope creep risk |
| Low/Medium threshold | 40 | 1–99 | Risk Score above this = MEDIUM |
| Medium/High threshold | 70 | 1–99 | Risk Score above this = HIGH |
| Monte Carlo iterations | 1,000 | 100–5,000 | Higher = more accurate but slower |
| Historical sprint lookback | 6 | 1–20 | Sprints used for velocity baseline |

---

## Summary: Suggested Document Updates

| Document | Action |
|---|---|
| `docs/solution-outline.md` | Add gadgets to Phase 2 roadmap; add differentiation table vs. native Jira |
| `docs/planning-artifacts/prds/prd-ProjectLens-2026-06-08/prd.md` | Add stakeholder access matrix (Section 2); add normalization spec to Section 4.3; add FR for portfolio health summary header |
| `docs/resolve-open-questions.md` | Add: gadget scope decision; exec-only view decision; sub-risk normalization sign-off |
| `src/services/riskScoringService.ts` (future) | Implement normalization tables above as the canonical spec |
| Settings View UX spec (new file) | Create `docs/planning-artifacts/ux-settings-onboarding.md` with the 6-step wizard flow |

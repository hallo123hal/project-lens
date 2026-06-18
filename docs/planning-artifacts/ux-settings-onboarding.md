---
title: Settings Onboarding UX Spec
status: draft
created: 2026-06-18
---

# Settings Onboarding UX Spec

This document defines the first-time setup wizard flow for the Settings View and the ongoing maintenance model for ProjectLens administrators. It realizes FR-16 through FR-20 and UJ-2.

## First-Time Setup Wizard

When a Jira Admin opens ProjectLens with no configured projects, the Settings View renders a linear wizard rather than an empty configuration form. The wizard guides the admin through all required decisions before triggering the first analysis.

### Step 1 — Select Projects

- Show a multi-select list of all Jira projects visible to the admin.
- Display project key and project name for each item.
- Selection is required; an empty selection produces an empty-state warning and blocks progression.

### Step 2 — Board Mapping

- For each selected project, auto-detect the associated Scrum board.
- **One board found:** pre-select it; show the board name for confirmation.
- **No board found:** show a "Board not found" inline warning with a manual input field for the board ID.
- **Multiple boards found:** show a dropdown to select one; do not choose silently.

### Step 3 — Story Point Field

- Auto-detect common story point field names: `story_points`, `story-points`, `customfield_10016`.
- Display the detected field name with an override option.
- If no field is detected, show a "Story points field not found" warning and offer issue-count fallback as default.

### Step 4 — Blocked Statuses

- Show all statuses across configured projects.
- Admin checks which statuses count as blocked.
- Default suggestions: any status named `Blocked`, `Impediment`, or `On Hold`.
- At least one selection is recommended; a warning is shown if none are selected.

### Step 5 — Thresholds

Display defaults with short explanations. All fields have a reset-to-defaults button.

| Threshold | Default | Configurable Range | Explanation |
|---|---|---|---|
| Blocked issue age | 1 day | 0–14 days | Minimum age before issue counts as blocked risk |
| Velocity drop | 20% | 0–80% | Drop below this triggers velocity risk |
| Scope creep | 10% | 0–50% | Issues added above this % trigger scope creep risk |
| Low/Medium threshold | 40 | 1–99 | Risk Score at or above this = MEDIUM |
| Medium/High threshold | 70 | 1–99 | Risk Score at or above this = HIGH |
| Monte Carlo iterations | 1,000 | 100–5,000 | Higher = more accurate but slower |
| Historical sprint lookback | 6 | 1–20 | Sprints used for velocity baseline |

### Step 6 — Review & Save

- Show a summary of all wizard selections.
- Confirm button triggers the first portfolio analysis immediately.
- Success → redirect to Dashboard with analysis results or per-project fallback states.
- Error → remain on Settings with inline error messages; partial success is acceptable.

---

## Maintenance Effort

Zero-infrastructure maintenance. No servers, no scheduled jobs, no database migrations. Admin interaction is only needed when Jira configuration changes.

| Task | Trigger | Estimated Effort |
|---|---|---|
| Add or remove a project | Ad hoc | 1 min — Settings > Select Projects |
| Update board mapping after board rename | When board renamed in Jira | 2 min — Settings > Board Mapping |
| Update story point field after Jira field change | Rare | 2 min — Settings > Story Point Field |
| Update blocked status names after workflow change | When workflow changes | 3 min — Settings > Blocked Statuses |
| Adjust risk thresholds | Quarterly or on stakeholder request | 5 min — Settings > Thresholds |

Forge storage persists settings indefinitely with no expiry. Settings survive app upgrades as long as the storage schema remains backward-compatible (additive changes only).

---

## Settings Help Text

The Settings View must include a "How Risk Score is Calculated" section so admins can explain the score to their teams. Minimum content:

- The four risk signals and what each detects
- The weighting formula: `blocked×0.35 + velocity×0.25 + scopeCreep×0.25 + unassigned×0.15`
- The Risk Level thresholds: 0–39 LOW, 40–69 MEDIUM, 70–100 HIGH
- A note that sub-risk breakpoints are configurable in Phase 2

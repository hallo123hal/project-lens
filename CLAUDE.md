# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProjectLens is a lightweight Atlassian Forge app for Jira that gives PMOs and Engineering Managers a single cross-project portfolio risk dashboard. It detects delivery risks (blocked issues, velocity drops, scope creep, unassigned sprint work), calculates a per-project risk score, and predicts sprint completion probability via Monte Carlo simulation — all without an external backend.

This must be built as a **Marketplace-ready** app from day one, not an internal single-tenant script. Every project, board, field, workflow, and permission assumption must be discovered dynamically or configurable by the user.

## Tech Stack

- **Platform**: Atlassian Forge (Custom UI)
- **Backend**: Forge resolvers + Forge storage (TypeScript)
- **Frontend**: React + TypeScript
- **Data source**: Jira REST APIs (via Forge resolver layer only)
- No external backend. No external egress.

## Development Commands

```bash
# Install Forge CLI globally (once)
npm install -g @forge/cli

# Install backend dependencies
npm install

# Install frontend dependencies
cd static/projectlens-ui && npm install

# Build frontend
cd static/projectlens-ui && npm run build

# Deploy to Forge (dev environment)
forge deploy

# Install into a Jira site
forge install

# Live tunnel for local development (hot reload)
forge tunnel

# Check manifest scopes
forge lint

# Run backend tests
npm test

# Run frontend tests
cd static/projectlens-ui && npm test
```

## Architecture

### Resolver layer is the only API boundary

All Jira API calls live in `src/services/jiraService.ts`. Resolvers in `src/resolvers/` orchestrate services and expose named functions. The frontend calls resolvers exclusively via Forge bridge `invoke()` — never touches Jira APIs directly.

```
Frontend (React)
  └─► forgeApi.ts (invoke)
        └─► Forge resolver functions
              ├─► jiraService.ts     (all Jira REST calls)
              ├─► riskScoringService.ts
              ├─► monteCarloService.ts
              └─► settingsService.ts (Forge storage)
```

### Risk scoring

Risk sub-scores are normalized 0–100, then weighted:

```
riskScore = blockedRisk×0.35 + velocityRisk×0.25 + scopeCreepRisk×0.25 + unassignedRisk×0.15
```

Levels: 0–39 = LOW, 40–69 = MEDIUM, 70–100 = HIGH.

Keep all scoring logic in pure functions inside `src/services/riskScoringService.ts` so it can be unit-tested independently of Jira data.

### Monte Carlo simulation

Default 1 000 iterations. Requires ≥3 completed sprints for HIGH confidence. Falls back to issue count when story points are unavailable; mark results as lower confidence.

### Core types (in `src/types/`)

- `RiskProjectSummary` — per-project dashboard row
- `RiskBreakdown` — component scores (blocked / velocity / scopeCreep / unassigned)
- `ProjectAnalysisResult` — full detail + errors/warnings + `partial` flag
- `AppSettings` — persisted config (selected projects, thresholds, field IDs, board mapping)

## Forge Rules

- **One `jira:globalPage` module** — route sub-pages inside the React app.
- **Least-privilege read-only scopes** — no write scopes in MVP. Run `forge lint` after every scope change.
- **No external egress** — do not add `external.fetch` permissions.
- **Forge storage only** — persist settings and cached risk results; never store full issue payloads, only derived metrics.
- **Always paginate** Jira API calls; never assume all results fit in one response.

## Marketplace-Readiness Rules

Before any data access path, answer:
1. Does this work across different Jira Cloud sites with different project/board/field configurations?
2. Does it respect the calling user's Jira permissions?
3. What graceful fallback state is shown if the field, board, sprint, or project is missing?

Never hard-code project keys, board IDs, sprint names, custom field IDs, status names, or user roles.

Expected graceful states to display (never crash on missing data):
- `No active sprint` / `Insufficient velocity history` / `Story points not configured`
- `Using issue count fallback` / `Partial data due to permissions` / `Board configuration required`

## What to Unit Test

Pure functions only — no Jira mocks needed:
- `calculateRiskScore`, `calculateRiskLevel`
- `calculateVelocityDropRisk`, `calculateScopeCreepRisk`
- `calculateCompletionProbability` (Monte Carlo)
- Settings default-merge logic
- Missing-data and partial-permission fallback logic

## MVP Scope

In scope: portfolio dashboard, project risk detail view, settings page, four risk signals, Monte Carlo prediction, Forge storage persistence.

Out of scope for MVP: AI recommendations, Slack/Teams notifications, Jira issue writes, external backend, billing/licensing, custom JQL builder, Advanced Roadmaps integration.

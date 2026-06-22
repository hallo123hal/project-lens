# ProjectLens UI Enhancement Design

**Date:** 2026-06-22  
**Scope:** All three pages — Dashboard, Project Detail, Settings  
**Goal:** Make risk data scannable and visual; replace all inline styles with Tailwind CSS v4

---

## 1. Tech Setup

### Tailwind CSS v4
- Install `tailwindcss` and `@tailwindcss/vite` as devDependencies in `static/projectlens-ui/`
- Add the Tailwind plugin to `vite.config.ts` — no `tailwind.config.js` or PostCSS config needed
- Replace the `@import "tailwindcss"` directive in `index.css`
- Delete `App.css` (unused Vite boilerplate)

### Risk-level CSS variables
Defined once in `index.css`:
```css
:root {
  --risk-high-bg: #FFEBE6;   --risk-high-text: #AE2A19;
  --risk-med-bg:  #FFF7D6;   --risk-med-text:  #7F5F01;
  --risk-low-bg:  #DFFCF0;   --risk-low-text:  #1F845A;
}
```

### Score-to-color helper
`src/utils/scoreColor.ts` exports `scoreColor(n: number): 'low' | 'medium' | 'high'` — thresholds 0–39 → `'low'`, 40–69 → `'medium'`, 70–100 → `'high'`. Imported by `ScoreBadge` and the breakdown cards in `ProjectDetailPage`.

---

## 2. Shared Components (updated or new)

### `RiskBadge` (updated)
- Slightly larger pill, bolder font weight
- No change to logic — already correct

### `ScoreBadge` (new)
- Props: `score: number`
- Thresholds: 0–39 → green, 40–69 → yellow, 70–100 → red
- Renders the number inside a colored pill using CSS variable classes
- Used in dashboard sub-score columns and detail breakdown cards

### `ProbabilityBadge` (updated)
- Shows probability as `73%` in a styled chip
- Confidence (`HIGH` / `MED` / `LOW`) as smaller text below, not inline

### `VelocityChart` (new)
- Props: `history: number[]`
- Pure SVG, ~120px tall, one bar per sprint
- Bar color: amber if below average, teal if at/above average
- No axes; thin baseline rule only
- Stat row below: `Avg · Min · Max · Trend ▲/▼/→`
- Trend rule: last sprint vs average — `▲` if last > avg × 1.1, `▼` if last < avg × 0.9, `→` otherwise

### `WarningList` (updated)
- Amber background, `⚠` icon prefix, rounded corners
- Consistent with Tailwind utility classes

---

## 3. Dashboard Page

### Header bar
- Bottom border separator between header and content
- Settings becomes an outlined button with hover state (`border border-gray-300 hover:bg-gray-50`)

### Table
- `border-l-4` accent on each row: `border-red-400` (HIGH), `border-yellow-400` (MEDIUM), `border-green-400` (LOW)
- Row hover: `hover:bg-gray-50`
- Column headers: uppercase, tracking-wide, lighter text color, `cursor-pointer` with hover underline for sortable columns
- Active sort column shows directional arrow (↑ or ↓)

### Columns
| Column | Treatment |
|---|---|
| Project | Blue link button, `(partial)` in muted small text |
| Risk Score | `RiskBadge` — slightly larger |
| Blocked / Velocity Drop / Scope Creep / Unassigned | `ScoreBadge` |
| Sprint Completion | Probability % chip + confidence label below |
| Sprint | Muted gray text, `—` when absent |

---

## 4. Project Detail Page

### Header card
- White card with colored top border (4px, matches risk level)
- Project name (large, bold) + `RiskBadge` inline
- Sprint name as a small gray chip beside title

### Back link
- `← Back to Dashboard` as a styled text link (no browser button appearance)
- Hover: underline

### Risk Breakdown — 2×2 card grid
Each of the 4 signals gets its own card:
- Signal name: small uppercase label
- Score: large colored number (`ScoreBadge` sizing)
- Progress bar: thin `h-1.5` bar, width = `score%`, color matches threshold
- Cards use `rounded-lg shadow-sm border border-gray-100`

### Sprint Completion Prediction
- Large probability number + confidence badge
- Sprint name and sprint date range below in muted text

### Velocity History
- `VelocityChart` component (SVG bars + stat row)
- Shown only when `velocityHistory.length > 0`; otherwise shows an info message

### Blocked Issues
- Card list, each row:
  - Monospace key tag (`PROJ-123`) in gray pill on the left
  - Summary text in the middle
  - `Xd blocked` pill on the right in red
- Zero-state: hidden (section only rendered when `blockedIssues.length > 0`)

### Recommendations
- Light blue-gray panel (`bg-blue-50 rounded-lg p-4`)
- Each item: `→` prefix, slightly bolder text
- Zero-state: hidden

---

## 5. Settings Page

### Layout
- Max-width `700px`, same as current
- Three labeled sections, each in a card (`bg-gray-50 rounded-lg p-5 border border-gray-200`)
- Back link matches Detail page style

### Section: Projects
| Field | Helper text |
|---|---|
| Selected Project Keys | "Comma-separated Jira project keys, e.g. PROJ, BACKEND" |

Validation: red border + inline error if any key contains lowercase or spaces.

### Section: Risk Thresholds
| Field | Helper text |
|---|---|
| Blocked Status Names | "Status names that count as blocked, e.g. Blocked, Impediment" |
| Blocked Age Threshold (days) | "Issues blocked longer than this many days raise risk" |
| Scope Creep Threshold (%) | "Sprint scope increase above this % triggers a scope creep signal" |
| Unassigned Threshold (%) | "% of sprint issues unassigned before risk is raised" |

Number inputs: fixed `w-24` width, min/max enforced with validation message.

### Section: Sprint & Velocity
| Field | Helper text |
|---|---|
| Story Points Field ID | "Custom field ID for story points, e.g. customfield_10016" |
| Velocity Lookback Sprints | "Number of past sprints used for Monte Carlo simulation (min 3 for HIGH confidence)" |
| Use Issue Count Fallback | "Fall back to counting issues when story points are not set on issues" |

### Save button
- Right-aligned, `w-full` on mobile
- Three visual states:
  - Default: `bg-blue-600 text-white hover:bg-blue-700` — "Save Settings"
  - Saving: disabled + spinner + "Saving…"
  - Saved: `bg-green-600` + checkmark + "Saved" — resets to default after 3 seconds

---

## 6. Files Changed

| File | Change |
|---|---|
| `static/projectlens-ui/package.json` | Add `tailwindcss`, `@tailwindcss/vite` devDeps |
| `static/projectlens-ui/vite.config.ts` | Add `@tailwindcss/vite` plugin |
| `static/projectlens-ui/src/index.css` | Replace entire content: Tailwind import + CSS variables + reset `#root` (remove the Vite default `width: 1126px` and `text-align: center`) |
| `static/projectlens-ui/src/App.css` | Delete (file exists but is not imported anywhere) |
| `static/projectlens-ui/src/utils/scoreColor.ts` | New utility |
| `static/projectlens-ui/src/components/RiskBadge.tsx` | Updated styles |
| `static/projectlens-ui/src/components/ScoreBadge.tsx` | New component |
| `static/projectlens-ui/src/components/ProbabilityBadge.tsx` | Updated styles |
| `static/projectlens-ui/src/components/VelocityChart.tsx` | New component |
| `static/projectlens-ui/src/components/WarningList.tsx` | Updated styles |
| `static/projectlens-ui/src/components/LoadingState.tsx` | Updated styles |
| `static/projectlens-ui/src/components/EmptyState.tsx` | Updated styles |
| `static/projectlens-ui/src/pages/DashboardPage.tsx` | Full restyle |
| `static/projectlens-ui/src/pages/ProjectDetailPage.tsx` | Full restyle |
| `static/projectlens-ui/src/pages/SettingsPage.tsx` | Full restyle + grouping + validation |

---

## 7. Out of Scope

- No new data fetched — all visuals use data already returned by resolvers
- No routing changes
- No backend changes
- No Atlaskit / external component library
- No dark mode

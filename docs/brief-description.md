"ProjectLens" — Cross-project Portfolio Risk Intelligence

Market pain point: PMO and Engineering Managers manage 10–20 projects in Jira but have no easy way to get a holistic view of cross-project risks. They have to open each board individually and manually consolidate everything in Excel. Existing apps such as BigPicture and Structure are too heavy and expensive, at around $5–10 per user per month.

Product vision: A lightweight portfolio risk radar that automatically detects risks, such as issues blocked for more than 3 days, velocity dropping by more than 20%, sprint scope creep exceeding 15%, and unassigned issues in active sprints. It calculates a Risk Score for each project, displays a cross-project heatmap, and predicts sprint completion probability using Monte Carlo simulation based on historical velocity.

## Differentiation vs. Native Jira Dashboards

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

Custom development required for: Risk Score formula, Monte Carlo simulation, cross-project risk aggregation, velocity sub-risk normalization, scope creep detection. These cannot be replicated with native Jira gadget primitives.
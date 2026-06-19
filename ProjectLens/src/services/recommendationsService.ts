import type { RiskBreakdown } from '../types/risk';

export function generateRecommendations(breakdown: RiskBreakdown, blockedIssueKeys: string[]): string[] {
  const recommendations: string[] = [];
  if (breakdown.blockedRisk >= 70) {
    recommendations.push(`Unblock or reassign ${blockedIssueKeys.slice(0, 3).join(', ')} — they have been blocked for multiple days.`);
  }
  if (breakdown.velocityRisk >= 70) {
    recommendations.push('Velocity has dropped significantly this sprint. Run a quick team sync to identify impediments.');
  }
  if (breakdown.scopeCreepRisk >= 40) {
    recommendations.push('Scope has grown since sprint start. Review newly added issues with the Product Owner.');
  }
  if (breakdown.unassignedRisk >= 40) {
    recommendations.push('Several sprint issues are unassigned. Assign them before mid-sprint to avoid delivery risk.');
  }
  return recommendations;
}

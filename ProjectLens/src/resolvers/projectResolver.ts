import type { ResolverResult } from '../types/app';
import type { ProjectAnalysisResult } from '../types/risk';

export async function getProjectRiskDetailHandler(projectKey: string): Promise<ResolverResult<ProjectAnalysisResult>> {
  return {
    data: {
      project: {
        projectKey,
        projectName: `Project ${projectKey}`,
        riskScore: 72,
        riskLevel: 'HIGH',
        breakdown: { blockedRisk: 80, velocityRisk: 60, scopeCreepRisk: 50, unassignedRisk: 30 },
        completionProbability: 42,
        completionConfidence: 'HIGH',
        sprintName: 'Sprint 5',
        lastUpdated: new Date().toISOString(),
        partial: false,
      },
      breakdown: { blockedRisk: 80, velocityRisk: 60, scopeCreepRisk: 50, unassignedRisk: 30 },
      blockedIssues: [{ key: `${projectKey}-42`, summary: 'Blocked task example', daysBlocked: 4 }],
      velocityHistory: [20, 18, 22, 15],
      scopeCreepPercent: 15,
      unassignedCount: 3,
      recommendations: ['Unblock DEMO-42 or reassign it', 'Address velocity drop this sprint'],
      errors: [],
      warnings: [],
      partial: false,
    },
    warnings: [],
    errors: [],
    partial: false,
  };
}

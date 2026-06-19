import type { ResolverResult } from '../types/app';
import type { RiskProjectSummary } from '../types/risk';

export interface DashboardData {
  projects: RiskProjectSummary[];
  lastRefreshed: string;
}

const MOCK_PROJECTS: RiskProjectSummary[] = [
  {
    projectKey: 'DEMO',
    projectName: 'Demo Project',
    riskScore: 72,
    riskLevel: 'HIGH',
    breakdown: { blockedRisk: 80, velocityRisk: 60, scopeCreepRisk: 50, unassignedRisk: 30 },
    completionProbability: 42,
    completionConfidence: 'HIGH',
    sprintName: 'Sprint 5',
    lastUpdated: new Date().toISOString(),
    partial: false,
  },
];

export async function getDashboardDataHandler(): Promise<ResolverResult<DashboardData>> {
  return {
    data: { projects: MOCK_PROJECTS, lastRefreshed: new Date().toISOString() },
    warnings: [],
    errors: [],
    partial: false,
  };
}

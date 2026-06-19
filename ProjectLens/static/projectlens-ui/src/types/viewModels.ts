export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskBreakdown {
  blockedRisk: number;
  velocityRisk: number;
  scopeCreepRisk: number;
  unassignedRisk: number;
}

export interface ProjectRow {
  projectKey: string;
  projectName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  breakdown: RiskBreakdown;
  completionProbability: number | null;
  completionConfidence: ConfidenceLevel;
  sprintName: string | null;
  partial: boolean;
}

export interface WarningItem {
  code: string;
  message: string;
  severity: 'warning' | 'info';
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskBreakdown {
  blockedRisk: number;
  velocityRisk: number;
  scopeCreepRisk: number;
  unassignedRisk: number;
}

export interface RiskProjectSummary {
  projectKey: string;
  projectName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  breakdown: RiskBreakdown;
  completionProbability: number | null;
  completionConfidence: ConfidenceLevel;
  sprintName: string | null;
  lastUpdated: string;
  partial: boolean;
}

export interface ProjectAnalysisResult {
  project: RiskProjectSummary;
  breakdown: RiskBreakdown;
  blockedIssues: { key: string; summary: string; daysBlocked: number }[];
  velocityHistory: number[];
  scopeCreepPercent: number;
  unassignedCount: number;
  recommendations: string[];
  errors: import('./app').AppError[];
  warnings: import('./app').AppWarning[];
  partial: boolean;
}

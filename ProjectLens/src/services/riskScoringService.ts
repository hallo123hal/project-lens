import { clamp } from '../utils/math';
import type { RiskBreakdown, RiskLevel } from '../types/risk';

export function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function calculateRiskScore(breakdown: RiskBreakdown): number {
  const raw =
    breakdown.blockedRisk * 0.35 +
    breakdown.velocityRisk * 0.25 +
    breakdown.scopeCreepRisk * 0.25 +
    breakdown.unassignedRisk * 0.15;
  return clamp(Math.round(raw), 0, 100);
}

export function calculateBlockedRisk(
  blockedIssueCount: number,
  totalIssueCount: number,
  avgDaysBlocked: number,
  thresholdDays: number
): number {
  if (totalIssueCount === 0) return 0;
  const ratio = blockedIssueCount / totalIssueCount;
  const ageMultiplier = avgDaysBlocked > thresholdDays ? Math.min(avgDaysBlocked / thresholdDays, 3) : 1;
  return clamp(Math.round(ratio * ageMultiplier * 100), 0, 100);
}

export function calculateVelocityDropRisk(velocityHistory: number[]): number {
  if (velocityHistory.length < 2) return 0;
  const recent = velocityHistory[velocityHistory.length - 1];
  const baseline =
    velocityHistory.slice(0, -1).reduce((a, b) => a + b, 0) /
    (velocityHistory.length - 1);
  if (baseline === 0) return 0;
  const dropRatio = Math.max(0, (baseline - recent) / baseline);
  return clamp(Math.round(dropRatio * 100), 0, 100);
}

export function calculateScopeCreepRisk(
  addedIssues: number,
  originalIssueCount: number,
  thresholdPercent: number
): number {
  if (originalIssueCount === 0) return 0;
  const creepPercent = (addedIssues / originalIssueCount) * 100;
  if (creepPercent <= thresholdPercent) return 0;
  const excess = creepPercent - thresholdPercent;
  return clamp(Math.round((excess / thresholdPercent) * 70 + 30), 0, 100);
}

export function calculateUnassignedRisk(
  unassignedCount: number,
  totalIssueCount: number,
  thresholdPercent: number
): number {
  if (totalIssueCount === 0) return 0;
  const unassignedPercent = (unassignedCount / totalIssueCount) * 100;
  if (unassignedPercent <= thresholdPercent) return 0;
  const excess = unassignedPercent - thresholdPercent;
  return clamp(Math.round((excess / (100 - thresholdPercent)) * 100), 0, 100);
}

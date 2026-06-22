import * as jiraService from './jiraService';
import * as riskScoringService from './riskScoringService';
import { calculateCompletionProbability } from './monteCarloService';
import { generateRecommendations } from './recommendationsService';
import type { AppSettings } from '../types/settings';
import type { ProjectAnalysisResult, RiskProjectSummary, RiskBreakdown } from '../types/risk';
import type { AppWarning, AppError } from '../types/app';

function getStoryPoints(issue: { fields: Record<string, unknown> }, fieldId: string): number | null {
  const val = issue.fields[fieldId];
  if (typeof val === 'number') return val;
  return null;
}

export async function analyzeProject(projectKey: string, settings: AppSettings): Promise<ProjectAnalysisResult> {
  const warnings: AppWarning[] = [];
  const errors: AppError[] = [];
  let partial = false;

  let boards: Awaited<ReturnType<typeof jiraService.getProjectBoards>>;
  try {
    boards = await jiraService.getProjectBoards(projectKey);
  } catch {
    warnings.push({
      code: 'PROJECT_NOT_ACCESSIBLE',
      message: `Could not access Jira for project "${projectKey}". Verify the project key is correct (uppercase letters/numbers only, e.g. "FORGE" — not a board name).`,
      severity: 'warning',
      projectKey,
    });
    return buildEmptyResult(projectKey, warnings, errors, true);
  }
  if (boards.length === 0) {
    warnings.push({ code: 'BOARD_NOT_FOUND', message: `No board found for project ${projectKey}.`, severity: 'warning', projectKey });
    partial = true;
    return buildEmptyResult(projectKey, warnings, errors, partial);
  }
  if (boards.length > 1) {
    warnings.push({ code: 'MULTIPLE_BOARDS_FOUND', message: `Multiple boards found for ${projectKey}; using the first.`, severity: 'info', projectKey });
  }
  const board = boards[0];

  const activeSprint = await jiraService.getActiveSprint(board.id).catch(() => null);
  if (!activeSprint) {
    warnings.push({ code: 'NO_ACTIVE_SPRINT', message: `No active sprint for ${projectKey}.`, severity: 'warning', projectKey });
    if (!settings.includeProjectsWithoutActiveSprint) {
      partial = true;
      return buildEmptyResult(projectKey, warnings, errors, partial);
    }
  }

  const sprintIssues = activeSprint
    ? await jiraService.getSprintIssues(activeSprint.id, settings.storyPointsFieldId, settings.excludedIssueTypes).catch(() => [])
    : [];

  const today = new Date();
  const blockedIssues = sprintIssues
    .filter(i => settings.blockedStatusNames.includes(i.fields.status.name))
    .map(i => {
      const sprintStart = activeSprint?.startDate ? new Date(activeSprint.startDate) : today;
      const daysBlocked = Math.floor((today.getTime() - sprintStart.getTime()) / 86400000);
      return { key: i.key, summary: i.fields.summary, daysBlocked };
    });

  const unassignedCount = sprintIssues.filter(i => !i.fields.assignee).length;
  const totalIssueCount = sprintIssues.length;

  const sprintStartDate = activeSprint?.startDate ? new Date(activeSprint.startDate) : null;
  const addedIssues = sprintStartDate
    ? sprintIssues.filter(i => {
        const created = i.fields.created;
        return typeof created === 'string' && new Date(created) > sprintStartDate;
      }).length
    : 0;
  if (!sprintStartDate && totalIssueCount > 0) {
    warnings.push({ code: 'SCOPE_CREEP_UNMEASURED', message: 'Sprint start date unavailable; scope creep not measured.', severity: 'info', projectKey });
  }
  const originalIssueCount = totalIssueCount - addedIssues;
  const scopeCreepPercent = originalIssueCount > 0 ? (addedIssues / originalIssueCount) * 100 : 0;

  const closedSprints = await jiraService.getClosedSprints(board.id, settings.velocityLookbackSprints).catch(() => []);
  const velocityHistory: number[] = [];
  for (const sprint of closedSprints.slice(-settings.velocityLookbackSprints)) {
    const issues = await jiraService.getSprintIssues(sprint.id, settings.storyPointsFieldId, settings.excludedIssueTypes).catch(() => []);
    const doneIssues = issues.filter(i => i.fields.status.statusCategory.key === 'done');
    const hasPoints = doneIssues.some(i => getStoryPoints(i, settings.storyPointsFieldId) !== null);
    if (hasPoints) {
      const sprintVelocity = doneIssues.reduce((sum, i) => sum + (getStoryPoints(i, settings.storyPointsFieldId) ?? 0), 0);
      velocityHistory.push(sprintVelocity);
    } else if (settings.useIssueCountFallback) {
      velocityHistory.push(doneIssues.length);
      warnings.push({ code: 'USING_ISSUE_COUNT_FALLBACK', message: 'Story points not configured; using issue count for velocity.', severity: 'info', projectKey });
    }
  }

  if (velocityHistory.length < 3) {
    warnings.push({ code: 'INSUFFICIENT_VELOCITY_HISTORY', message: 'Fewer than 3 completed sprints available for velocity analysis.', severity: 'info', projectKey });
  }

  const hasPoints = sprintIssues.some(i => getStoryPoints(i, settings.storyPointsFieldId) !== null);
  if (!hasPoints && sprintIssues.length > 0) {
    warnings.push({ code: 'STORY_POINTS_NOT_CONFIGURED', message: `Story points field "${settings.storyPointsFieldId}" not found.`, severity: 'warning', projectKey });
  }

  const remainingPoints = hasPoints
    ? sprintIssues.filter(i => i.fields.status.statusCategory.key !== 'done')
        .reduce((sum, i) => sum + (getStoryPoints(i, settings.storyPointsFieldId) ?? 0), 0)
    : sprintIssues.filter(i => i.fields.status.statusCategory.key !== 'done').length;

  const { probability: completionProbability, confidence: completionConfidence } =
    velocityHistory.length > 0 ? calculateCompletionProbability(remainingPoints, velocityHistory) : { probability: null, confidence: 'LOW' as const };

  const avgDaysBlocked = blockedIssues.length > 0
    ? blockedIssues.reduce((s, i) => s + i.daysBlocked, 0) / blockedIssues.length
    : 0;

  const breakdown: RiskBreakdown = {
    blockedRisk: riskScoringService.calculateBlockedRisk(blockedIssues.length, totalIssueCount, avgDaysBlocked, settings.blockedAgeThresholdDays),
    velocityRisk: riskScoringService.calculateVelocityDropRisk(velocityHistory),
    scopeCreepRisk: riskScoringService.calculateScopeCreepRisk(addedIssues, originalIssueCount, settings.scopeCreepThresholdPercent),
    unassignedRisk: riskScoringService.calculateUnassignedRisk(unassignedCount, totalIssueCount, settings.unassignedThresholdPercent),
  };
  const riskScore = riskScoringService.calculateRiskScore(breakdown);
  const riskLevel = riskScoringService.calculateRiskLevel(riskScore);

  const summary: RiskProjectSummary = {
    projectKey,
    projectName: projectKey,
    riskScore,
    riskLevel,
    breakdown,
    completionProbability,
    completionConfidence,
    sprintName: activeSprint?.name ?? null,
    lastUpdated: new Date().toISOString(),
    partial,
  };

  return {
    project: summary,
    breakdown,
    blockedIssues,
    velocityHistory,
    scopeCreepPercent,
    unassignedCount,
    recommendations: generateRecommendations(breakdown, blockedIssues.map(i => i.key)),
    errors,
    warnings,
    partial,
  };
}

export async function analyzePortfolio(settings: AppSettings): Promise<{ projects: RiskProjectSummary[]; partial: boolean; warnings: AppWarning[] }> {
  const allWarnings: AppWarning[] = [];
  let portfolioPartial = false;
  const summaries: RiskProjectSummary[] = [];

  await Promise.allSettled(
    settings.selectedProjectKeys.map(async (projectKey) => {
      try {
        const result = await analyzeProject(projectKey, settings);
        summaries.push(result.project);
        allWarnings.push(...result.warnings);
        if (result.partial) portfolioPartial = true;
      } catch {
        portfolioPartial = true;
        allWarnings.push({ code: 'PROJECT_ANALYSIS_FAILED', message: `Analysis failed for ${projectKey}.`, severity: 'warning', projectKey });
      }
    })
  );

  return { projects: summaries, partial: portfolioPartial, warnings: allWarnings };
}

function buildEmptyResult(projectKey: string, warnings: AppWarning[], errors: AppError[], partial: boolean): ProjectAnalysisResult {
  const summary: RiskProjectSummary = {
    projectKey,
    projectName: projectKey,
    riskScore: 0,
    riskLevel: 'LOW',
    breakdown: { blockedRisk: 0, velocityRisk: 0, scopeCreepRisk: 0, unassignedRisk: 0 },
    completionProbability: null,
    completionConfidence: 'LOW',
    sprintName: null,
    lastUpdated: new Date().toISOString(),
    partial,
  };
  return { project: summary, breakdown: summary.breakdown, blockedIssues: [], velocityHistory: [], scopeCreepPercent: 0, unassignedCount: 0, recommendations: [], errors, warnings, partial };
}

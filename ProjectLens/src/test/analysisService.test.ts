import { analyzeProject } from '../services/analysisService';
import { mockActiveSprint, mockSprintIssues, mockClosedSprintVelocities } from './fixtures/jiraIssues';
import { DEFAULT_SETTINGS } from '../types/settings';

jest.mock('../services/jiraService', () => ({
  getActiveSprintData: jest.fn(),
  getClosedSprintVelocities: jest.fn(),
  getProjectIssues: jest.fn(),
}));

import * as jiraService from '../services/jiraService';

describe('analyzeProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (jiraService.getActiveSprintData as jest.Mock).mockResolvedValue({
      sprint: mockActiveSprint,
      issues: mockSprintIssues,
    });
    (jiraService.getClosedSprintVelocities as jest.Mock).mockResolvedValue(mockClosedSprintVelocities);
    (jiraService.getProjectIssues as jest.Mock).mockResolvedValue(mockSprintIssues);
  });

  it('returns a valid ProjectAnalysisResult', async () => {
    const result = await analyzeProject('DEMO', { ...DEFAULT_SETTINGS, selectedProjectKeys: ['DEMO'] });
    expect(result.project.projectKey).toBe('DEMO');
    expect(result.project.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.project.riskScore).toBeLessThanOrEqual(100);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.project.riskLevel);
  });

  it('marks result partial when no active sprint and includeProjectsWithoutActiveSprint is false', async () => {
    (jiraService.getActiveSprintData as jest.Mock).mockResolvedValueOnce({ sprint: null, issues: [] });
    const result = await analyzeProject('DEMO', { ...DEFAULT_SETTINGS, includeProjectsWithoutActiveSprint: false });
    expect(result.partial).toBe(true);
    expect(result.warnings.some(w => w.code === 'NO_ACTIVE_SPRINT')).toBe(true);
  });

  it('marks result inaccessible when getActiveSprintData throws', async () => {
    (jiraService.getActiveSprintData as jest.Mock).mockRejectedValueOnce(new Error('Jira API error 401'));
    const result = await analyzeProject('DEMO', DEFAULT_SETTINGS);
    expect(result.partial).toBe(true);
    expect(result.warnings.some(w => w.code === 'PROJECT_NOT_ACCESSIBLE')).toBe(true);
  });

  it('uses issue count fallback when story points field not populated', async () => {
    const issuesWithoutPoints = mockSprintIssues.map(i => ({ ...i, fields: { ...i.fields, story_points: null } }));
    (jiraService.getActiveSprintData as jest.Mock).mockResolvedValueOnce({
      sprint: mockActiveSprint,
      issues: issuesWithoutPoints,
    });
    const result = await analyzeProject('DEMO', { ...DEFAULT_SETTINGS, useIssueCountFallback: true });
    expect(result.warnings.some(w => w.code === 'STORY_POINTS_NOT_CONFIGURED' || w.code === 'USING_ISSUE_COUNT_FALLBACK')).toBe(true);
  });
});

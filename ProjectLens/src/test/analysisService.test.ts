import { analyzeProject } from '../services/analysisService';
import { mockBoards, mockActiveSprint, mockClosedSprints, mockSprintIssues } from './fixtures/jiraIssues';
import { DEFAULT_SETTINGS } from '../types/settings';

// jest.mock is hoisted before imports so we cannot reference imported variables
// inside the factory. We declare bare jest.fn() stubs here and wire up return
// values in beforeEach instead.
jest.mock('../services/jiraService', () => ({
  getProjectBoards: jest.fn(),
  getActiveSprint: jest.fn(),
  getClosedSprints: jest.fn(),
  getSprintIssues: jest.fn(),
  getProjectIssues: jest.fn(),
}));

// Grab the mocked module after jest.mock has been registered.
import * as jiraService from '../services/jiraService';

describe('analyzeProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (jiraService.getProjectBoards as jest.Mock).mockResolvedValue(mockBoards);
    (jiraService.getActiveSprint as jest.Mock).mockResolvedValue(mockActiveSprint);
    (jiraService.getClosedSprints as jest.Mock).mockResolvedValue(mockClosedSprints);
    (jiraService.getSprintIssues as jest.Mock).mockResolvedValue(mockSprintIssues);
    (jiraService.getProjectIssues as jest.Mock).mockResolvedValue(mockSprintIssues);
  });

  it('returns a valid ProjectAnalysisResult', async () => {
    const result = await analyzeProject('DEMO', { ...DEFAULT_SETTINGS, selectedProjectKeys: ['DEMO'] });
    expect(result.project.projectKey).toBe('DEMO');
    expect(result.project.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.project.riskScore).toBeLessThanOrEqual(100);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.project.riskLevel);
  });

  it('marks result partial when board not found', async () => {
    (jiraService.getProjectBoards as jest.Mock).mockResolvedValueOnce([]);
    const result = await analyzeProject('DEMO', DEFAULT_SETTINGS);
    expect(result.partial).toBe(true);
    expect(result.warnings.some(w => w.code === 'BOARD_NOT_FOUND')).toBe(true);
  });

  it('uses issue count fallback when story points field not populated', async () => {
    const issuesWithoutPoints = mockSprintIssues.map(i => ({ ...i, fields: { ...i.fields, story_points: null } }));
    (jiraService.getSprintIssues as jest.Mock).mockResolvedValue(issuesWithoutPoints);
    const result = await analyzeProject('DEMO', { ...DEFAULT_SETTINGS, useIssueCountFallback: true });
    expect(result.warnings.some(w => w.code === 'STORY_POINTS_NOT_CONFIGURED' || w.code === 'USING_ISSUE_COUNT_FALLBACK')).toBe(true);
  });
});

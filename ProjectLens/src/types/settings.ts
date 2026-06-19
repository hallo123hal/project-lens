export interface ProjectBoardMapping {
  projectKey: string;
  boardId: number;
}

export interface AppSettings {
  selectedProjectKeys: string[];
  projectBoardMappings: ProjectBoardMapping[];
  storyPointsFieldId: string;
  blockedStatusNames: string[];
  blockedAgeThresholdDays: number;
  includedIssueTypes: string[];
  excludedIssueTypes: string[];
  velocityLookbackSprints: number;
  scopeCreepThresholdPercent: number;
  unassignedThresholdPercent: number;
  useIssueCountFallback: boolean;
  includeProjectsWithoutActiveSprint: boolean;
}

export interface UserPreferences {
  sortField: 'riskScore' | 'projectName' | 'completionProbability';
  sortDirection: 'asc' | 'desc';
  favoriteProjectKeys: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  selectedProjectKeys: [],
  projectBoardMappings: [],
  storyPointsFieldId: 'story_points',
  blockedStatusNames: ['Blocked', 'Impediment'],
  blockedAgeThresholdDays: 2,
  includedIssueTypes: [],
  excludedIssueTypes: ['Epic', 'Sub-task'],
  velocityLookbackSprints: 5,
  scopeCreepThresholdPercent: 10,
  unassignedThresholdPercent: 20,
  useIssueCountFallback: true,
  includeProjectsWithoutActiveSprint: false,
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  sortField: 'riskScore',
  sortDirection: 'desc',
  favoriteProjectKeys: [],
};

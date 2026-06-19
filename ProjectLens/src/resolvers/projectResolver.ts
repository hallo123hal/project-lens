import type { ResolverResult } from '../types/app';
import type { ProjectAnalysisResult } from '../types/risk';
import { analyzeProject } from '../services/analysisService';
import * as storageService from '../services/storageService';
import { mergeWithDefaults } from '../services/settingsService';

export async function getProjectRiskDetailHandler(projectKey: string): Promise<ResolverResult<ProjectAnalysisResult>> {
  const stored = await storageService.getSettings();
  const settings = mergeWithDefaults(stored);

  const result = await analyzeProject(projectKey, settings);
  await storageService.setCachedProjectAnalysis(projectKey, result);

  return {
    data: result,
    warnings: result.warnings,
    errors: result.errors,
    partial: result.partial,
  };
}

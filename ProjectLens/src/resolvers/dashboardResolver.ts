import type { ResolverResult } from '../types/app';
import type { RiskProjectSummary } from '../types/risk';
import { analyzePortfolio } from '../services/analysisService';
import * as storageService from '../services/storageService';
import { mergeWithDefaults } from '../services/settingsService';

export interface DashboardData {
  projects: RiskProjectSummary[];
  lastRefreshed: string;
}

export async function getDashboardDataHandler(): Promise<ResolverResult<DashboardData>> {
  const stored = await storageService.getSettings();
  const settings = mergeWithDefaults(stored);

  if (settings.selectedProjectKeys.length === 0) {
    return {
      data: { projects: [], lastRefreshed: new Date().toISOString() },
      warnings: [{ code: 'BOARD_NOT_FOUND', message: 'No projects configured. Go to Settings to select projects.', severity: 'info' }],
      errors: [],
      partial: false,
    };
  }

  const { projects, partial, warnings } = await analyzePortfolio(settings);
  return {
    data: { projects, lastRefreshed: new Date().toISOString() },
    warnings,
    errors: [],
    partial,
  };
}

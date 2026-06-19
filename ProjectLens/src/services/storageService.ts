import { storage } from '@forge/api';
import type { AppSettings, UserPreferences } from '../types/settings';
import type { ProjectAnalysisResult } from '../types/risk';

const KEYS = {
  siteSettings: 'settings:site',
  userPreferences: (accountId: string) => `preferences:user:${accountId}`,
  projectAnalysis: (projectKey: string) => `analysis:project:${projectKey}`,
  portfolioLast: 'analysis:portfolio:last',
};

export async function getSettings(): Promise<Partial<AppSettings>> {
  return (await storage.get(KEYS.siteSettings)) ?? {};
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await storage.set(KEYS.siteSettings, settings);
}

export async function getUserPreferences(accountId: string): Promise<Partial<UserPreferences>> {
  return (await storage.get(KEYS.userPreferences(accountId))) ?? {};
}

export async function saveUserPreferences(accountId: string, prefs: UserPreferences): Promise<void> {
  await storage.set(KEYS.userPreferences(accountId), prefs);
}

export async function getCachedProjectAnalysis(projectKey: string): Promise<ProjectAnalysisResult | null> {
  return (await storage.get(KEYS.projectAnalysis(projectKey))) ?? null;
}

export async function setCachedProjectAnalysis(projectKey: string, result: ProjectAnalysisResult): Promise<void> {
  const payload = {
    project: result.project,
    breakdown: result.breakdown,
    recommendations: result.recommendations,
    warnings: result.warnings,
    errors: result.errors,
    partial: result.partial,
  };
  await storage.set(KEYS.projectAnalysis(projectKey), payload);
}

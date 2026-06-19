import type { ResolverResult } from '../types/app';
import type { UserPreferences } from '../types/settings';
import * as storageService from '../services/storageService';
import { mergeUserPreferencesWithDefaults } from '../services/settingsService';

export async function getUserPreferencesHandler(accountId: string): Promise<ResolverResult<UserPreferences>> {
  const stored = await storageService.getUserPreferences(accountId);
  return { data: mergeUserPreferencesWithDefaults(stored), warnings: [], errors: [], partial: false };
}

export async function saveUserPreferencesHandler(accountId: string, payload: Partial<UserPreferences>): Promise<ResolverResult<UserPreferences>> {
  const merged = mergeUserPreferencesWithDefaults(payload);
  await storageService.saveUserPreferences(accountId, merged);
  return { data: merged, warnings: [], errors: [], partial: false };
}

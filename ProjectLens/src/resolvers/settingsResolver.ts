import type { ResolverResult } from '../types/app';
import type { AppSettings, UserPreferences } from '../types/settings';
import * as storageService from '../services/storageService';
import { mergeWithDefaults, mergeUserPreferencesWithDefaults, validateSettings } from '../services/settingsService';

export async function getSettingsHandler(): Promise<ResolverResult<AppSettings>> {
  const stored = await storageService.getSettings();
  return { data: mergeWithDefaults(stored), warnings: [], errors: [], partial: false };
}

export async function saveSettingsHandler(payload: Partial<AppSettings>): Promise<ResolverResult<AppSettings>> {
  const merged = mergeWithDefaults(payload);
  const validationErrors = validateSettings(merged);
  if (validationErrors.length > 0) {
    return {
      errors: validationErrors.map(msg => ({ code: 'VALIDATION_ERROR', message: msg })),
      warnings: [],
      partial: false,
    };
  }
  await storageService.saveSettings(merged);
  return { data: merged, warnings: [], errors: [], partial: false };
}

export async function getUserPreferencesHandler(accountId: string): Promise<ResolverResult<UserPreferences>> {
  const stored = await storageService.getUserPreferences(accountId);
  return { data: mergeUserPreferencesWithDefaults(stored), warnings: [], errors: [], partial: false };
}

export async function saveUserPreferencesHandler(accountId: string, payload: Partial<UserPreferences>): Promise<ResolverResult<UserPreferences>> {
  const { mergeUserPreferencesWithDefaults: merge } = await import('../services/settingsService');
  const merged = merge(payload);
  await storageService.saveUserPreferences(accountId, merged);
  return { data: merged, warnings: [], errors: [], partial: false };
}

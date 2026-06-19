import { AppSettings, UserPreferences, DEFAULT_SETTINGS, DEFAULT_USER_PREFERENCES } from '../types/settings';

export function mergeWithDefaults(partial: Partial<AppSettings>): AppSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}

export function mergeUserPreferencesWithDefaults(partial: Partial<UserPreferences>): UserPreferences {
  return { ...DEFAULT_USER_PREFERENCES, ...partial };
}

export function validateSettings(settings: AppSettings): string[] {
  const errors: string[] = [];
  if (settings.velocityLookbackSprints < 1) {
    errors.push('velocityLookbackSprints must be at least 1');
  }
  if (settings.blockedAgeThresholdDays < 0) {
    errors.push('blockedAgeThresholdDays must be 0 or greater');
  }
  if (settings.scopeCreepThresholdPercent < 0 || settings.scopeCreepThresholdPercent > 100) {
    errors.push('scopeCreepThresholdPercent must be between 0 and 100');
  }
  if (settings.unassignedThresholdPercent < 0 || settings.unassignedThresholdPercent > 100) {
    errors.push('unassignedThresholdPercent must be between 0 and 100');
  }
  return errors;
}

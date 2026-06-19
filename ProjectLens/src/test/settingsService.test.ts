import { mergeWithDefaults, mergeUserPreferencesWithDefaults, validateSettings } from '../services/settingsService';
import { DEFAULT_SETTINGS, DEFAULT_USER_PREFERENCES } from '../types/settings';

describe('mergeWithDefaults', () => {
  it('returns defaults when empty object passed', () => {
    expect(mergeWithDefaults({})).toEqual(DEFAULT_SETTINGS);
  });

  it('overrides only provided fields', () => {
    const result = mergeWithDefaults({ blockedAgeThresholdDays: 5 });
    expect(result.blockedAgeThresholdDays).toBe(5);
    expect(result.velocityLookbackSprints).toBe(DEFAULT_SETTINGS.velocityLookbackSprints);
  });

  it('replaces arrays rather than merging them', () => {
    const result = mergeWithDefaults({ blockedStatusNames: ['Custom'] });
    expect(result.blockedStatusNames).toEqual(['Custom']);
  });
});

describe('validateSettings', () => {
  it('returns empty array for valid settings', () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toHaveLength(0);
  });

  it('returns error when velocityLookbackSprints is less than 1', () => {
    const errors = validateSettings({ ...DEFAULT_SETTINGS, velocityLookbackSprints: 0 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error when blockedAgeThresholdDays is negative', () => {
    const errors = validateSettings({ ...DEFAULT_SETTINGS, blockedAgeThresholdDays: -1 });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('mergeUserPreferencesWithDefaults', () => {
  it('returns defaults when empty object passed', () => {
    const result = mergeUserPreferencesWithDefaults({});
    expect(result.sortField).toBe('riskScore');
  });
});

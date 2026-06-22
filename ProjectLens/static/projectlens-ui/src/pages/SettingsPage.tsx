import { useEffect, useRef, useState } from 'react';
import { getSettings, saveSettings } from '../api/forgeApi';
import LoadingState from '../components/LoadingState';

interface Settings {
  selectedProjectKeys: string[];
  storyPointsFieldId: string;
  blockedStatusNames: string[];
  blockedAgeThresholdDays: number;
  velocityLookbackSprints: number;
  scopeCreepThresholdPercent: number;
  unassignedThresholdPercent: number;
  useIssueCountFallback: boolean;
}

function validateProjectKeys(keys: string[]): string | null {
  if (keys.length === 0) return 'At least one project key is required.';
  const invalid = keys.filter(k => !/^[A-Z][A-Z0-9]*$/.test(k));
  if (invalid.length > 0) return `Invalid keys: ${invalid.join(', ')} — use uppercase letters and numbers only (e.g. PROJ, BACKEND2).`;
  return null;
}

function FieldGroup({ label, helper, error, children }: { label: string; helper: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
        {children}
        <span className="block text-xs text-gray-400 mt-1">{helper}</span>
        {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
      </label>
    </div>
  );
}

interface Props { onBack: () => void }

export default function SettingsPage({ onBack }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'saving' | 'saved' | 'error'>('loading');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSettings()
      .then(result => { setSettings(result.data as Settings); setStatus('loaded'); })
      .catch(() => setStatus('error'));
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); };
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    if (status === 'saved') setStatus('loaded');
  }

  function handleKeysChange(raw: string) {
    const keys = raw.split(',').map(s => s.trim()).filter(Boolean);
    update('selectedProjectKeys', keys);
    setKeysError(validateProjectKeys(keys));
  }

  async function handleSave() {
    if (!settings) return;
    const err = validateProjectKeys(settings.selectedProjectKeys);
    if (err) { setKeysError(err); return; }
    setStatus('saving');
    setSaveError(null);
    const result = await saveSettings(settings as unknown as Record<string, unknown>);
    if (result.errors.length > 0) {
      setSaveError(result.errors[0].message);
      setStatus('loaded');
    } else {
      setStatus('saved');
      savedTimerRef.current = setTimeout(() => setStatus('loaded'), 3000);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
      hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`;

  const numberInputClass = 'w-24 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';

  return (
    <div className="p-6 max-w-2xl">
      <button
        onClick={onBack}
        className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0 text-sm mb-5 block"
      >
        ← Back
      </button>
      <h1 className="text-xl font-semibold text-gray-900 mt-0 mb-6">ProjectLens Settings</h1>

      {status === 'loading' && <LoadingState message="Loading settings…" />}
      {status === 'error' && <p className="text-red-600 text-sm">Failed to load settings.</p>}

      {settings && (
        <div className="space-y-5">

          {/* Section: Projects */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 m-0 mb-1">Projects</h2>
            <FieldGroup
              label="Selected Project Keys"
              helper='Comma-separated Jira project keys, e.g. PROJ, BACKEND'
              error={keysError}
            >
              <input
                value={settings.selectedProjectKeys.join(', ')}
                onChange={e => handleKeysChange(e.target.value)}
                placeholder="PROJ1, PROJ2"
                className={inputClass(!!keysError)}
              />
            </FieldGroup>
          </div>

          {/* Section: Risk Thresholds */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 m-0 mb-1">Risk Thresholds</h2>
            <FieldGroup
              label="Blocked Status Names"
              helper='Status names that count as blocked, e.g. Blocked, Impediment'
            >
              <input
                value={settings.blockedStatusNames.join(', ')}
                onChange={e => update('blockedStatusNames', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className={inputClass(false)}
              />
            </FieldGroup>
            <FieldGroup
              label="Blocked Age Threshold (days)"
              helper='Issues blocked longer than this many days raise risk'
            >
              <input
                type="number" min={0} value={settings.blockedAgeThresholdDays}
                onChange={e => update('blockedAgeThresholdDays', Math.max(0, Number(e.target.value)))}
                className={numberInputClass}
              />
            </FieldGroup>
            <FieldGroup
              label="Scope Creep Threshold (%)"
              helper='Sprint scope increase above this % triggers a scope creep signal'
            >
              <input
                type="number" min={0} max={100} value={settings.scopeCreepThresholdPercent}
                onChange={e => update('scopeCreepThresholdPercent', Math.min(100, Math.max(0, Number(e.target.value))))}
                className={numberInputClass}
              />
            </FieldGroup>
            <FieldGroup
              label="Unassigned Threshold (%)"
              helper='% of sprint issues unassigned before risk is raised'
            >
              <input
                type="number" min={0} max={100} value={settings.unassignedThresholdPercent}
                onChange={e => update('unassignedThresholdPercent', Math.min(100, Math.max(0, Number(e.target.value))))}
                className={numberInputClass}
              />
            </FieldGroup>
          </div>

          {/* Section: Sprint & Velocity */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 m-0 mb-1">Sprint & Velocity</h2>
            <FieldGroup
              label="Story Points Field ID"
              helper='Custom field ID for story points, e.g. customfield_10016'
            >
              <input
                value={settings.storyPointsFieldId}
                onChange={e => update('storyPointsFieldId', e.target.value)}
                className={inputClass(false)}
              />
            </FieldGroup>
            <FieldGroup
              label="Velocity Lookback Sprints"
              helper='Number of past sprints used for Monte Carlo simulation (min 3 for HIGH confidence)'
            >
              <input
                type="number" min={1} max={20} value={settings.velocityLookbackSprints}
                onChange={e => update('velocityLookbackSprints', Math.min(20, Math.max(1, Number(e.target.value))))}
                className={numberInputClass}
              />
            </FieldGroup>
            <div className="flex items-start gap-3">
              <input
                id="fallback"
                type="checkbox"
                checked={settings.useIssueCountFallback}
                onChange={e => update('useIssueCountFallback', e.target.checked)}
                className="mt-0.5 cursor-pointer"
              />
              <label htmlFor="fallback" className="cursor-pointer">
                <span className="block text-sm font-semibold text-gray-700">Use Issue Count Fallback</span>
                <span className="block text-xs text-gray-400 mt-0.5">Fall back to counting issues when story points are not set on issues</span>
              </label>
            </div>
          </div>

          {/* Save */}
          {saveError && <p className="text-red-600 text-sm m-0">{saveError}</p>}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className={`px-6 py-2 text-sm font-semibold rounded cursor-pointer transition-colors disabled:cursor-not-allowed flex items-center gap-2 ${
                status === 'saved'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
              }`}
            >
              {status === 'saving' && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {status === 'saved' ? '✓ Saved' : status === 'saving' ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

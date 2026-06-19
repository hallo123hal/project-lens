import { useEffect, useState } from 'react';
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

interface Props { onBack: () => void }

export default function SettingsPage({ onBack }: Props) {
  const [status, setStatus] = useState<'loading'|'loaded'|'saving'|'saved'|'error'>('loading');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(result => { setSettings(result.data as Settings); setStatus('loaded'); })
      .catch(() => setStatus('error'));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setStatus('saving');
    setSaveError(null);
    const result = await saveSettings(settings as unknown as Record<string, unknown>);
    if (result.errors.length > 0) {
      setSaveError(result.errors[0].message);
      setStatus('loaded');
    } else {
      setStatus('saved');
    }
  }

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    if (status === 'saved') setStatus('loaded');
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 700 }}>
      <button onClick={onBack} style={{ marginBottom: 16, cursor: 'pointer' }}>← Back</button>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>ProjectLens Settings</h1>
      {status === 'loading' && <LoadingState message="Loading settings…" />}
      {status === 'error' && <p style={{ color: '#AE2A19' }}>Failed to load settings.</p>}
      {settings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Story Points Field ID</div>
            <input value={settings.storyPointsFieldId} onChange={e => update('storyPointsFieldId', e.target.value)}
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Blocked Status Names (comma-separated)</div>
            <input value={settings.blockedStatusNames.join(', ')}
              onChange={e => update('blockedStatusNames', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Blocked Age Threshold (days)</div>
            <input type="number" min={0} value={settings.blockedAgeThresholdDays}
              onChange={e => update('blockedAgeThresholdDays', Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Velocity Lookback Sprints</div>
            <input type="number" min={1} max={20} value={settings.velocityLookbackSprints}
              onChange={e => update('velocityLookbackSprints', Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Scope Creep Threshold (%)</div>
            <input type="number" min={0} max={100} value={settings.scopeCreepThresholdPercent}
              onChange={e => update('scopeCreepThresholdPercent', Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px' }} />
          </label>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Unassigned Threshold (%)</div>
            <input type="number" min={0} max={100} value={settings.unassignedThresholdPercent}
              onChange={e => update('unassignedThresholdPercent', Number(e.target.value))}
              style={{ width: 120, padding: '6px 8px' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={settings.useIssueCountFallback}
              onChange={e => update('useIssueCountFallback', e.target.checked)} />
            Use issue count as fallback when story points are not configured
          </label>
          {saveError && <p style={{ color: '#AE2A19' }}>{saveError}</p>}
          {status === 'saved' && <p style={{ color: '#1F845A' }}>Settings saved.</p>}
          <button onClick={handleSave} disabled={status === 'saving'}
            style={{ padding: '8px 24px', cursor: status === 'saving' ? 'not-allowed' : 'pointer', width: 'fit-content' }}>
            {status === 'saving' ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}

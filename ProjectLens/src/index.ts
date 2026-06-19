import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getDashboardData', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('getProjectRiskDetail', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('getSettings', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('saveSettings', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('getUserPreferences', async () => ({ data: null, warnings: [], errors: [], partial: false }));
resolver.define('saveUserPreferences', async () => ({ data: null, warnings: [], errors: [], partial: false }));

export const handler = resolver.getDefinitions();

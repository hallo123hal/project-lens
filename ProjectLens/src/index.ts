import Resolver from '@forge/resolver';
import type { Request } from '@forge/resolver';
import { getDashboardDataHandler } from './resolvers/dashboardResolver';
import { getProjectRiskDetailHandler } from './resolvers/projectResolver';
import { getSettingsHandler, saveSettingsHandler } from './resolvers/settingsResolver';
import { getUserPreferencesHandler, saveUserPreferencesHandler } from './resolvers/preferencesResolver';

const resolver = new Resolver();

resolver.define('getDashboardData', () => getDashboardDataHandler());
resolver.define('getProjectRiskDetail', ({ payload }: Request<{ projectKey: string }>) =>
  getProjectRiskDetailHandler(payload.projectKey));
resolver.define('getSettings', () => getSettingsHandler());
resolver.define('saveSettings', ({ payload }: Request) => saveSettingsHandler(payload));
resolver.define('getUserPreferences', ({ context }: Request) =>
  getUserPreferencesHandler(context.accountId as string));
resolver.define('saveUserPreferences', ({ payload, context }: Request) =>
  saveUserPreferencesHandler(context.accountId as string, payload));

export const handler = resolver.getDefinitions();

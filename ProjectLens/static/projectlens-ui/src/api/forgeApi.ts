import bridge from '@forge/bridge';
import type { ProjectRow, WarningItem } from '../types/viewModels';

interface ResolverResult<T> {
  data?: T;
  warnings: WarningItem[];
  errors: { code: string; message: string }[];
  partial: boolean;
}

export interface DashboardData {
  projects: ProjectRow[];
  lastRefreshed: string;
}

export async function invoke<T>(functionName: string, payload?: Record<string, unknown>): Promise<T> {
  return bridge.invoke(functionName, payload) as Promise<T>;
}

export async function getDashboardData(): Promise<ResolverResult<DashboardData>> {
  return bridge.invoke('getDashboardData');
}

export async function getProjectRiskDetail(projectKey: string): Promise<ResolverResult<unknown>> {
  return bridge.invoke('getProjectRiskDetail', { projectKey });
}

export async function getSettings(): Promise<ResolverResult<unknown>> {
  return bridge.invoke('getSettings');
}

export async function saveSettings(settings: unknown): Promise<ResolverResult<unknown>> {
  return bridge.invoke('saveSettings', settings as Record<string, unknown>);
}

export async function getUserPreferences(): Promise<ResolverResult<unknown>> {
  return bridge.invoke('getUserPreferences');
}

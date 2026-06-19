import type { DashboardData } from '../api/forgeApi';
import type { WarningItem } from '../types/viewModels';

export type DashboardStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface DashboardState {
  status: DashboardStatus;
  data: DashboardData | null;
  warnings: WarningItem[];
  errors: { code: string; message: string }[];
  partial: boolean;
  sortField: 'riskScore' | 'projectName';
  sortDirection: 'asc' | 'desc';
}

export const initialDashboardState: DashboardState = {
  status: 'idle',
  data: null,
  warnings: [],
  errors: [],
  partial: false,
  sortField: 'riskScore',
  sortDirection: 'desc',
};

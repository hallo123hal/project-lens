export type WarningCode =
  | 'NO_ACTIVE_SPRINT'
  | 'INSUFFICIENT_VELOCITY_HISTORY'
  | 'STORY_POINTS_NOT_CONFIGURED'
  | 'USING_ISSUE_COUNT_FALLBACK'
  | 'BOARD_NOT_FOUND'
  | 'MULTIPLE_BOARDS_FOUND'
  | 'BOARD_NOT_ACCESSIBLE'
  | 'PARTIAL_DATA_DUE_TO_PERMISSIONS'
  | 'PROJECT_ANALYSIS_FAILED';

export interface AppWarning {
  code: WarningCode;
  message: string;
  severity: 'warning' | 'info';
  projectKey?: string;
}

export interface AppError {
  code: string;
  message: string;
  projectKey?: string;
}

export interface ResolverResult<T> {
  data?: T;
  warnings: AppWarning[];
  errors: AppError[];
  partial: boolean;
}

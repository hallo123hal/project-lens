export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: 'scrum' | 'kanban' | string;
  location?: { projectKey: string };
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { key: string } };
    assignee: { accountId: string; displayName: string } | null;
    created?: string;
    [storyPointsField: string]: unknown;
  };
}

export interface JiraPaginatedResponse<T> {
  values?: T[];
  issues?: T[];
  total: number;
  maxResults: number;
  startAt: number;
  isLast?: boolean;
}

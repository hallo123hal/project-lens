import type { JiraIssue, JiraSprint } from '../../types/jira';

export const mockActiveSprint: JiraSprint = {
  id: 101,
  name: 'Sprint 5',
  state: 'active',
  startDate: '2026-06-01T00:00:00.000Z',
  endDate: '2026-06-14T00:00:00.000Z',
};

export const mockSprintIssues: JiraIssue[] = [
  { id: '1', key: 'DEMO-1', fields: { summary: 'Task A', status: { name: 'In Progress', statusCategory: { key: 'indeterminate' } }, assignee: { accountId: 'u1', displayName: 'Alice' }, story_points: 5 } },
  { id: '2', key: 'DEMO-2', fields: { summary: 'Blocked task', status: { name: 'Blocked', statusCategory: { key: 'indeterminate' } }, assignee: null, story_points: 3 } },
  { id: '3', key: 'DEMO-3', fields: { summary: 'Done task', status: { name: 'Done', statusCategory: { key: 'done' } }, assignee: { accountId: 'u2', displayName: 'Bob' }, story_points: 8 } },
];

export const mockClosedSprintVelocities = [
  { name: 'Sprint 2', doneIssues: [mockSprintIssues[2]] },
  { name: 'Sprint 3', doneIssues: [mockSprintIssues[2]] },
  { name: 'Sprint 4', doneIssues: [mockSprintIssues[2]] },
];

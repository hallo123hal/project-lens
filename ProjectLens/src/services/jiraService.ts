import { requestJira, route } from '@forge/api';
import type { JiraBoard, JiraIssue, JiraSprint, JiraPaginatedResponse } from '../types/jira';
import { fetchAllPages } from '../utils/pagination';

// ---------------------------------------------------------------------------
// Low-level helper — issues a single GET and returns parsed JSON
// ---------------------------------------------------------------------------
async function getJson<T>(path: string): Promise<T> {
  const res = await requestJira(route`${path}`);
  if (!res.ok) throw new Error(`Jira API error ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

/**
 * Returns all Agile boards associated with the given project key.
 */
export async function getProjectBoards(projectKey: string): Promise<JiraBoard[]> {
  const basePath = `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}`;
  return fetchAllPages<JiraBoard>(
    basePath,
    (body) => ((body as unknown as JiraPaginatedResponse<JiraBoard>).values ?? []) as JiraBoard[],
    50
  );
}

// ---------------------------------------------------------------------------
// Sprints
// ---------------------------------------------------------------------------

/**
 * Returns the single active sprint for a board, or null if none exists.
 */
export async function getActiveSprint(boardId: number): Promise<JiraSprint | null> {
  type SprintResponse = { values: JiraSprint[] };
  const body = await getJson<SprintResponse>(
    `/rest/agile/1.0/board/${boardId}/sprint?state=active&maxResults=1`
  );
  return body.values?.[0] ?? null;
}

/**
 * Returns up to `limit` recently closed sprints for a board, newest last.
 */
export async function getClosedSprints(boardId: number, limit: number): Promise<JiraSprint[]> {
  const basePath = `/rest/agile/1.0/board/${boardId}/sprint?state=closed&maxResults=${limit}`;
  return fetchAllPages<JiraSprint>(
    basePath,
    (body) => ((body as unknown as JiraPaginatedResponse<JiraSprint>).values ?? []) as JiraSprint[],
    limit
  );
}

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

/**
 * Returns all issues in a sprint, optionally excluding specific issue types.
 * Uses the provided custom field ID for story points.
 */
export async function getSprintIssues(
  sprintId: number,
  storyPointsField: string,
  excludedTypes: string[] = []
): Promise<JiraIssue[]> {
  const typeFilter =
    excludedTypes.length > 0
      ? ` AND issueType NOT IN (${excludedTypes.map((t) => `"${t}"`).join(',')})`
      : '';
  const jql = encodeURIComponent(`sprint = ${sprintId}${typeFilter}`);
  const fields = `summary,status,assignee,${storyPointsField}`;
  const basePath = `/rest/api/3/search?jql=${jql}&fields=${fields}`;
  return fetchAllPages<JiraIssue>(
    basePath,
    (body) => ((body as unknown as JiraPaginatedResponse<JiraIssue>).issues ?? []) as JiraIssue[],
    100
  );
}

/**
 * Returns all issues for a project, with an optional extra JQL clause.
 * Falls back to summary + status + assignee fields unless overridden.
 */
export async function getProjectIssues(
  projectKey: string,
  extraJql = '',
  fields = 'summary,status,assignee'
): Promise<JiraIssue[]> {
  const jql = encodeURIComponent(
    `project = ${projectKey}${extraJql ? ' AND ' + extraJql : ''}`
  );
  const basePath = `/rest/api/3/search?jql=${jql}&fields=${fields}`;
  return fetchAllPages<JiraIssue>(
    basePath,
    (body) => ((body as unknown as JiraPaginatedResponse<JiraIssue>).issues ?? []) as JiraIssue[],
    100
  );
}

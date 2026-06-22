import { requestJira, route } from '@forge/api';
import type { JiraIssue, JiraSprint } from '../types/jira';

// Sprint info lives on issues as customfield_10020 in every Jira Cloud instance
const SPRINT_FIELD = 'customfield_10020';

// ---------------------------------------------------------------------------
// JQL search — cursor pagination via /rest/api/3/search/jql
// ---------------------------------------------------------------------------
async function searchIssuesByJql(jql: string, fields: string, pageSize = 50): Promise<JiraIssue[]> {
  const results: JiraIssue[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({ jql, fields, maxResults: String(pageSize) });
    if (nextPageToken) params.set('nextPageToken', nextPageToken);
    const res = await requestJira(route`/rest/api/3/search/jql?${params}`);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Jira search API error ${res.status}: ${body}`);
    }
    const body = await res.json() as { issues?: JiraIssue[]; nextPageToken?: string };
    results.push(...(body.issues ?? []));
    nextPageToken = body.nextPageToken;
  } while (nextPageToken);

  return results;
}

// Normalises the sprint custom field value — can be object, array, or absent
function extractSprints(issue: JiraIssue): JiraSprint[] {
  const sf = issue.fields[SPRINT_FIELD];
  if (!sf) return [];
  const raw: unknown[] = Array.isArray(sf) ? sf : [sf];
  return raw.filter((s): s is JiraSprint =>
    !!s && typeof s === 'object' && 'id' in s && 'state' in s
  );
}

// ---------------------------------------------------------------------------
// Active sprint — resolved from issue fields, no Agile API needed
// ---------------------------------------------------------------------------

/**
 * Returns the active sprint metadata and all issues in it for a project.
 * Uses JQL `sprint in openSprints()` so no board ID is required.
 */
export async function getActiveSprintData(
  projectKey: string,
  storyPointsField: string,
  excludedTypes: string[]
): Promise<{ sprint: JiraSprint | null; issues: JiraIssue[] }> {
  const typeFilter =
    excludedTypes.length > 0
      ? ` AND issueType NOT IN (${excludedTypes.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')})`
      : '';
  const jql = `project = "${projectKey}" AND sprint in openSprints()${typeFilter}`;
  const fields = `summary,status,assignee,created,${storyPointsField},${SPRINT_FIELD}`;
  const issues = await searchIssuesByJql(jql, fields, 100);

  let activeSprint: JiraSprint | null = null;
  for (const issue of issues) {
    const found = extractSprints(issue).find(s => s.state === 'active');
    if (found) { activeSprint = found; break; }
  }

  return { sprint: activeSprint, issues };
}

// ---------------------------------------------------------------------------
// Closed sprint velocity — grouped from issue sprint fields
// ---------------------------------------------------------------------------

/**
 * Returns done-issue lists grouped by closed sprint, sorted newest-first.
 * A single JQL call replaces N board→sprint→issues round trips.
 */
export async function getClosedSprintVelocities(
  projectKey: string,
  storyPointsField: string,
  limit: number
): Promise<Array<{ name: string; doneIssues: JiraIssue[] }>> {
  const jql = `project = "${projectKey}" AND sprint in closedSprints() AND sprint not in openSprints()`;
  const fields = `status,${storyPointsField},${SPRINT_FIELD}`;
  const issues = await searchIssuesByJql(jql, fields, 500);

  const sprintMap = new Map<number, { name: string; completeDate: string; issues: JiraIssue[] }>();
  for (const issue of issues) {
    for (const sprint of extractSprints(issue)) {
      if (sprint.state === 'closed' && sprint.completeDate) {
        if (!sprintMap.has(sprint.id)) {
          sprintMap.set(sprint.id, { name: sprint.name, completeDate: sprint.completeDate, issues: [] });
        }
        sprintMap.get(sprint.id)!.issues.push(issue);
      }
    }
  }

  return Array.from(sprintMap.values())
    .sort((a, b) => new Date(b.completeDate).getTime() - new Date(a.completeDate).getTime())
    .slice(0, limit)
    .map(d => ({
      name: d.name,
      doneIssues: d.issues.filter(i => i.fields.status.statusCategory.key === 'done'),
    }));
}

// ---------------------------------------------------------------------------
// Project issues (general-purpose)
// ---------------------------------------------------------------------------

export async function getProjectIssues(
  projectKey: string,
  extraJql = '',
  fields = 'summary,status,assignee'
): Promise<JiraIssue[]> {
  const jql = `project = "${projectKey}"${extraJql ? ' AND ' + extraJql : ''}`;
  return searchIssuesByJql(jql, fields, 100);
}

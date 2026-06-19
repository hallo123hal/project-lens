import { requestJira, route } from '@forge/api';

export async function fetchAllPages<T>(
  path: string,
  extractItems: (body: Record<string, unknown>) => T[],
  pageSize = 50
): Promise<T[]> {
  const results: T[] = [];
  let startAt = 0;
  let isLast = false;

  while (!isLast) {
    const separator = path.includes('?') ? '&' : '?';
    const response = await requestJira(route`${path}${separator}startAt=${startAt}&maxResults=${pageSize}`);
    const body = await response.json() as Record<string, unknown>;
    const items = extractItems(body);
    results.push(...items);
    const total = (body.total as number) ?? 0;
    const maxResults = (body.maxResults as number) ?? pageSize;
    isLast = (body.isLast as boolean) ?? (startAt + maxResults >= total);
    startAt += maxResults;
    if (items.length === 0) break;
  }

  return results;
}

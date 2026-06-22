export type ScoreLevel = 'low' | 'medium' | 'high';

export function scoreColor(n: number): ScoreLevel {
  if (n >= 70) return 'high';
  if (n >= 40) return 'medium';
  return 'low';
}

import type { ConfidenceLevel } from '../types/risk';

export interface MonteCarloResult {
  probability: number;
  confidence: ConfidenceLevel;
}

export function calculateCompletionProbability(
  remainingPoints: number,
  velocityHistory: number[],
  iterations = 1000,
  sampler: () => number = Math.random
): MonteCarloResult {
  if (velocityHistory.length === 0) {
    return { probability: 0, confidence: 'LOW' };
  }

  const confidence: ConfidenceLevel =
    velocityHistory.length >= 3 ? 'HIGH' :
    velocityHistory.length >= 2 ? 'MEDIUM' : 'LOW';

  let completedCount = 0;
  const n = velocityHistory.length;

  for (let i = 0; i < iterations; i++) {
    const sampledIndex = Math.floor(sampler() * n);
    const sampledVelocity = velocityHistory[sampledIndex];
    if (sampledVelocity >= remainingPoints) {
      completedCount++;
    }
  }

  const probability = Math.round((completedCount / iterations) * 100);
  return { probability, confidence };
}

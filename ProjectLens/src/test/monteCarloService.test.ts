import { calculateCompletionProbability } from '../services/monteCarloService';
import { stableVelocityHistory, unstableVelocityHistory, shortVelocityHistory, singleSprintHistory } from './fixtures/jiraSprints';

describe('calculateCompletionProbability', () => {
  it('returns HIGH confidence with 3+ completed sprints', () => {
    const result = calculateCompletionProbability(15, stableVelocityHistory);
    expect(result.confidence).toBe('HIGH');
  });

  it('returns MEDIUM confidence with 2 sprints', () => {
    const result = calculateCompletionProbability(15, shortVelocityHistory);
    expect(result.confidence).toBe('MEDIUM');
  });

  it('returns LOW confidence with 1 sprint', () => {
    const result = calculateCompletionProbability(15, singleSprintHistory);
    expect(result.confidence).toBe('LOW');
  });

  it('returns high probability when remaining is well below average velocity', () => {
    const result = calculateCompletionProbability(5, stableVelocityHistory);
    expect(result.probability).toBeGreaterThan(90);
  });

  it('returns low probability when remaining far exceeds average velocity', () => {
    const result = calculateCompletionProbability(200, stableVelocityHistory);
    expect(result.probability).toBeLessThan(10);
  });

  it('accepts injectable sampler for deterministic tests', () => {
    const sampler = jest.fn().mockReturnValue(0.5);
    const result = calculateCompletionProbability(15, stableVelocityHistory, 100, sampler);
    expect(sampler).toHaveBeenCalled();
    expect(result.probability).toBeGreaterThanOrEqual(0);
    expect(result.probability).toBeLessThanOrEqual(100);
  });

  it('returns null-equivalent when velocity history is empty', () => {
    const result = calculateCompletionProbability(15, []);
    expect(result.probability).toBe(0);
    expect(result.confidence).toBe('LOW');
  });
});

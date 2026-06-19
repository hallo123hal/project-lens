import {
  calculateBlockedRisk, calculateVelocityDropRisk, calculateScopeCreepRisk,
  calculateUnassignedRisk, calculateRiskScore, calculateRiskLevel,
} from '../services/riskScoringService';

describe('calculateRiskLevel', () => {
  it('returns LOW for scores 0–39', () => expect(calculateRiskLevel(39)).toBe('LOW'));
  it('returns MEDIUM for scores 40–69', () => expect(calculateRiskLevel(40)).toBe('MEDIUM'));
  it('returns HIGH for scores 70–100', () => expect(calculateRiskLevel(70)).toBe('HIGH'));
});

describe('calculateRiskScore', () => {
  it('applies weighted formula', () => {
    const score = calculateRiskScore({ blockedRisk: 100, velocityRisk: 0, scopeCreepRisk: 0, unassignedRisk: 0 });
    expect(score).toBeCloseTo(35);
  });
  it('clamps to 0–100', () => {
    expect(calculateRiskScore({ blockedRisk: 200, velocityRisk: 200, scopeCreepRisk: 200, unassignedRisk: 200 })).toBe(100);
  });
});

describe('calculateBlockedRisk', () => {
  it('returns 0 when no blocked issues', () => expect(calculateBlockedRisk(0, 10, 0, 2)).toBe(0));
  it('returns high risk when all issues are blocked', () => expect(calculateBlockedRisk(10, 10, 5, 2)).toBeGreaterThan(70));
});

describe('calculateVelocityDropRisk', () => {
  it('returns 0 for stable velocity', () => expect(calculateVelocityDropRisk([10, 10, 10, 10, 10])).toBe(0));
  it('returns high risk for 80% drop in last sprint', () => {
    expect(calculateVelocityDropRisk([10, 10, 10, 10, 2])).toBeGreaterThan(70);
  });
  it('returns 0 for fewer than 2 sprints', () => expect(calculateVelocityDropRisk([10])).toBe(0));
});

describe('calculateScopeCreepRisk', () => {
  it('returns 0 when no new issues added', () => expect(calculateScopeCreepRisk(0, 10, 10)).toBe(0));
  it('returns HIGH when creep exceeds threshold significantly', () => {
    expect(calculateScopeCreepRisk(5, 10, 10)).toBeGreaterThan(70);
  });
});

describe('calculateUnassignedRisk', () => {
  it('returns 0 when all issues are assigned', () => expect(calculateUnassignedRisk(0, 10, 20)).toBe(0));
  it('returns HIGH when most issues unassigned', () => {
    expect(calculateUnassignedRisk(8, 10, 20)).toBeGreaterThan(70);
  });
});

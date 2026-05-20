import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { evaluate } from '../src/evaluator';
import { generate } from '../src/generator';
import { parseStoryFile } from '../src/story';

const fixtures = path.join(__dirname, 'fixtures');

describe('evaluate', () => {
  it('reports full coverage but flags the stub backend\'s deliberate hallucination', async () => {
    const story = parseStoryFile(path.join(fixtures, 'login.story.md'));
    const { testCases } = await generate(story, { backend: 'stub' });
    const report = evaluate(story, testCases);

    expect(report.totalCriteria).toBe(5);
    expect(report.coveredCriteria).toBe(5);
    expect(report.coveragePct).toBe(100);
    expect(report.hallucinations.some((h) => h.suspiciousTerms.includes('audit_log'))).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(60);
    expect(report.score).toBeLessThan(100);
  });

  it('lowers the score when ACs are missed', async () => {
    const story = parseStoryFile(path.join(fixtures, 'login.story.md'));
    const { testCases } = await generate(story, { backend: 'stub' });
    const truncated = testCases.slice(0, testCases.length - 2);
    const report = evaluate(story, truncated);
    expect(report.coveredCriteria).toBeLessThan(report.totalCriteria);
    expect(report.coverageGaps.length).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(95);
  });
});

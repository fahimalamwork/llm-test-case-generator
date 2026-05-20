import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { generate } from '../src/generator';
import { parseStoryFile } from '../src/story';

const fixtures = path.join(__dirname, 'fixtures');

describe('generate (stub backend)', () => {
  it('produces one test case per AC plus one negative', async () => {
    const story = parseStoryFile(path.join(fixtures, 'login.story.md'));
    const result = await generate(story, { backend: 'stub' });
    expect(result.testCases).toHaveLength(story.acceptanceCriteria.length + 1);
    const covered = new Set(result.testCases.flatMap((tc) => tc.covers));
    for (let i = 0; i < story.acceptanceCriteria.length; i++) {
      expect(covered.has(`AC-${i + 1}`)).toBe(true);
    }
  });
});

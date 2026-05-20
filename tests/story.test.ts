import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { parseStory, parseStoryFile } from '../src/story';

const fixtures = path.join(__dirname, 'fixtures');

describe('parseStory', () => {
  it('parses title, body, and bulleted acceptance criteria', () => {
    const story = parseStoryFile(path.join(fixtures, 'login.story.md'));
    expect(story.title).toBe('Customer login');
    expect(story.body).toContain('Sign-In button');
    expect(story.acceptanceCriteria).toHaveLength(5);
    expect(story.acceptanceCriteria[0]).toContain('valid credentials');
  });

  it('handles numbered criteria', () => {
    const story = parseStory(`# Title

Body text.

## Acceptance Criteria
1. First criterion.
2. Second criterion.`);
    expect(story.acceptanceCriteria).toEqual(['First criterion.', 'Second criterion.']);
  });
});

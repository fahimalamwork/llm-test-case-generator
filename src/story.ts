import { readFileSync } from 'node:fs';
import type { UserStory } from './types';

/**
 * Parse a Markdown user story.
 *
 *   # Title
 *   Body text...
 *   ## Acceptance Criteria
 *   - First criterion
 *   - Second criterion
 *
 * Bullet, numbered (`1.`), and bulleted-with-asterisks lists are all recognised.
 */
export function parseStory(text: string): UserStory {
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1]!.trim() : 'Untitled story';

  const acHeader = /^##\s+Acceptance Criteria\s*$/im;
  const acIndex = text.search(acHeader);

  let body = text;
  let acceptanceCriteria: string[] = [];

  if (acIndex >= 0) {
    body = text.slice(0, acIndex);
    const acBlock = text.slice(acIndex).replace(acHeader, '').trim();
    acceptanceCriteria = acBlock
      .split('\n')
      .map((l) => l.trim())
      .map((l) => {
        if (/^[-*•]\s+/.test(l)) return l.replace(/^[-*•]\s+/, '').trim();
        if (/^\d+\.\s+/.test(l)) return l.replace(/^\d+\.\s+/, '').trim();
        return '';
      })
      .filter((l) => l.length > 0);
  }

  if (titleMatch) body = body.replace(titleMatch[0], '').trim();

  return { title, body, acceptanceCriteria };
}

export function parseStoryFile(path: string): UserStory {
  return parseStory(readFileSync(path, 'utf8'));
}

/** Tokens that appear in the story; used by the evaluator to detect hallucinated entities. */
export function storyVocabulary(story: UserStory): Set<string> {
  const text = `${story.title} ${story.body} ${story.acceptanceCriteria.join(' ')}`.toLowerCase();
  return new Set(
    text
      .split(/\s+/)
      .map((w) => w.replace(/[.,;:!?"'()[\]]/g, ''))
      .filter((w) => w.length > 3)
  );
}

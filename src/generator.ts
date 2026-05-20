import { getBackend, type Backend, type BackendName } from './backends';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import {
  GenerationResponseSchema,
  type GeneratedTestCase,
  type GenerationResult,
  type UserStory,
} from './types';

export interface GenerateOptions {
  backend?: BackendName | Backend;
  model?: string;
}

export async function generate(story: UserStory, opts: GenerateOptions = {}): Promise<GenerationResult> {
  const backend: Backend =
    typeof opts.backend === 'object'
      ? opts.backend
      : await getBackend(opts.backend ?? 'stub', opts.model);

  const userPrompt = buildUserPrompt(story.title, story.body, story.acceptanceCriteria);
  const response = await backend.complete(SYSTEM_PROMPT, userPrompt);

  const parsed = JSON.parse(response.text);
  const validated = GenerationResponseSchema.parse(parsed);
  const testCases: GeneratedTestCase[] = validated.test_cases.map((tc) => ({
    id: tc.id,
    title: tc.title,
    preconditions: tc.preconditions ?? [],
    steps: tc.steps,
    expectedResult: tc.expectedResult,
    covers: tc.covers ?? [],
    priority: tc.priority ?? 'P2',
    tags: tc.tags ?? [],
  }));

  return {
    storyTitle: story.title,
    backend: backend.name,
    model: response.model,
    testCases,
    rawPrompt: userPrompt,
    rawResponse: response.text,
  };
}

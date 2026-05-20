import { z } from 'zod';

export const UserStorySchema = z.object({
  title: z.string(),
  body: z.string(),
  acceptanceCriteria: z.array(z.string()),
});
export type UserStory = z.infer<typeof UserStorySchema>;

export const GeneratedTestCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  preconditions: z.array(z.string()).default([]),
  steps: z.array(z.string()),
  expectedResult: z.string(),
  covers: z.array(z.string()).default([]),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
  tags: z.array(z.string()).default([]),
});
export type GeneratedTestCase = z.infer<typeof GeneratedTestCaseSchema>;

export const GenerationResponseSchema = z.object({
  test_cases: z.array(GeneratedTestCaseSchema.passthrough()),
});

export interface GenerationResult {
  storyTitle: string;
  backend: string;
  model: string;
  testCases: GeneratedTestCase[];
  rawPrompt: string;
  rawResponse: string;
}

export interface CoverageGap {
  criterion: string;
  reason: string;
}

export interface Hallucination {
  testCaseId: string;
  suspiciousTerms: string[];
  excerpt: string;
}

export interface FormatIssue {
  testCaseId: string;
  issue: string;
}

export interface EvalReport {
  totalTestCases: number;
  coveredCriteria: number;
  totalCriteria: number;
  coveragePct: number;
  hallucinations: Hallucination[];
  coverageGaps: CoverageGap[];
  formatIssues: FormatIssue[];
  /** Composite 0–100 score; 100 = perfect coverage with zero issues. */
  score: number;
}

import { storyVocabulary } from './story';
import type {
  CoverageGap,
  EvalReport,
  FormatIssue,
  GeneratedTestCase,
  Hallucination,
  UserStory,
} from './types';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'user', 'users',
  'system', 'page', 'screen', 'given', 'when', 'then', 'should', 'have', 'must',
  'test', 'case', 'verify', 'validate', 'ensure', 'check', 'click', 'enter',
  'input', 'submit', 'expect', 'expected', 'result', 'results', 'valid', 'invalid',
  'correct', 'incorrect', 'their', 'they', 'them', 'form', 'field', 'fields',
  'button', 'buttons', 'value', 'values',
]);

function tokens(s: string): Set<string> {
  return new Set(
    (s.toLowerCase().match(/[a-z][a-z_]+/g) ?? []).filter((w) => w.length > 3)
  );
}

function suspiciousTerms(tc: GeneratedTestCase, vocab: Set<string>): string[] {
  const text = [tc.title, tc.expectedResult, tc.steps.join(' '), tc.tags.join(' ')].join(' ');
  const ts = tokens(text);
  const out: string[] = [];
  for (const t of ts) {
    if (!vocab.has(t) && !STOPWORDS.has(t)) out.push(t);
  }
  return out.sort();
}

/**
 * Score the generation against the source story.
 *
 *   score = (coverage% × 0.6) + ((100 − hallucinationPenalty) × 0.3) + ((100 − formatPenalty) × 0.1)
 *
 * Hallucination penalty caps at 30, format penalty at 10. A perfect run scores 100.
 */
export function evaluate(story: UserStory, cases: GeneratedTestCase[]): EvalReport {
  const vocab = storyVocabulary(story);
  const totalAc = story.acceptanceCriteria.length;
  const coveredIds = new Set<string>();
  for (const c of cases) for (const id of c.covers) coveredIds.add(id);

  const coverageGaps: CoverageGap[] = [];
  for (let i = 0; i < totalAc; i++) {
    if (!coveredIds.has(`AC-${i + 1}`)) {
      coverageGaps.push({
        criterion: story.acceptanceCriteria[i]!,
        reason: `No test case cites AC-${i + 1}`,
      });
    }
  }

  const hallucinations: Hallucination[] = [];
  for (const tc of cases) {
    const suspects = suspiciousTerms(tc, vocab);
    if (suspects.length > 0) {
      hallucinations.push({
        testCaseId: tc.id,
        suspiciousTerms: suspects,
        excerpt: tc.title,
      });
    }
  }

  const formatIssues: FormatIssue[] = [];
  for (const tc of cases) {
    if (tc.steps.length === 0) formatIssues.push({ testCaseId: tc.id, issue: 'steps array is empty' });
    if (!tc.expectedResult.trim()) formatIssues.push({ testCaseId: tc.id, issue: 'expectedResult is empty' });
    if (!/^TC-\d{3}$/.test(tc.id)) {
      formatIssues.push({ testCaseId: tc.id, issue: 'id does not match TC-### convention' });
    }
  }

  const coveragePct = totalAc === 0 ? 100 : ((totalAc - coverageGaps.length) / totalAc) * 100;
  const hallucinationPenalty = Math.min(30, hallucinations.length * 10);
  const formatPenalty = Math.min(10, formatIssues.length * 2);
  const score = Math.max(
    0,
    coveragePct * 0.6 + (100 - hallucinationPenalty) * 0.3 + (100 - formatPenalty) * 0.1
  );

  return {
    totalTestCases: cases.length,
    coveredCriteria: totalAc - coverageGaps.length,
    totalCriteria: totalAc,
    coveragePct: Math.round(coveragePct * 10) / 10,
    hallucinations,
    coverageGaps,
    formatIssues,
    score: Math.round(score * 10) / 10,
  };
}

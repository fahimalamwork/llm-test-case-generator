# llm-test-case-generator

Generate test cases from a user story with an LLM, then **evaluate the output** for hallucinations, acceptance-criteria coverage, and structural issues — so you can use generated tests with eyes open.

```
$ llm-tcg generate examples/shopping-cart.story.md
✓ Generated 6 test cases from 'Shopping cart' → generated.json

$ llm-tcg eval generated.json --story examples/shopping-cart.story.md
─────────────────── Evaluation — score 88.0 ───────────────────
Test cases       6
AC coverage      5 / 5 (100%)
Hallucinations   1
Coverage gaps    0
Format issues    0

Possible hallucinations:
  • TC-006 'Negative: surface a clear error on bad input' — suspect: audit_log
```

## Why this exists

Generating test cases with an LLM is the easy part — it takes thirty seconds. The hard part is **knowing whether you can trust the output**. While validating an internal AI-powered QA assistant during alpha rollout, the failure modes that broke teams were always the same:

1. The model invents a field, error code, or API that doesn't exist (hallucination).
2. The model "covers" an acceptance criterion in name only, with a vague test.
3. One of the seven ACs gets quietly skipped because it was buried in a paragraph.

This tool is the eval harness I wished I had during that rollout. It scores generation output before a human ever opens it.

## How the score works

```
score = (coverage% × 0.6) + ((100 − hallucinationPenalty) × 0.3) + ((100 − formatPenalty) × 0.1)
```

| Signal | What it measures | Weight |
|---|---|---|
| **AC coverage** | Every acceptance criterion has at least one test case `covers`-citing it | 60% |
| **Hallucinations** | Words in test cases that don't appear in the source story (filtered by stopwords) | 30% |
| **Format issues** | Empty steps, missing `expectedResult`, IDs not matching the `TC-###` convention | 10% |

The defaults are tunable — see `evaluator.ts`.

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Runtime | Node 20+ |
| Validation | Zod (runtime parsing of LLM JSON) |
| CLI | argv + Kleur |
| Backends | OpenAI, Anthropic, or a deterministic Stub |
| Tests | Vitest |

## Install

```bash
# Core + deterministic stub backend (no API key needed)
npm install
npm run build

# Add the OpenAI backend
npm install openai
export OPENAI_API_KEY=sk-...

# Or the Anthropic backend
npm install @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-ant-...
```

The SDKs are declared as **optional peer dependencies** so the core install stays light. The backend module is loaded lazily on first use — if you never call the OpenAI backend, the SDK never gets imported.

## Use as a library

```ts
import { generate, evaluate, parseStoryFile } from 'llm-test-case-generator';

const story = parseStoryFile('story.md');
const result = await generate(story, { backend: 'openai', model: 'gpt-4o-mini' });
const report = evaluate(story, result.testCases);

console.log(`Score: ${report.score}`);
for (const h of report.hallucinations) {
  console.log(h.testCaseId, h.suspiciousTerms);
}
```

## Repo layout

```
src/
├── cli.ts            argv parsing + Kleur-coloured output
├── generator.ts      generate() entry point
├── evaluator.ts      coverage / hallucination / format checks
├── prompts.ts        system + user prompt templates
├── story.ts          markdown story parser
├── types.ts          zod schemas + TS types
└── backends/         Stub, OpenAI, Anthropic
tests/
├── story.test.ts
├── generator.test.ts
├── evaluator.test.ts
└── fixtures/         deterministic story for stub-backed CI
```

## What I'd add next

- Diff mode: rerun on the same story across two prompt versions, show score delta
- Per-AC test-distribution heuristic (an AC with one test is weaker than one with three)
- Output formats: CSV for Excel, Markdown table for Jira/ADO, Gherkin for direct paste into a framework
- A "regenerate-the-failures" mode that prompts the LLM to fix just the flagged cases

---

Built by [Fahim Alam](https://github.com/fahimalamwork) — Senior QA / SDET, NYC.

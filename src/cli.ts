#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import kleur from 'kleur';
import { evaluate } from './evaluator';
import { generate } from './generator';
import { parseStoryFile } from './story';
import {
  GeneratedTestCaseSchema,
  type EvalReport,
  type GeneratedTestCase,
} from './types';
import type { BackendName } from './backends';

const USAGE = `llm-tcg — generate and evaluate LLM test cases

Usage:
  llm-tcg generate <story.md> [--out generated.json] [--backend stub|openai|anthropic] [--model <name>]
  llm-tcg eval <generated.json> --story <story.md> [--json report.json] [--fail-under 70]

Examples:
  llm-tcg generate examples/shopping-cart.story.md
  llm-tcg generate story.md --backend anthropic --model claude-3-5-sonnet-latest
  llm-tcg eval generated.json --story story.md --fail-under 80`;

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (!cmd || cmd === '-h' || cmd === '--help') {
    console.log(USAGE);
    return cmd ? 0 : 2;
  }

  if (cmd === 'generate') return await runGenerate(argv.slice(1));
  if (cmd === 'eval') return await runEval(argv.slice(1));

  console.error(`unknown command: ${cmd}\n\n${USAGE}`);
  return 2;
}

async function runGenerate(argv: string[]): Promise<number> {
  let storyPath: string | undefined;
  let outPath = 'generated.json';
  let backend: BackendName = 'stub';
  let model: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' && argv[i + 1]) outPath = argv[++i]!;
    else if (a === '--backend' && argv[i + 1]) backend = argv[++i] as BackendName;
    else if (a === '--model' && argv[i + 1]) model = argv[++i];
    else if (a && !a.startsWith('--')) storyPath = a;
  }

  if (!storyPath) {
    console.error('error: <story.md> is required\n\n' + USAGE);
    return 2;
  }

  const story = parseStoryFile(storyPath);
  const result = await generate(story, { backend, model });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        storyTitle: result.storyTitle,
        backend: result.backend,
        model: result.model,
        test_cases: result.testCases,
      },
      null,
      2
    ),
    'utf8'
  );
  console.log(kleur.green('✓') + ` Generated ${kleur.bold(result.testCases.length)} test cases from '${story.title}' → ${kleur.cyan(outPath)}`);
  return 0;
}

async function runEval(argv: string[]): Promise<number> {
  let casesPath: string | undefined;
  let storyPath: string | undefined;
  let jsonOut: string | undefined;
  let failUnder = 70;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--story' && argv[i + 1]) storyPath = argv[++i];
    else if (a === '--json' && argv[i + 1]) jsonOut = argv[++i];
    else if (a === '--fail-under' && argv[i + 1]) failUnder = Number(argv[++i]);
    else if (a && !a.startsWith('--')) casesPath = a;
  }

  if (!casesPath || !storyPath) {
    console.error('error: both <generated.json> and --story <story.md> are required\n\n' + USAGE);
    return 2;
  }

  const story = parseStoryFile(storyPath);
  const payload = JSON.parse(readFileSync(casesPath, 'utf8'));
  const cases: GeneratedTestCase[] = (payload.test_cases ?? []).map((tc: unknown) =>
    GeneratedTestCaseSchema.parse(tc)
  );

  const report = evaluate(story, cases);
  printReport(report);
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify(report, null, 2), 'utf8');
  return report.score >= failUnder ? 0 : 2;
}

function printReport(report: EvalReport): void {
  const colour = report.score >= 80 ? kleur.green : report.score >= 60 ? kleur.yellow : kleur.red;
  console.log('─'.repeat(20) + ' ' + kleur.bold('Evaluation — score ') + colour(String(report.score)) + ' ' + '─'.repeat(20));
  console.log(`Test cases       ${report.totalTestCases}`);
  console.log(`AC coverage      ${report.coveredCriteria} / ${report.totalCriteria} (${report.coveragePct}%)`);
  console.log(`Hallucinations   ${report.hallucinations.length}`);
  console.log(`Coverage gaps    ${report.coverageGaps.length}`);
  console.log(`Format issues    ${report.formatIssues.length}`);

  if (report.coverageGaps.length > 0) {
    console.log('\n' + kleur.bold().yellow('Coverage gaps:'));
    for (const gap of report.coverageGaps) {
      console.log(`  • ${kleur.red(gap.criterion)} — ${gap.reason}`);
    }
  }

  if (report.hallucinations.length > 0) {
    console.log('\n' + kleur.bold().yellow('Possible hallucinations:'));
    for (const h of report.hallucinations) {
      const terms = h.suspiciousTerms.slice(0, 6).join(', ');
      console.log(`  • ${kleur.cyan(h.testCaseId)} '${h.excerpt}' — suspect: ${kleur.red(terms)}`);
    }
  }

  if (report.formatIssues.length > 0) {
    console.log('\n' + kleur.bold().yellow('Format issues:'));
    for (const f of report.formatIssues) {
      console.log(`  • ${kleur.cyan(f.testCaseId)} — ${f.issue}`);
    }
  }
}

main().then((code) => process.exit(code));

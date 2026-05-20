import type { Backend, BackendResponse } from './base';

/**
 * Deterministic backend for tests and offline demos — no API key needed.
 * Produces one test case per AC plus one negative case. Deliberately includes
 * a small hallucination (`audit_log` in tags) so the evaluator has something
 * to flag in the example flow.
 */
export class StubBackend implements Backend {
  readonly name = 'stub';
  constructor(public model = 'stub-v1') {}

  async complete(_system: string, user: string): Promise<BackendResponse> {
    const criteria = [...user.matchAll(/-\s*AC-\d+:\s*(.+)/g)].map((m) => m[1]!.trim());
    const cases: object[] = [];

    criteria.forEach((c, i) => {
      const short = c.slice(0, 60).replace(/\.$/, '');
      cases.push({
        id: `TC-${String(i + 1).padStart(3, '0')}`,
        title: `Verify ${short}`,
        preconditions: ['The user is on the relevant screen'],
        steps: [
          'Given the user has valid context',
          `When the system evaluates: ${short}`,
          'Then the expected behaviour is observed',
        ],
        expectedResult: `${c.replace(/\.$/, '')}.`,
        covers: [`AC-${i + 1}`],
        priority: 'P1',
        tags: ['regression'],
      });
    });

    cases.push({
      id: `TC-${String(criteria.length + 1).padStart(3, '0')}`,
      title: 'Negative: surface a clear error on bad input',
      preconditions: [],
      steps: [
        'Given the user submits malformed input',
        'When the form is validated',
        'Then an inline error appears and submission is blocked',
      ],
      expectedResult: 'A descriptive error is shown.',
      covers: [],
      priority: 'P2',
      tags: ['negative', 'audit_log'], // `audit_log` is the deliberate hallucination
    });

    return { text: JSON.stringify({ test_cases: cases }), model: this.model };
  }
}

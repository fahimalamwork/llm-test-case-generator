import type { Backend, BackendResponse } from './base';

/**
 * OpenAI backend. Requires the `openai` peer dependency and OPENAI_API_KEY.
 *   npm install openai
 *   export OPENAI_API_KEY=sk-...
 */
export class OpenAIBackend implements Backend {
  readonly name = 'openai';
  private client: any;

  constructor(public model = 'gpt-4o-mini') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
  }

  private async client_(): Promise<any> {
    if (this.client) return this.client;
    let mod: any;
    try {
      mod = await import('openai');
    } catch {
      throw new Error('openai SDK not installed — run `npm install openai`');
    }
    const OpenAI = mod.default ?? mod.OpenAI;
    this.client = new OpenAI();
    return this.client;
  }

  async complete(system: string, user: string): Promise<BackendResponse> {
    const client = await this.client_();
    const response = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });
    const text = response.choices?.[0]?.message?.content ?? '{}';
    return { text, model: this.model };
  }
}

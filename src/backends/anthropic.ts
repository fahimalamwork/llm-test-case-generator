import type { Backend, BackendResponse } from './base';

/**
 * Anthropic backend. Requires the `@anthropic-ai/sdk` peer dependency and ANTHROPIC_API_KEY.
 *   npm install @anthropic-ai/sdk
 *   export ANTHROPIC_API_KEY=sk-ant-...
 */
export class AnthropicBackend implements Backend {
  readonly name = 'anthropic';
  private client: any;

  constructor(public model = 'claude-3-5-sonnet-latest') {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
  }

  private async client_(): Promise<any> {
    if (this.client) return this.client;
    let mod: any;
    try {
      mod = await import('@anthropic-ai/sdk');
    } catch {
      throw new Error('@anthropic-ai/sdk not installed — run `npm install @anthropic-ai/sdk`');
    }
    const Ctor = mod.default ?? mod.Anthropic;
    this.client = new Ctor();
    return this.client;
  }

  async complete(system: string, user: string): Promise<BackendResponse> {
    const client = await this.client_();
    const message = await client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.2,
    });

    const text = (message.content ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');
    return { text, model: this.model };
  }
}

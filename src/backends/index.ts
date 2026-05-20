import type { Backend, BackendName } from './base';
import { StubBackend } from './stub';

export type { Backend, BackendName } from './base';
export { StubBackend } from './stub';

export async function getBackend(name: BackendName, model?: string): Promise<Backend> {
  switch (name) {
    case 'stub':
      return new StubBackend(model);
    case 'openai': {
      const { OpenAIBackend } = await import('./openai');
      return new OpenAIBackend(model);
    }
    case 'anthropic': {
      const { AnthropicBackend } = await import('./anthropic');
      return new AnthropicBackend(model);
    }
    default:
      throw new Error(`unknown backend: ${name as string}`);
  }
}

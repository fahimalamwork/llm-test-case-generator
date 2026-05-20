export interface BackendResponse {
  text: string;
  model: string;
}

export interface Backend {
  name: string;
  complete(system: string, user: string): Promise<BackendResponse>;
}

export type BackendName = 'stub' | 'openai' | 'anthropic';

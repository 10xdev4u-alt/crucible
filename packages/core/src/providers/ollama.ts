import type { Provider, ProviderRequest, ProviderResponse } from '../registry/provider-registry.js';
import type { ProviderCapabilities, ProviderInfo } from '../types/provider.js';
import type { HttpClient } from './http.js';

const OLLAMA_DEFAULT_URL = 'http://localhost:11434/v1/chat/completions';

const OLLAMA_MODELS = [
  {
    id: 'llama3.3:70b',
    provider: 'ollama',
    displayName: 'Llama 3.3 70B',
    contextWindow: 128_000,
    maxOutputTokens: 8_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false,
  },
  {
    id: 'qwen2.5-coder:32b',
    provider: 'ollama',
    displayName: 'Qwen 2.5 Coder 32B',
    contextWindow: 32_000,
    maxOutputTokens: 8_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false,
  },
  {
    id: 'deepseek-r1:32b',
    provider: 'ollama',
    displayName: 'DeepSeek R1 32B',
    contextWindow: 64_000,
    maxOutputTokens: 8_000,
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false,
  },
] as const;

const CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  tools: true,
  vision: false,
  parallelToolCalls: false,
  systemPrompt: true,
  jsonMode: false,
};

export interface OllamaProviderOptions {
  baseUrl?: string;
  httpClient?: HttpClient;
  defaultModel?: string;
}

/** Provider for local Ollama instances (OpenAI-compatible). */
export class OllamaProvider implements Provider {
  private readonly baseUrl: string;
  private readonly httpClient: HttpClient;
  private readonly defaultModel: string;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? OLLAMA_DEFAULT_URL;
    this.httpClient =
      options.httpClient ??
      new (class {
        async request<T>(): Promise<{ status: number; headers: Record<string, string>; body: T }> {
          throw new Error('No HTTP client configured. Pass one via the httpClient option.');
        }
      })();
    this.defaultModel = options.defaultModel ?? 'llama3.3:70b';
  }

  info(): ProviderInfo {
    return {
      id: 'ollama',
      name: 'Ollama (local)',
      models: [...OLLAMA_MODELS],
      capabilities: CAPABILITIES,
    };
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const body: Record<string, unknown> = {
      model: request.model || this.defaultModel,
      messages: request.messages,
      stream: false,
    };
    if (request.maxOutputTokens) body.max_tokens = request.maxOutputTokens;
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.stopSequences) body.stop = request.stopSequences;

    const res = await this.httpClient.request<{
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    }>({
      url: this.baseUrl,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      signal: request.signal,
    });

    if (res.status >= 400) {
      throw new Error(`Ollama API error ${res.status}`);
    }
    const choice = res.body.choices?.[0];
    if (!choice) throw new Error('Ollama returned no choices');
    return {
      content: choice.message.content,
      model: request.model || this.defaultModel,
      finishReason: choice.finish_reason === 'length' ? 'length' : 'stop',
      usage: res.body.usage
        ? {
            inputTokens: res.body.usage.prompt_tokens,
            outputTokens: res.body.usage.completion_tokens,
          }
        : undefined,
    };
  }
}
